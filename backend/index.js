require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
require('./config/passport'); 

const authorsRouter = require('./routes/authors');
const blogPostsRouter = require('./routes/blogPosts');
const authRouter = require('./routes/auth');

const app = express(); 


app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connesso'))
  .catch(err => console.error('Errore connessione MongoDB:', err));

app.use('/auth', authRouter);
app.use('/authors', authorsRouter);
app.use('/blogPosts', blogPostsRouter);


app.get('/api/data', (req, res) => {
  res.json({ message: '' });
});


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server in esecuzione su http://localhost:${port}`);
});
