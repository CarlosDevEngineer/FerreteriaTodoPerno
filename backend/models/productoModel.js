const pool = require('../db/db');

const getAllProductos = async () => {
  const { rows } = await pool.query(`
    SELECT p.*, 
           u1.nombre as usuario_creacion_nombre,
           u2.nombre as usuario_modificacion_nombre
    FROM productos p
    LEFT JOIN usuarios u1 ON p.usuario_creacion_id = u1.usuario_id
    LEFT JOIN usuarios u2 ON p.usuario_modificacion_id = u2.usuario_id
    ORDER BY p.fecha_creacion DESC
  `);
  return rows;
};

const getProductoById = async (id) => {
  const { rows } = await pool.query(`
    SELECT p.*, 
           u1.nombre as usuario_creacion_nombre,
           u2.nombre as usuario_modificacion_nombre
    FROM productos p
    LEFT JOIN usuarios u1 ON p.usuario_creacion_id = u1.usuario_id
    LEFT JOIN usuarios u2 ON p.usuario_modificacion_id = u2.usuario_id
    WHERE p.producto_id = $1
  `, [id]);
  return rows[0];
};

const getProductoByCodigo = async (codigo) => {
  const { rows } = await pool.query('SELECT * FROM productos WHERE codigo = $1', [codigo]);
  return rows[0];
};

const createProducto = async (productoData, usuarioId) => {
  const { 
    codigo, 
    nombre, 
    descripcion, 
    tipo_producto, 
    es_terminado, 
    stock_actual, 
    stock_minimo, 
    unidad_medida, 
    costo_unitario, 
    precio_venta, 
    activo 
  } = productoData;

  const { rows } = await pool.query(
    `INSERT INTO productos (
      codigo, nombre, descripcion, tipo_producto, es_terminado,
      stock_actual, stock_minimo, unidad_medida, costo_unitario,
      precio_venta, activo, usuario_creacion_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      codigo, nombre, descripcion, tipo_producto, es_terminado,
      stock_actual, stock_minimo, unidad_medida, costo_unitario,
      precio_venta, activo, usuarioId
    ]
  );
  return rows[0];
};

async function updateProducto(producto_id, updateData, usuarioId) {
  const query = `
    UPDATE productos 
    SET 
      codigo = $1,
      nombre = $2,
      descripcion = $3,
      tipo_producto = $4,
      es_terminado = $5,
      stock_actual = $6,
      stock_minimo = $7,
      unidad_medida = $8,
      costo_unitario = $9,
      precio_venta = $10,
      activo = $11,
      fecha_modificacion = NOW(),
      usuario_modificacion_id = $13
    WHERE producto_id = $12
    RETURNING *
  `;

  const values = [
    updateData.codigo,
    updateData.nombre,
    updateData.descripcion,
    updateData.tipo_producto,
    updateData.es_terminado,
    updateData.stock_actual,
    updateData.stock_minimo,
    updateData.unidad_medida,
    updateData.costo_unitario,
    updateData.precio_venta,
    updateData.activo,
    producto_id,
    usuarioId // Añadido el usuario que modifica
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}

const deleteProducto = async (id) => {
  await pool.query('DELETE FROM productos WHERE producto_id = $1', [id]);
};

module.exports = {
  getAllProductos,
  getProductoById,
  getProductoByCodigo,
  createProducto,
  updateProducto,
  deleteProducto
};