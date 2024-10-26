const mongoose = require('mongoose');

const codigoSchema = new mongoose.Schema({
    
   
    codigoNumero: { type: String, required: true },
    premio:{type:String},
    estado:{type:String, required: true},
    fecha:{type:Date, required: true}
    
});

const Codigo = mongoose.model('Codigo', codigoSchema);

module.exports = Codigo;

