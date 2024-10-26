const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    
    rol: { type: String, required: true },
    nombre: { type: String },
    cedula: { type: String },
    telefono: { type: String },
    ciudad: { type: String },
    fechaNacimiento: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
