// File to create sub-routes
const express = require('express');
const postsRouter = express.Router();

const { requireUser } = require('./utils');
const { createPost } = require('../db')


postsRouter.use((req, res, next) => {
    console.log("A request is being made to /posts");

    next();
});


postsRouter.post('/', requireUser, async (req, res, next) => {
    const { title, content, tags = "" } = req.body;

    // Will remove white spaces then split will return the string into an array by spaces
    const tagArr = tags.trim().split(/\s+/);
    const postData = {};

    // only send tags if there are some to send
    if (tagArr.length) {
        postData.tags = tagArr;
    }

    // Successful post creation: curl http://localhost:3000/api/posts -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsYmVydCIsInBhc3N3b3JkIjoiYmVydGllOTkiLCJpZCI6MSwiaWF0IjoxNjg0MzkyMjE4fQ.X71901BcLrSvKOTckzYC9xHA4QJ3HGFNqSXPctKIKE0' -H 'Content-Type: application/json' -d '{"title": "test post", "content": "how is this?", "tags": " #once #twice    #happy"}'
    // Failed post creation: curl http://localhost:3000/api/posts -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsYmVydCIsInBhc3N3b3JkIjoiYmVydGllOTkiLCJpZCI6MSwiaWF0IjoxNjg0MzkyMjE4fQ.X71901BcLrSvKOTckzYC9xHA4QJ3HGFNqSXPctKIKE0' -H 'Content-Type: application/json' -d '{"title": "test post", "tags": " #once #twice    #happy"}'
    try {
        postData.authorId = req.user.id;
        postData.title = title;
        postData.content = content;

        console.log(postData.authorId);

        const post = await createPost(postData);

        res.send(post);
    } catch ({ name, message }) {
        next({ name, message })
    }

    res.send({ message: 'Under construction' });
});

const {
    getAllPosts,
    updatePost,
    getPostById
} = require('../db');
const apiRouter = require('.');


// Gets all active posts
postsRouter.get('/', async (req, res, next) => {
    try {
        const allPosts = await getAllPosts();
        const posts = allPosts.filter(post => {
            
            // post is active and doesn't matter who it belongs to
            if (post.active) {
                return true;
            }

            // post is active and belongs to user making the request
            if (post.active && post.author.id === req.user.id) {
                return true;
            }

        })
    
        res.send({
            posts: [posts]
        });

    } catch ({ name, message }) {
        next({ name, message })
    }


});

postsRouter.patch('/:postId', requireUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;

    // console.log("postId: ", postId, "postTitle: ", title, "postContent: ", content, tags);
    const updateFields = {};

    if (tags && tags.length > 0) {
        updateFields.tags = tags.trim().split(/\s+/);
    }

    if (title) {
        updateFields.title = title;
    }

    if (content) {
        updateFields.content = content;
    }

    try {
        const originalPost = await getPostById(postId);
        // console.log(originalPost);
        // console.log(updateFields);
        // Ensuring post to update is owned by user tryng to update
        if (originalPost.author.id === req.user.id) {
            const updatedPost = await updatePost(postId, updateFields);

            res.send({ post: updatedPost });
        } else {
            next({
                name: 'UnauthorizedUserError',
                message: 'You cannot update a post that is not yours'
            });
        }

    } catch ({ name, message }) {
        next({ name, message })
    }

});

postsRouter.delete('/:postId', requireUser, async (req, res, next) => {
    try {
        const post = await getPostById(req.params.postId);

        if (post && post.author.id === req.user.id) {
            const updatedPost = await updatePost(post.id, { active: false });

            res.send({ post: updatedPost });
        } else {
            next(post ? {
                name: "UnauthorizedUserError",
                message: "You cannot delete a post which is not yours"
            } : {
                name: "PostNotFoundError",
                message: "That post does not exists"
            });
        }

    } catch ({ name, message }) {
        next({ name, message });
    }
})

// curl http://localhost:3000/api/posts/1 -X DELETE -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsYmVydCIsInBhc3N3b3JkIjoiYmVydGllOTkiLCJpZCI6MSwiaWF0IjoxNjg0NDUyODg3fQ.t6GjazdmrJOVgLdYOKmLU_Jy2Z-VGZTdjI290d_iSXg'


module.exports = postsRouter;