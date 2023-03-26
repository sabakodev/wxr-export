import posts from '../export.json' assert {type: 'json'}
import { SingleBar, Presets } from 'cli-progress'

let authors = []

const bar1 = new SingleBar({
	synchronousUpdate: true
}, Presets.shades_classic)

bar1.start(posts.length, 0)

for (const post of posts) {
	// authors.push(...post.author)
	authors.push(post.author[0].email.match(/^([^@]*)@/)[0])

	bar1.increment()
}

// const uniqueAuthor = authors.filter((value, index, self) =>
// 	index === self.findIndex((t) => (
// 		t.place === value.place && t.name === value.name
// 	))
// )

bar1.stop()

// console.log(uniqueAuthor)
console.log(authors)