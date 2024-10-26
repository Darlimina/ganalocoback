const mongoose = require('mongoose');

const RcodigoSchema = new mongoose.Schema({
    
   
    codigoNumero: { type: String, required: true },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fecha:{type:Date, required: true}
    
});

const RCodigo = mongoose.model('RCodigo', RcodigoSchema); 

module.exports = RCodigo; 