const usuariosModel = require('../models/usuarioModel');
const bcrypt = require('bcryptjs');

const getAllUsuarios = async (req, res) => {
  try {
    const usuarios = await usuariosModel.getAllUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUsuarioById = async (req, res) => {
  try {
    const usuario = await usuariosModel.getUsuarioById(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUsuario = async (req, res) => {
  try {
    const { password, ...userData } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const newUsuario = await usuariosModel.createUsuario({ ...userData, password_hash });
    res.status(201).json(newUsuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUsuario = async (req, res) => {
  try {
    const updatedUsuario = await usuariosModel.updateUsuario(req.params.id, req.body);
    res.json(updatedUsuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validación básica del ID
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de usuario no válido' });
    }

    // Verificar si el usuario existe antes de eliminar
    const usuarioExistente = await usuariosModel.getUsuarioById(id);
    if (!usuarioExistente) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Evitar que un usuario se elimine a sí mismo
    if (req.user && req.user.usuario_id === parseInt(id)) {
      return res.status(403).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    // Eliminar el usuario
    const resultado = await usuariosModel.deleteUsuario(id);
    
    // PostgreSQL devuelve rowCount
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'No se pudo eliminar el usuario' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};