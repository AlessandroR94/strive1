const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    dataDiNascita: { type: Date, required: true },
    avatar: { type: String, required: true }
});

module.exports = {
    Author: mongoose.model('Author', authorSchema),
    authorSchema: authorSchema
};