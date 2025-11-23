const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const usuariosModel = require('../models/usuarioModel');
require('dotenv').config();

const login = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); // ← Añade esto
    const { username, password } = req.body;

    // 1. Verificar si el usuario existe
    const usuario = await usuariosModel.getUsuarioByUsername(username);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuario invalido' });
    }

    // 2. Verificar la contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Constraseña invalida' });
    }

    // 3. Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // 4. Crear el token JWT
    const token = jwt.sign(
      {
        usuario_id: usuario.usuario_id,
        username: usuario.username,
        rol: usuario.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 5. Responder con el token y datos básicos del usuario
    res.json({
      token,
      usuario: {
        usuario_id: usuario.usuario_id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login
};