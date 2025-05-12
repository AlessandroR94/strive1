const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendWelcomeEmail = async (author) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: author.email,
            subject: 'Benvenuto nella piattaforma!',
            html: `<h1>Ciao ${author.nome}!</h1>
                   <p>Benvenuto nella nostra piattaforma di blogging.</p>`
        });
    } catch (error) {
        console.error('Errore nell\'invio dell\'email:', error);
    }
};

const sendNewPostEmail = async (author, post) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: author.email,
            subject: 'Nuovo post pubblicato!',
            html: `<h1>Post pubblicato con successo!</h1>
                   <p>Il tuo post "${post.title}" è stato pubblicato.</p>`
        });
    } catch (error) {
        console.error('Errore nell\'invio dell\'email:', error);
    }
};

module.exports = { sendWelcomeEmail, sendNewPostEmail };