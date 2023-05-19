// Package to access .env file
require('dotenv').config();

const PORT = 3000;
const express = require('express');
const server = express();

// index.js will automatically be referenced first so it's okay to only reference the folder path
const apiRouter = require('./api')
server.use(express.json());

server.use('/api',apiRouter)

const morgan = require('morgan');
server.use(morgan('dev'));


server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
    
    next();
});

const { client } = require('./db');
client.connect();

server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
});