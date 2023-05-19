// api/index.js

const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');

require('dotenv').config();
const { JWT_SECRET } = process.env;

const express = require('express');
const apiRouter = express.Router();

// JWT middleware 
apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');

    if (!auth) {
    
        next();
    } else if (auth.startsWith(prefix)) {
        const token = auth.slice(prefix.length);

        try {
            const { id } = jwt.verify(token, JWT_SECRET);

            if (id) {
                req.user = await getUserById(id);
                next();
            }

        } catch ({ name, message }) {
            next({ name, message });
        }
    } else {
        next({
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${prefix}`
        });
    }
});

apiRouter.use((req,res,next) => {
    if (req.user) {
        console.log("User is set: ", req.user)
    }

    next();
});

const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
const { token } = require('morgan');
apiRouter.use('/tags', tagsRouter);

apiRouter.use((error, req, res, next) => {
    res.send({
        name: error.name,
        message: error.message
    });
});

module.exports = apiRouter;

// Test Login: 
// curl http://localhost:3000/api/users/login -H "Content-Type: application/json" -X POST -d '{"username": "albert", "password": "bertie99"}'
// Test authentication: 
// curl http://localhost:3000/api/posts -X POST -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsYmVydCIsInBhc3N3b3JkIjoiYmVydGllOTkiLCJpZCI6MSwiaWF0IjoxNjg0NDYzODk2fQ.L8FXtkzMrH2Sx2Ayl2fKtpDIlhwTErPNfhEiottoQ_U'

// Test Register: 
// # missing a field
// curl http://localhost:3000/api/users/register -H "Content-Type: application/json" -X POST -d '{"username": "syzygy", "password": "stars", "name": "josiah"}' 
// # successful
// curl http://localhost:3000/api/users/register -H "Content-Type: application/json" -X POST -d '{"username": "syzygys", "password": "stars", "name": "josiah", "location": "quebec"}'
// # duplicate username
// curl http://localhost:3000/api/users/register -H "Content-Type: application/json" -X POST -d '{"username": "syzygys", "password": "stars", "name": "josiah", "location": "quebec"}'

