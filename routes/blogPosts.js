
const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const { cloudinary, upload } = require('../config/cloudinary');
const { sendNewPostEmail } = require('../services/emailService');
const Author = require('../models/Author');
const auth = require('../middleware/auth');


router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (req.query.title) {
      query.title = { $regex: req.query.title, $options: 'i' };
    }

    const posts = await BlogPost.find(query)
      .populate('author', 'name email') // 👉 aggiunto
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'name email');

    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post non trovato' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/author/:authorId', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.find({ author: req.params.authorId })
      .populate('author', 'name email')
      .limit(limit);

    const total = await BlogPost.countDocuments({ author: req.params.authorId });

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.put('/:id', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (post) {
            Object.assign(post, req.body);
            const updatedPost = await post.save();
            res.json(updatedPost);
        } else {
            res.status(404).json({ message: 'Post non trovato' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (post) {
            await post.deleteOne();
            res.json({ message: 'Post eliminato' });
        } else {
            res.status(404).json({ message: 'Post non trovato' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

router.post('/', auth, async (req, res) => {
  try {
    const post = new BlogPost({
      category: req.body.category,
      title: req.body.title,
      cover: req.body.cover,
      readTime: {
        value: req.body.readTime.value,
        unit: req.body.readTime.unit
      },
      author: req.user.userId, // 🔒 preso dal token
      content: req.body.content
    });

    const newPost = await post.save();

    const authorUser = await User.findById(req.user.userId);
    if (authorUser) {
      await sendNewPostEmail(authorUser, newPost); // email notifiche (se usi)
    }

    res.status(201).json(newPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/:id/cover', upload.single('cover'), async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trovato' });
        }

        const result = await cloudinary.uploader.upload(req.file.buffer.toString('base64'), {
            folder: 'blog-posts',
            resource_type: 'auto'
        });

        post.cover = result.secure_url;
        await post.save();
        
        res.json({ cover: result.secure_url });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.get('/:id/comments', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trovato' });
        }
        res.json(post.comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/:id/comments/:commentId', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trovato' });
        }
        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Commento non trovato' });
        }
        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/:id/comments', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trovato' });
        }
        post.comments.push({
            author: req.body.author,
            content: req.body.content
        });
        const updatedPost = await post.save();
        res.status(201).json(updatedPost.comments[updatedPost.comments.length - 1]);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.put('/:id/comments/:commentId', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trovato' });
        }
        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Commento non trovato' });
        }
        comment.content = req.body.content;
        await post.save();
        res.json(comment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.delete('/:id/comments/:commentId', async (req, res) => {
    try {
        const post = await BlogPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post non trovato' });
        }
        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Commento non trovato' });
        }
        comment.deleteOne();
        await post.save();
        res.json({ message: 'Commento eliminato con successo' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});