const express = require('express');
const router = express.Router();
const Author = require('../models/Author');
const { cloudinary, upload } = require('../config/cloudinary');
const { sendWelcomeEmail } = require('../services/emailService');


router.get('/', async (req, res) => {
    try {
        const authors = await Author.find();
        res.json(authors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (author) {
            res.json(author);
        } else {
            res.status(404).json({ message: 'Autore non trovato' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post('/', async (req, res) => {
    const author = new Author({
        nome: req.body.nome,
        cognome: req.body.cognome,
        email: req.body.email,
        dataDiNascita: req.body.dataDiNascita,
        avatar: req.body.avatar
    });

    try {
        const newAuthor = await author.save();
        res.status(201).json(newAuthor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (author) {
            author.nome = req.body.nome || author.nome;
            author.cognome = req.body.cognome || author.cognome;
            author.email = req.body.email || author.email;
            author.dataDiNascita = req.body.dataDiNascita || author.dataDiNascita;
            author.avatar = req.body.avatar || author.avatar;

            const updatedAuthor = await author.save();
            res.json(updatedAuthor);
        } else {
            res.status(404).json({ message: 'Autore non trovato' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (author) {
            await author.remove();
            res.json({ message: 'Autore eliminato' });
        } else {
            res.status(404).json({ message: 'Autore non trovato' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const authors = await Author.find()
            .skip(skip)
            .limit(limit);
        
        const total = await Author.countDocuments();

        res.json({
            authors,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    const author = new Author({
        nome: req.body.nome,
        cognome: req.body.cognome,
        email: req.body.email,
        dataDiNascita: req.body.dataDiNascita,
        avatar: req.body.avatar
    });

    try {
        const newAuthor = await author.save();
        await sendWelcomeEmail(newAuthor);
        res.status(201).json(newAuthor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


router.patch('/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) {
            return res.status(404).json({ message: 'Autore non trovato' });
        }

        const result = await cloudinary.uploader.upload(req.file.buffer.toString('base64'), {
            folder: 'authors',
            resource_type: 'auto'
        });

        author.avatar = result.secure_url;
        await author.save();
        
        res.json({ avatar: result.secure_url });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            nome: req.body.nome,
            cognome: req.body.cognome,
            email: req.body.email,
            dataDiNascita: req.body.dataDiNascita,
            avatar: req.body.avatar,
            password: hashedPassword
        });

        const newUser = await user.save();
        await sendWelcomeEmail(newUser);
        
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ user: newUser, token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});