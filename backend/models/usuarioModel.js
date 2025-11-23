const pool = require('../db/db');

const getAllUsuarios = async () => {
  const { rows } = await pool.query('SELECT * FROM usuarios');
  return rows;
};

const getUsuarioById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario_id = $1', [id]);
  return rows[0];
};

const getUsuarioByUsername = async (username) => {
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);
  return rows[0];
};

const createUsuario = async ({ nombre, username, password_hash, rol }) => {
  const { rows } = await pool.query(
    'INSERT INTO usuarios (nombre, username, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING *',
    [nombre, username, password_hash, rol]
  );
  return rows[0];
};

const updateUsuario = async (id, { nombre, username, rol, activo }) => {
  const { rows } = await pool.query(
    'UPDATE usuarios SET nombre = $1, username = $2, rol = $3, activo = $4, fecha_modificacion = CURRENT_TIMESTAMP WHERE usuario_id = $5 RETURNING *',
    [nombre, username, rol, activo, id]
  );
  return rows[0];
};

async function deleteUsuario(id) {
  // Para PostgreSQL
  const result = await pool.query('DELETE FROM usuarios WHERE usuario_id = $1', [id]);
  return result;
}

module.exports = {
  getAllUsuarios,
  getUsuarioById,
  getUsuarioByUsername,
  createUsuario,
  updateUsuario,
  deleteUsuario,
};