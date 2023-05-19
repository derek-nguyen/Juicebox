const { error } = require('console');
const {
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
} = require('./index');


// Function should call a query which drops all tables from our database

async function createInitialUsers() {
    try {
        console.log('Starting to create users...')

        await createUser({
            username: 'albert',
            password: 'bertie99',
            name: 'Al Bert',
            location: 'Sidney, Australia'
        });
        await createUser({
            username: 'sandra',
            password: '2sandy4me',
            name: 'Just Sandra',
            location: 'Ain\'t tellin\''
        });
        await createUser({
            username: 'glamgal',
            password: 'soglam',
            name: 'Joshua',
            location: 'Upper East Side'
        });

        console.log('Finished creating users!');
    } catch (err) {
        console.error('Error creating users!');
        throw err;
    }
}

async function createInitialPosts() {
    try {
        const [albert, sandra, glamgal] = await getAllUsers();

        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
            tags: ["#happy", "#youcandoanything"]
        });

        await createPost({
            authorId: sandra.id,
            title: "How does this work?",
            content: "Seriously, does this even do anything?",
            tags: ["#happy", "#worst-day-ever"]
        });

        await createPost({
            authorId: glamgal.id,
            title: "Living the Glam Life",
            content: "Do you even? I swear that half of you are posing.",
            tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
        });

        console.log("Finished creating posts!");
    } catch (error) {
        throw error;
    }
}

async function createInitialTags() {
    try {
        console.log('Starting to create tags...');

        const [happy, sad, inspo, catman] = await createTags([
            '#happy',
            '#worst-day-ever',
            '#youcandoanything',
            '#catmandoeverything'
        ]);

        // console.log(happy, sad, inspo, catman)

        const [postOne, postTwo, postThree] = await getAllPosts();

        // console.log(postOne, [happy, inspo]);

        // await addTagsToPost(postOne.id, [happy, inspo]);
        // await addTagsToPost(postTwo.id, [sad,inspo]);
        // await addTagsToPost(postThree.id, [happy, catman, inspo]);
        
        // console.log("Finished creating tags!");

    } catch (err) {
        console.log("Error creating tags!")
        throw err;
    }
}

async function dropTables() {
    try {
        await client.query(`
            DROP TABLE IF EXISTS post_tags;
            DROP TABLE IF EXISTS tags;
            DROP TABLE IF EXISTS posts;
            DROP TABLE IF EXISTS users;
        `);

        console.log('Finished dropping tables');
    } catch (err) {
        console.error('Error dropping tables');
        throw err;
    }
}

async function createTables() {
    try {
        console.log('Starting to build tables...')

        await client.query(`
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            username varchar(255) UNIQUE NOT NULL,
            password varchar(255) NOT NULL,
            name VARCHAR(255),
            location VARCHAR(255),
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE posts (
            id SERIAL PRIMARY KEY,
            "authorId" INTEGER REFERENCES users(id) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            active BOOLEAN DEFAULT true
        );
        CREATE TABLE tags (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL
        );
        CREATE TABLE post_tags (
            "postId" INTEGER REFERENCES posts(id),
            "tagId" INTEGER REFERENCES tags(id),
            UNIQUE ("postId", "tagId")
        );
        `);

        console.log('Finished building tables!')
    } catch (err) {
        console.error('Error building tables')
        throw err;
    }
}


async function rebuildDB() {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();
        await createInitialTags();
    } catch (err) {
        throw err;
    }
}

async function testDB() {
    try {
        console.log('Starting to test database...')
        // connect the client to the database, finally

        const users = await getAllUsers();

        console.log("Calling updateUser on users[0]")
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });

        console.log('Calling getAllPosts');
        const posts = await getAllPosts();
        // console.log("All Posts Result: ", posts)

        // console.log('Calling updatePost on posts[0]');
        // const updatePostResult = await updatePost(posts[0].id, {
        //     title: "New Title",
        //     content: "Updated Content"
        // });
        // console.log('Post Update Result ', updatePostResult);

        console.log("Calling updatePost on posts[1], only updating tags");
        const updatePostTagsResult = await updatePost(posts[1].id, {
            tags: ["#youcandoanything", "#redfish", "#bluefish"]
        });

        console.log("Calling getPostsByTagName with #happy");
        const postsWithHappy = await getPostsByTagName("#happy");
        console.log("Result: ", postsWithHappy)

        console.log('Calling getUserbyId')
        const albert = await getUserById(users[0].id);
        // console.log('User Result: ', albert);

        console.log('Finished database tests')
    } catch (err) {
        console.error('Error testing database!')
        console.error(err);
    }
}

rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());