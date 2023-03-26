from wordpress_xmlrpc import Client, WordPressPost
from wordpress_xmlrpc.methods.posts import NewPost

# Set up the WordPress client
wp = Client('https://your-site.com/xmlrpc.php', 'your-username', 'your-password')

# Create a new WordPress post
post = WordPressPost()
post.title = 'New post title'
post.content = 'New post content'
post.terms_names = {
    'post_tag': ['tag1', 'tag2'],
    'category': ['category1', 'category2']
}

# Submit the post to WordPress
wp.call(NewPost(post))
