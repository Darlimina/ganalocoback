const express = require('express');
const router = express.Router();
const signoController = require('./controllers/signoController.js');
router
    // .get('/', signoController.getAllSignos)
    // .get('/:categoriaU/:signoU', signoController.getOneSigno)
    .post('/codigo', signoController.registarCodigo)
    .post('/registro', signoController.registroCredenciales)
    .post('/login',signoController.validarCredenciales)
    .post('/registroadmin',signoController.registarAdmin)
    .get('/traer/:valor',signoController.ganadores)
    .get('/traerusuario/:iduser',signoController.renderizar)
    .post('/generar',signoController.generarCodigo)


module.exports = router;