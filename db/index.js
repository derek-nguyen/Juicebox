// best practice is to add all utility functions into this file that the entire application will use

const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox-dev')

async function createUser({ username, password, name, location }) {
    try {
        const result = await client.query(`
            INSERT INTO users (username, password, name, location)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING 
            RETURNING *;
        `, [username, password, name, location]);

        return result.rows;
    } catch (err) {
        throw err;
    }
}

async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');

    // return early if this is called without fields
    if (setString.length === 0) {
        return;
    }

    try {
        const { rows: [user] } = await client.query(`
            UPDATE users
            SET ${setString}
            WHERE id=${id}
            RETURNING *;
          `, Object.values(fields));

        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    const { rows } = await client.query(`
        SELECT *
        FROM users;
        `);

    return rows;
}

async function createPost({
    authorId,
    title,
    content,
    tags = []
}) {
    try {
        const { rows: [post] } = await client.query(`
            INSERT INTO posts ("authorId", title, content)
            VALUES ($1, $2, $3)
            RETURNING *;
        `, [authorId, title, content]);

        const tagList = await createTags(tags);

        return await addTagsToPost(post.id, tagList);
    } catch (err) {
        throw err;
    }

}

async function updatePost(postId, fields = {}) {
    const { tags } = fields;
    delete fields.tags;
    // console.log("Deleting existing tags: ", postId, fields)
    // console.log('Object values: ', ...Object.values(fields));

    // build the set string
    const setString = Object.keys(fields).map(
        (key, index) => `"${key}"=$${index + 1}`
    ).join(', ');
    // console.log('setString: Sets column and value: ', setString);

    // Object.keys(fields).length + 1 is used to reference the 2nd element in the array from the 2nd argument
    try {
        if (setString.length > 0) {
            await client.query(`
            UPDATE posts
            SET ${setString}
            WHERE id=$${Object.keys(fields).length + 1}
            RETURNING *;
            `,[...Object.values(fields),postId]);
        }

        // return early if there's no tags to update
        if (tags === undefined) {
            return await getPostById(postId);
        }


        // make any new tags that need to be made
        const tagList = await createTags(tags);
        const tagListIdString = tagList.map(
            tag => `${tag.id}`
        ).join(', ');

        await client.query(`
            DELETE FROM post_tags
            WHERE "tagId"
            NOT IN (${tagListIdString})
            AND "postId"=$1;
        `, [postId]);

        // and create post_tags as necessary
        await addTagsToPost(postId, tagList);

        return await getPostById(postId);
        // return post;
    } catch (error) {
        console.log('error updating post')
        throw error;
    }
}

async function getAllPosts() {
    try {
        const { rows: postIds } = await client.query(`
            SELECT id
            FROM posts;
        `);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));
        return posts;
    } catch (err) {
        throw err
    }
}

async function getPostsByUser(userId) {
    try {
        const { rows: postIds } = await client.query(`
            SELECT *
            FROM posts
            WHERE "authorId" = $1;
        `, [userId]);

        const posts = await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

        return posts;
    } catch (err) {
        throw err
    }
}

async function getPostById(postId) {
    try {
        const { rows: [post] } = await client.query(`
            SELECT *
            FROM posts
            WHERE id = $1
        `, [postId]);

        if (!post) {
            throw {
                name: "PostNotFoundError",
                message: "Could not find a post with that postId"
            };
        }

        const { rows: tags } = await client.query(`
            SELECT tags.*
            FROM tags
            JOIN post_tags ON tags.id = post_tags."tagId"
            WHERE post_tags."postId" = $1
        `, [postId]);

        const { rows: [author] } = await client.query(`
            SELECT id, username, name, location
            FROM users
            WHERE id=$1
        `, [post.authorId]);

        post.tags = tags;
        post.author = author;

        delete post.authorId;

        return post;
    } catch (err) {
        throw err;
    }
}

async function getUserById(userId) {
    try {
        const { rows: [user] } = await client.query(`
            SELECT *
            FROM users
            WHERE id = ${userId};
        `);
        // return user;
        if (user) {
            delete user.password;
            const [userPost] = await getPostsByUser(user.id);
            user.posts = userPost;

            return user;
        } else {
            return
        }

    } catch (err) {
        throw err
    }
}

async function createTags(tagList) {
    if (tagList.length === 0) {
        return;
    }

    // outputs ($n), ($n)...
    const stringInterpolation = tagList.map(
        (_, index) => `($${index + 1})`).join(', ');
    // console.log(stringInterpolation);

    // outputs #value, #value, #value...
    const tagValues = tagList.map(
        (value) => `'${value}'`).join(', ');
    // console.log(tagValues);

    try {
        // (stringInterpolation) ($1), ($2) (commas) will interpret as create rows, while wrapping in one parenthesis will be viewed as single column 
        const insertTags = await client.query(`
            INSERT INTO tags (name)
            VALUES ${stringInterpolation}
            ON CONFLICT (name) DO NOTHING;
        `, tagList);

        const { rows } = await client.query(`
            SELECT *
            FROM tags
            WHERE name IN (${tagValues});
        `);

        // console.log(rows);
        // console.log(tags);
        return rows;

    } catch (err) {
        throw err;
    }
}

async function createPostTag(postId, tagId) {
    try {
        await client.query(`
            INSERT INTO post_tags ("postId", "tagId")
            VALUES ($1, $2)
            ON CONFLICT ("postId", "tagId") DO NOTHING;
        `, [postId, tagId]);

    } catch (err) {
        throw err
    }
}

async function addTagsToPost(postId, tagList) {
    // console.log(tagList)
    try {
        const createPostTagPromises = tagList.map(
            tag => createPostTag(postId, tag.id)
        );

        await Promise.all(createPostTagPromises);

        return await getPostById(postId);
    } catch (err) {
        throw err
    }
}

async function getPostsByTagName(tagName) {
    try {
        const { rows: postIds } = await client.query(`
            SELECT posts.id
            FROM posts
            JOIN post_tags ON posts.id = post_tags."postId"
            JOIN tags ON tags.id = post_tags."tagId"
            WHERE tags.name = $1;
        `, [tagName]);

        return await Promise.all(postIds.map(
            post => getPostById(post.id)
        ));

    } catch (err) {
        throw err
    }
}

async function getAllTags() {
    try {
        const { rows } = await client.query(`
            SELECT *
            FROM tags;
        `);
        
        return rows;
    } catch (err) {
        throw err
    }
}

async function getUserByUsername(username) {
    try {
        const {rows:[user]} = await client.query(`
            SELECT *
            FROM users
            WHERE username = $1;
        `,[username]);

        return user;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    client,
    getAllUsers,
    createUser,
    updateUser,
    createPost,
    getAllPosts,
    updatePost,
    getUserById,
    createTags,
    addTagsToPost,
    getPostById,
    getPostsByTagName,
    getAllTags,
    getUserByUsername,
}