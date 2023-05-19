// File to create sub-routes
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { createUser } = require('../db')

// console.log(process.env.JWT_SECRET);

const express = require('express');
const usersRouter = express.Router();

usersRouter.use((req, res, next) => {
    console.log("A request is being made to /users");

    next();
});


const { getAllUsers, getUserByUsername } = require('../db')

usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();

    res.send({
        users: [users]
    });
});

usersRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;
    // console.log(username, password);

    if (!username || !password) {
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        const user = await getUserByUsername(username);
        // console.log(user);

        if (user && user.password == password) {

            const { username, password, id } = user;
            const token = jwt.sign({ username, password, id }, process.env.JWT_SECRET);

            res.send({ message: "you're logged in", token: token });
            // console.log(token);

        } else {
            next({
                name: 'IncorrectCredentialsError',
                message: 'Username or password is incorrect'
            });
        }

    } catch (err) {
        console.log(err);
        next(err);
    }
});

usersRouter.post('/register', async (req, res, next) => {
    const { username, password, name, location } = req.body;

    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists'
            });
        }

        const user = await createUser({
            username,
            password,
            name,
            location,
        });

        const token = jwt.sign({
            id: user.id,
            username
        }, process.env.JWT_SECRET, {
            expiresIn: '1w'
        });

        res.send({
            message: "Thank you for signing up",
            token
        })

    } catch ({ next, message }) {
        next({ name, message });
    }
});

module.exports = usersRouter;