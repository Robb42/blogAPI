const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const {BlogPostsAPI} = require('./models');

router.get('/', (req, res) => {
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

router.get('/:id', (req, res) => {
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

router.post('/', jsonParser, (req, res) => {
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

router.put('/:id', jsonParser, (req, res) => {
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

router.delete('/:id', (req, res) => {
    BlogPostsAPI.findByIdAndRemove(req.params.id)
    .then(blogpost => res.status(204).end())
    .catch(err => res.status(500).json({message: "Internal server error"}));
});

router.use("*", function(req,res) {
    res.status(404).json({message: "Not Found"});
});

module.exports = router;