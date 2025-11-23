const pool = require('../db/db');

const ProveedorModel = {
  listar: async () => {
    const result = await pool.query("SELECT * FROM proveedores ORDER BY proveedor_id");
    return result.rows;
  },

  obtenerPorId: async (id) => {
    const result = await pool.query("SELECT * FROM proveedores WHERE proveedor_id = $1", [id]);
    return result.rows[0];
  },

  crear: async (proveedor) => {
    const { nombre, nit, direccion, telefono, contacto, activo, usuario_creacion_id } = proveedor;
    const result = await pool.query(
      `INSERT INTO proveedores (nombre, nit, direccion, telefono, contacto, activo, fecha_creacion, usuario_creacion_id)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) RETURNING *`,
      [nombre, nit, direccion, telefono, contacto, activo, usuario_creacion_id]
    );
    return result.rows[0];
  },

  actualizar: async (id, proveedor) => {
    const { nombre, nit, direccion, telefono, contacto, activo } = proveedor;
    const result = await pool.query(
      `UPDATE proveedores
       SET nombre = $1, nit = $2, direccion = $3, telefono = $4, contacto = $5, activo = $6
       WHERE proveedor_id = $7 RETURNING *`,
      [nombre, nit, direccion, telefono, contacto, activo, id]
    );
    return result.rows[0];
  },

  eliminar: async (id) => {
    const result = await pool.query("DELETE FROM proveedores WHERE proveedor_id = $1", [id]);
    return result.rowCount > 0;
  }
};

module.exports = ProveedorModel;
