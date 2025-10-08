// src/routes/posts.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const ensureAuth = require('../middleware/ensureAuth');

// GET /api/posts - everyone can read
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email avatar')
      .populate('comments.author', 'name')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts - only authenticated users
router.post('/', ensureAuth, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    const post = await Post.create({
      title,
      content,
      author: req.user._id,
    });

    const populated = await Post.findById(post._id).populate('author', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:id - only author can delete
router.delete('/:id', ensureAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.author || post.author.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments.author', 'name');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post.comments);
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:id/comments - only authenticated users
router.post('/:id/comments', ensureAuth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.comments.push({
      content,
      author: req.user._id,
    });

    await post.save();
    const populated = await Post.findById(post._id).populate('comments.author', 'name');
    res.status(201).json(populated.comments);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
