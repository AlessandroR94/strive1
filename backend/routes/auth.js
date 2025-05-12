
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const auth = require('../middleware/auth');




router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        const isMatch = await user.comparePassword(req.body.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenziali non valide' });
        }

        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );


        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(user);
  } catch (error) {
    console.error('Errore /auth/me:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});


router.post('/register', async (req, res) => {
    try {
        const { nome, cognome, email, dataDiNascita, avatar, password } = req.body;


        if (!nome || !cognome || !email || !dataDiNascita || !avatar || !password) {
            return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
        }


        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email già registrata' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = new User({
            nome,
            cognome,
            email,
            dataDiNascita,
            avatar,
            password: hashedPassword,
        });


        await newUser.save();
        console.log("✅ Utente salvato nella collezione:", newUser.collection.name); // Deve stampare "users"


        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );



        return res.status(201).json({ token });
    } catch (error) {
        console.error('❌ Errore durante la registrazione:', error);
        res.status(500).json({ message: 'Errore del server. Riprova più tardi.' });
    }
});


router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);


router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {

    const token = jwt.sign(
      { userId: req.user._id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.redirect(`http://localhost:3000/login?token=${token}`);
  }
);

router.put('/me', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Errore durante la modifica del profilo" });
  }
});



module.exports = router;