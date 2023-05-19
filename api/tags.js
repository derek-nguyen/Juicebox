// File to create sub-routes

const express = require('express');
const tagsRouter = express.Router();

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");

    next();
});


const {
    getAllTags,
    getPostsByTagName
} = require('../db')


// tagsRouter.get('/', async (req, res) => {
//     const tags = await getAllTags();

//     res.send({
//         tags: [tags]
//     });

// });


// command to get all posts by tagName
// curl http://localhost:3000/api/tags/%23happy/posts

// command to test for get active posts + owned by user
// curl http://localhost:3000/api/tags/%23happy/posts -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsYmVydCIsInBhc3N3b3JkIjoiYmVydGllOTkiLCJpZCI6MSwiaWF0IjoxNjg0NDUyODg3fQ.t6GjazdmrJOVgLdYOKmLU_Jy2Z-VGZTdjI290d_iSXg'
tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    const tagName = req.params.tagName;
    // const encodedTagName = encodeURIComponent(req.params.tagName)
    // console.log(encodedTagName)

    
    try {
        // use our method to get posts by tag name from the db
        // send out an object to the client {posts: // the posts}

        const AllTagPosts = await getPostsByTagName(tagName)
        // console.log(AllTagPosts);
        // console.log(req.user.id);

        const tagPosts = AllTagPosts.filter(post => {
            if (post.active && post.author.id === req.user.id) {
                return true;
            }

        });

        res.send({ tagPosts });

    } catch ({ name, message }) {
        next({ name, message });
    }
});

module.exports = tagsRouter;