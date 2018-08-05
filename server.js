const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPostsAPI} = require("./models");

const app = express();

app.use(morgan('common'));
app.use(express.json());

app.get('/blog-posts', (req, res) => {
    BlogPostsAPI.find()
    .then(blogposts => {
        res.json({
            blogposts: blogposts.map(blogposts => blogposts.serialize())
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal server error"});
    });
});

app.get('/blog-posts/:id', (req, res) => {
    console.log(req.params.id);
    console.log(BlogPostsAPI.findById(req.params.id));
    BlogPostsAPI
    .findById(req.params.id)
    .then(blogpost => res.json(blogpost.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal server error"});
    });
});

app.post('/blog-posts', jsonParser, (req, res) => {
    const requiredFields = ['title', 'content', 'author'];
    for (let i=0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if (!(field in req.body)) {
            const message = `Missing ${field} in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }
    
    BlogPostsAPI.create({
        title: req.body.title,
        author: {
            firstName: req.body.author.firstName,
            lastName: req.body.author.lastName
        },
        content: req.body.content
    })
    .then(blogpost => res.status(201).json(blogpost.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({message: "Internal server error"});
    });
});

app.put('/blog-posts/:id', jsonParser, (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
        const message = 
            `Request path id (${req.params.id}) and request body id (${req.body.id}) must match`;
        console.error(message);
        return res.status(400).json({message: message});
    }
    const toUpdate = {};
    const updateableFields = ["title", "author", "content"];
    updateableFields.forEach(field => {
        if (field in req.body) {
            toUpdate[field] = req.body[field];
        }
    });
    BlogPostsAPI
    .findByIdAndUpdate(req.params.id, {$set: toUpdate})
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal server error"}));
});

app.delete('/blog-posts/:id', (req, res) => {
    BlogPostsAPI.findByIdAndRemove(req.params.id)
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal server error"}));
});

app.use("*", function(req,res) {
    res.status(404).json({message: "Not Found"});
});

let server;

function runServer(databaseUrl, port = PORT) {
    return new Promise((resolve, reject) => {
        mongoose.connect(databaseUrl, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(port, () => {
                console.log(`Your app is listening on port ${port}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("Closing Server");
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer(DATABASE_URL).catch(err => console.error(err));
}


module.exports = {app, runServer, closeServer};