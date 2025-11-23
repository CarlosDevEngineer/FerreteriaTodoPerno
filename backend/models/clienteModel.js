const pool = require('../db/db');

const ClienteModel = {
  listar: async () => {
    const result = await pool.query("SELECT * FROM clientes ORDER BY cliente_id");
    return result.rows;
  },

  obtenerPorId: async (id) => {
    const result = await pool.query("SELECT * FROM clientes WHERE cliente_id = $1", [id]);
    return result.rows[0];
  },

  crear: async (cliente) => {
    const { nit_ci, nombre, telefono, usuario_creacion_id } = cliente;
    const result = await pool.query(
      `INSERT INTO clientes (nit_ci, nombre, telefono, fecha_creacion, usuario_creacion_id)
       VALUES ($1, $2, $3, NOW(), $4) RETURNING *`,
      [nit_ci, nombre, telefono, usuario_creacion_id]
    );
    return result.rows[0];
  },

  actualizar: async (id, cliente) => {
    const { nit_ci, nombre, telefono } = cliente;
    const result = await pool.query(
      `UPDATE clientes
       SET nit_ci = $1, nombre = $2, telefono = $3
       WHERE cliente_id = $4 RETURNING *`,
      [nit_ci, nombre, telefono, id]
    );
    return result.rows[0];
  },

  eliminar: async (id) => {
    const result = await pool.query("DELETE FROM clientes WHERE cliente_id = $1", [id]);
    return result.rowCount > 0;
  }
};

module.exports = ClienteModel;
