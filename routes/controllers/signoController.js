const fs = require('fs/promises');
const path = require('path');
const User = require('../../databases/user');
const modeCodigo = require('../../databases/codigo');
const regisCodigo = require('../../databases/registroCodigo');
const moment = require('moment-timezone');
const bcrypt = require('bcrypt');
const mongodb = require('../../databases/mongo');
const signToken = _id => JsonWebTokenError.sign({_id}, 'mi-string-secreto');

const validarCredenciales = async (req, res) => {
   const { username, password } = req.body;
   try {
       const user = await User.findOne({ email: username });
       if (!user) {
           res.json('Credenciales incorrectas, verifique usuario o contraseña');
        } else {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    const id = user.id;
                    if (user.rol === 'user') {
                        res.json({
                        usuario: "user",
                     id: id
                    });
                    } else {
            
                    res.json({
                    usuario: "admin",
                    });
                    }
                }
            }
    } catch (error) {
        console.error('Error al validar credenciales:', error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
}

const registroCredenciales = async (req, res) => {
    const { ...addcredenciales } = req.body;
    const { email, password, nombre, cedula, telefono, ciudad, fecha, rol } = addcredenciales;

    try {
        const isUser = await User.findOne({ email: email });
        if (isUser) {
            return res.json('Usuario ya registrado');
        }

        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);
        await User.create({
            rol: rol, email: email, password: hashed, salt,
            nombre: nombre, cedula: cedula, telefono: telefono, ciudad: ciudad, fechaNacimiento: fecha,
        });
        res.json('Registro exitoso');
    } catch (err) {
        console.log('Error al registrar usuario:', err);
        res.status(500).send('Error al realizar el registro');
    }
}

const registarAdmin = async (req, res) => {
    const { ...addcredenciales } = req.body;
    const { email, password, rol } = addcredenciales;

    try {
        const isUser = await User.findOne({ email: email });
        if (isUser) {
            return res.json('Administrador ya registrado');
        }

        const salt = await bcrypt.genSalt();
        const hashed = await bcrypt.hash(password, salt);
        await User.create({ rol: rol, email: email, password: hashed, salt });
        res.json('Administrador registrado exitosamente');
    } catch (err) {
        console.log('Error al registrar administrador:', err);
        res.status(500).send('Error al realizar el registro');
    }
}

const generarCodigo = async () => {
    const DateTime = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
    const estado = "libre";
    const premio = "sigue intentando";

    console.log("Inicio de generación de códigos");

    try {
        for (let i = 0; i <= 999; i++) {
            let numeroFormateado = i.toString().padStart(3, '0');
            const codigoExistente = await modeCodigo.findOne({ codigoNumero: numeroFormateado });
            if (codigoExistente) continue;

            await modeCodigo.create({ codigoNumero: numeroFormateado, premio: premio, estado: estado, fecha: DateTime });
        }

        let numerosSeleccionados = [];
        while (numerosSeleccionados.length < 900) {
            let numero = Math.floor(Math.random() * 1000);
            let numeroFormateado = numero.toString().padStart(3, '0');
            if (!numerosSeleccionados.includes(numeroFormateado)) {
                numerosSeleccionados.push(numeroFormateado);
            }
        }

        const premios = [
            ...Array(300).fill('$1.000.000'),
            ...Array(300).fill('$500.000'),
            ...Array(300).fill('$100.000')
        ];

        for (let i = 0; i < numerosSeleccionados.length; i++) {
            await modeCodigo.findOneAndUpdate(
                { codigoNumero: numerosSeleccionados[i] },
                { $set: { premio: premios[i] } },
                { new: true }
            );
        }

    } catch (err) {
        console.error('Error al generar códigos:', err);
    }
}

const registarCodigo = async (req, res) => {
    const DateTime = moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
    //const { codigo } = req.body;
    const { numero, usuario } = req.body;

    try {
        const Codigol = await modeCodigo.findOne({ codigoNumero: numero });
        if (!Codigol) {
            return res.json('Código no existe');
        }

        if (Codigol.estado === "utilizado") {
            return res.json('Código ya utilizado');
        }

        await modeCodigo.findOneAndUpdate(
            { codigoNumero: numero },
            { $set: { estado: 'utilizado' } },
            { new: true }
        );

        const CodigoR = await regisCodigo.findOne({ codigoNumero: numero });
        if (CodigoR) {
            return res.json('Código ya registrado');
        }

        await regisCodigo.create({ codigoNumero: numero, usuario: usuario, fecha: DateTime });
        res.json("Registro de código exitoso");

    } catch (err) {
        console.log('Error al registrar código:', err);
        res.status(500).send('Error en el registro de código');
    }
};

const ganadores = async (req, res) => {
    const { valor } = req.params;

    try {
        const registros = await modeCodigo.find({ estado: valor }).sort({ fecha: -1 });

        const resultados = await Promise.all(
            registros.map(async (registro) => {
                if (registro.premio != "sigue intentando") {
                    const usadoCodigo = await regisCodigo.findOne({ codigoNumero: registro.codigoNumero });
                    const usuario = await User.findOne({ _id: usadoCodigo.usuario });
                    return {
                        fecha: usadoCodigo.fecha,
                        nombre: usuario.nombre,
                        cedula: usuario.cedula,
                        telefono: usuario.telefono,
                        codigo: usadoCodigo.codigoNumero,
                        premio: registro ? registro.premio : null,
                    };
                }
            })
        );

        const resultadosFiltrados = resultados.filter(resultado => resultado !== undefined);
        res.json(resultadosFiltrados);

    } catch (err) {
        console.log('Error al obtener ganadores:', err);
        res.status(500).send('Error al obtener ganadores');
    }
};

const renderizar = async (req, res) => {
    const { iduser } = req.params;

    try {
        const registros = await regisCodigo.find({ usuario: iduser }).sort({ fecha: -1 });

        const resultados = await Promise.all(
            registros.map(async (registro) => {
                const usadoCodigo = await modeCodigo.findOne({ codigoNumero: registro.codigoNumero });
                return {
                    fecha: registro.fecha,
                    codigo: registro.codigoNumero,
                    premio: usadoCodigo ? usadoCodigo.premio : null,
                };
            })
        );

        res.json(resultados);

    } catch (err) {
        console.log('Error al obtener registros de usuario:', err);
        res.status(500).send('Error al obtener registros');
    }
};

module.exports = {
    validarCredenciales,
    registroCredenciales,
    registarCodigo,
    registarAdmin,
    ganadores,
    renderizar,
    generarCodigo,
}
