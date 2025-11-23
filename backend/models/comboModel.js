const pool = require('../db/db');

const ComboModel = {
  listar: async () => {
    const query = `
      SELECT c.*, 
             json_agg(
               json_build_object(
                 'ingrediente_id', ci.ingrediente_id,
                 'producto_id', ci.producto_id,
                 'nombre_producto', p.nombre,
                 'unidad_medida', p.unidad_medida,
                 'cantidad', ci.cantidad
               )
             ) AS ingredientes
      FROM combos c
      LEFT JOIN combo_ingredientes ci ON c.combo_id = ci.combo_id
      LEFT JOIN productos p ON ci.producto_id = p.producto_id
      GROUP BY c.combo_id
      ORDER BY c.combo_id`;
    
    const result = await pool.query(query);
    return result.rows;
  },


  obtenerPorId: async (id) => {
    const query = `
      SELECT c.*, 
             json_agg(
               json_build_object(
                 'ingrediente_id', ci.ingrediente_id,
                 'producto_id', ci.producto_id,
                 'nombre_producto', p.nombre,
                 'unidad_medida', p.unidad_medida,
                 'cantidad', ci.cantidad
               )
             ) AS ingredientes
      FROM combos c
      LEFT JOIN combo_ingredientes ci ON c.combo_id = ci.combo_id
      LEFT JOIN productos p ON ci.producto_id = p.producto_id
      WHERE c.combo_id = $1
      GROUP BY c.combo_id`;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

 crear: async (combo) => {
    const { nombre, descripcion, precio } = combo;
    const result = await pool.query(
      `INSERT INTO combos (nombre, descripcion, precio, creado_en)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [nombre, descripcion, precio]
    );
    return result.rows[0];
  },

  actualizar: async (id, combo) => {
    const { nombre, descripcion, precio } = combo;
    const result = await pool.query(
      `UPDATE combos
       SET nombre = $1, descripcion = $2, precio = $3
       WHERE combo_id = $4 RETURNING *`,
      [nombre, descripcion, precio, id]
    );
    return result.rows[0];
  },

  eliminar: async (id) => {
    // La relación con CASCADE en la tabla combo_ingredientes eliminará automáticamente los ingredientes
    const result = await pool.query("DELETE FROM combos WHERE combo_id = $1", [id]);
    return result.rowCount > 0;
  },

  // Métodos específicos para ingredientes
  agregarIngrediente: async (comboId, ingrediente) => {
    const { producto_id, cantidad } = ingrediente;
    const result = await pool.query(
      `INSERT INTO combo_ingredientes (combo_id, producto_id, cantidad)
       VALUES ($1, $2, $3) RETURNING *`,
      [comboId, producto_id, cantidad]
    );
    return result.rows[0];
  },

  actualizarIngrediente: async (ingredienteId, ingrediente) => {
    const { producto_id, cantidad } = ingrediente;
    const result = await pool.query(
      `UPDATE combo_ingredientes
       SET producto_id = $1, cantidad = $2
       WHERE ingrediente_id = $3 RETURNING *`,
      [producto_id, cantidad, ingredienteId]
    );
    return result.rows[0];
  },

  eliminarIngrediente: async (ingredienteId) => {
    const result = await pool.query(
      "DELETE FROM combo_ingredientes WHERE ingrediente_id = $1",
      [ingredienteId]
    );
    return result.rowCount > 0;
  },

  obtenerIngredientesPorCombo: async (comboId) => {
    const query = `
      SELECT ci.*, p.nombre as nombre_producto, p.unidad_medida
      FROM combo_ingredientes ci
      JOIN productos p ON ci.producto_id = p.producto_id
      WHERE ci.combo_id = $1
      ORDER BY ci.ingrediente_id`;
    
    const result = await pool.query(query, [comboId]);
    return result.rows;
  }
};

module.exports = ComboModel;