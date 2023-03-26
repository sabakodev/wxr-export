import { create, fragment } from 'xmlbuilder2'
import { SingleBar, Presets } from 'cli-progress'
import fs from 'fs'
import { JSDOM } from 'jsdom'

// import posts from './json/sample.json' assert {type: 'json'}
import posts from './output.json' assert {type: 'json'}
import authors from './json/author.json' assert {type: 'json'}

const loadingBar = new SingleBar({
	synchronousUpdate: true,
	etaAsynchronousUpdate: true
}, Presets.shades_classic)

// Duplicate Control
let added = {
	post: [],
	attachment: [],
	source: [],
}

const insertAttachment = (url, id, title, caption, author, post_id) => {
	const attachmentElement = fragment()

	const attached_url = new URL(url.replaceAll('promediateknologi.com', 'promediateknologi.id'))

	attachmentElement.ele('item')
		.ele('title').dat(title + ' ' + id).up()
		.ele('wp:post_id').dat(id).up()
		.ele('wp:post_parent').dat(post_id).up()
		.ele('dc:creator').dat(author).up()
		.ele('wp:attachment_url').dat(attached_url).up()
		.ele('wp:status').dat('publish').up()
		.ele('wp:post_type').dat('attachment').up()
		.ele('wp:post_name').dat((title + ' ' + id).toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')).up()
		.ele('wp:postmeta')
		.ele('wp:meta_key').dat('_wp_attachment_image_alt').up()
		.ele('wp:meta_value').dat(caption).up()
		.ele('wp:postmeta')
		.ele('wp:meta_key').dat('_wp_attached_file').up()
		.ele('wp:meta_value').dat('2023/03/' + attached_url.pathname.replace(/^.*[\\\/]/, '')).up()



	return attachmentElement
}

const createFeaturedImage = (id, photo) => {
	const featuredImage = fragment()

	let galleryId = id + '0'

	if (added.source.includes(photo)) galleryId = added.attachment[added.source.indexOf(photo)]

	featuredImage.ele('wp:post_meta')
		.ele('wp:meta_key')
		.dat('_thumbnail_id')
		.up()
		.ele('wp:meta_value')
		.dat(id + '0')

	return featuredImage
}

const filterContent2Image = (content, ...photos) => {
	const list = content.match(/(<!--)\w+(-->)/g)

	if (list === null) {
		return content
	}

	let id = [],
		gallery = [],
		replaced = ''

	for (const photo of photos) {
		gallery.push({
			source: photo.src.replaceAll('promediateknologi.com', 'promediateknologi.id'),
			caption: photo.caption,
		})
	}

	for (const element of list) {
		id.push(element)
	}

	for (const element of [...new Set(id)]) {
		const photo = gallery[element.match(/\d+/)[0] - 1]

		replaced = content.replaceAll(element, '<img alt="' + photo?.caption + '" src="' + photo?.source + '" />')
	}

	const { document } = new JSDOM(replaced).window

	const imgs = document.querySelectorAll('img')

	imgs.forEach(img => img.parentNode.parentNode.parentNode.insertBefore(img, img.parentNode.parentNode))

	document.querySelectorAll("p strong").forEach(clutter => { if (clutter.outerHTML.includes("Baca Juga")) clutter.parentNode.remove() })

	return document.body.innerHTML
}

const user = fragment()

for (const author of authors) {
	user.ele('wp:author')
		.ele('wp:author_id').txt(author.id).up()
		.ele('wp:author_login').dat(author.email.match(/^([^@]*)@/)[1]).up()
		.ele('wp:author_email').dat(author.email).up()
		.ele('wp:author_display_name').dat(author.name).up()
}

// Split Chunks

const chunkSize = 500

let chunks = []

for (let index = posts.length - 1; index >= 0; index--) {
	const post = posts[index]

	if (added.post.includes(post.id)) {
		posts.splice(index, 1)

		continue
	}

	added.post.push(post.id)
}

loadingBar.start(posts.length, 0)

for (let i = 0; i < posts.length; i += chunkSize) {
	chunks.push(posts.slice(i, i + chunkSize))
}

for (let index = 0; index < chunks.length; index++) {
	// for (let index = 0; index < 1; index++) {
	const xml = create({ version: '1.0', encoding: 'UTF-8' })
		.ele('rss')
		.att('version', 2.0)
		.att('xmlns:excerpt', 'http://wordpress.org/export/1.2/excerpt/')
		.att('xmlns:content', 'http://purl.org/rss/1.0/modules/content/')
		.att('xmlns:wfw', 'http://wellformedweb.org/CommentAPI/')
		.att('xmlns:dc', 'http://purl.org/dc/elements/1.1/')
		.att('xmlns:wp', 'http://wordpress.org/export/1.2/')

	const chunk = chunks[index]

	const items = fragment()

	for (const post of chunk) {
		const creator = (post.author[0].email.match(/^([^@]*)@/) === null) ? 'custodian' : post.author[0].email.match(/^([^@]*)@/)[1]

		loadingBar.increment()

		const tags = fragment()

		for (const tag of post['tag']) {
			if (tag.name === null) {
				continue
			}

			tags.ele('category')
				.att('domain', 'post_tag')
				.att('nicename', tag.name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'))
				.dat(tag.name)
		}

		try {
			items.ele('item')
				.ele('wp:post_id').dat(post.id).up()
				.ele('title').dat(post.title).up()
				.ele('dc:creator').dat(creator).up()
				.ele('content:encoded').dat(filterContent2Image(post.content, ...post.photo)).up()
				.ele('wp:post_date').dat(post.published_date).up()
				.ele('wp:status').dat('publish').up()
				.ele('wp:post_type').dat('post').up()
				.ele('category')
				.att('domain', 'category')
				.att('nicename', post.section.alias)
				.dat(post.section.name)
				.up()
				.import(createFeaturedImage(post.id, (post.photo.length > 0) ? post.photo[0].src : 237))
				.import(tags)

			for (let index = 0; index < post.photo.length; index++) {
				const photo = post.photo[index]

				if (added.source.includes(photo.src)) continue
				if (added.attachment.includes(post.id + '' + index)) continue
				added.source.push(photo.src)
				added.attachment.push(post.id + '' + index)

				// items.import(insertAttachment(photo.src, post.id + '' + index, photo.author, photo.caption, creator, post.id))

				loadingBar.increment()
			}
		} catch (error) {
			console.log(error)

			console.log(post?.photo[0])
		}
	}

	xml.ele('channel')
		.ele('title').txt('Digital Bank').up()
		.ele('link').txt('https://digitalbank.id').up()
		.ele('language').txt('en-US').up()
		.ele('wp:wxr_version').txt('1.2').up()
		.ele('wp:base_site_url').txt('https://digitalbank.id').up()
		.ele('wp:base_blog_url').txt('https://digitalbank.id').up()
		// .import(user)
		.import(items)

	// console.log(xml.end({ prettyPrint: true }))

	fs.writeFile('./xml/splitted/js-export-' + index + '.xml', xml.end({ prettyPrint: false }), err => {
		if (err) console.log(err)
	})
}

loadingBar.stop()

console.log(added.post.length)
console.log(added.attachment.length)
console.log(added.source.length)
