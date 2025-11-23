const pool = require('../db/db');

// Obtener todos los movimientos con filtros
const getAllMovimientos = async (filtros = {}) => {
  const {
    tipo_movimiento,
    fecha_desde,
    fecha_hasta,
    producto_id,
    page = 1,
    limit = 10
  } = filtros;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  // Construir condiciones WHERE dinámicamente
  if (tipo_movimiento) {
    paramCount++;
    whereConditions.push(`im.tipo_movimiento = $${paramCount}`);
    queryParams.push(tipo_movimiento);
  }

  if (producto_id) {
    paramCount++;
    whereConditions.push(`im.producto_id = $${paramCount}`);
    queryParams.push(producto_id);
  }

  if (fecha_desde) {
    paramCount++;
    whereConditions.push(`im.fecha_movimiento >= $${paramCount}`);
    queryParams.push(fecha_desde);
  }

  if (fecha_hasta) {
    paramCount++;
    whereConditions.push(`im.fecha_movimiento <= $${paramCount}`);
    queryParams.push(fecha_hasta + ' 23:59:59'); // Incluir todo el día
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  // Calcular offset para paginación
  const offset = (page - 1) * limit;
  paramCount++;
  queryParams.push(limit);
  paramCount++;
  queryParams.push(offset);

  const query = `
    SELECT 
      im.*,
      p.codigo as producto_codigo,
      p.nombre as producto_nombre,
      p.unidad_medida,
      u.nombre as usuario_nombre,
      u.username
    FROM inventario_movimientos im
    LEFT JOIN productos p ON im.producto_id = p.producto_id
    LEFT JOIN usuarios u ON im.usuario_id = u.usuario_id
    ${whereClause}
    ORDER BY im.fecha_movimiento DESC
    LIMIT $${paramCount - 1} OFFSET $${paramCount}
  `;

  const { rows } = await pool.query(query, queryParams);
  return rows;
};

// Obtener el total de registros para paginación
const getTotalMovimientos = async (filtros = {}) => {
  const { tipo_movimiento, fecha_desde, fecha_hasta, producto_id } = filtros;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  if (tipo_movimiento) {
    paramCount++;
    whereConditions.push(`tipo_movimiento = $${paramCount}`);
    queryParams.push(tipo_movimiento);
  }

  if (producto_id) {
    paramCount++;
    whereConditions.push(`producto_id = $${paramCount}`);
    queryParams.push(producto_id);
  }

  if (fecha_desde) {
    paramCount++;
    whereConditions.push(`fecha_movimiento >= $${paramCount}`);
    queryParams.push(fecha_desde);
  }

  if (fecha_hasta) {
    paramCount++;
    whereConditions.push(`fecha_movimiento <= $${paramCount}`);
    queryParams.push(fecha_hasta + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const query = `SELECT COUNT(*) as total FROM inventario_movimientos ${whereClause}`;
  const { rows } = await pool.query(query, queryParams);
  return parseInt(rows[0].total);
};

// Obtener movimiento por ID
const getMovimientoById = async (id) => {
  const { rows } = await pool.query(`
    SELECT 
      im.*,
      p.codigo as producto_codigo,
      p.nombre as producto_nombre,
      p.unidad_medida,
      u.nombre as usuario_nombre,
      u.username
    FROM inventario_movimientos im
    LEFT JOIN productos p ON im.producto_id = p.producto_id
    LEFT JOIN usuarios u ON im.usuario_id = u.usuario_id
    WHERE im.movimiento_id = $1
  `, [id]);
  return rows[0];
};

// Crear nuevo movimiento
const createMovimiento = async (movimientoData) => {
  const {
    producto_id,
    tipo_movimiento,
    cantidad,
    saldo_anterior,
    saldo_posterior,
    referencia_id,
    referencia_tipo,
    observaciones,
    usuario_id
  } = movimientoData;

  const { rows } = await pool.query(
    `INSERT INTO inventario_movimientos (
      producto_id, tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
      referencia_id, referencia_tipo, observaciones, usuario_id, fecha_movimiento
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    RETURNING *`,
    [
      producto_id, tipo_movimiento, cantidad, saldo_anterior, saldo_posterior,
      referencia_id, referencia_tipo, observaciones, usuario_id
    ]
  );
  return rows[0];
};

// Obtener movimientos por producto
const getMovimientosByProducto = async (productoId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { rows } = await pool.query(`
    SELECT 
      im.*,
      u.nombre as usuario_nombre,
      u.username
    FROM inventario_movimientos im
    LEFT JOIN usuarios u ON im.usuario_id = u.usuario_id
    WHERE im.producto_id = $1
    ORDER BY im.fecha_movimiento DESC
    LIMIT $2 OFFSET $3
  `, [productoId, limit, offset]);

  return rows;
};

// Obtener estadísticas/resumen de movimientos
const getResumenMovimientos = async (filtros = {}) => {
  const { fecha_desde, fecha_hasta } = filtros;

  let whereConditions = [];
  let queryParams = [];
  let paramCount = 0;

  if (fecha_desde) {
    paramCount++;
    whereConditions.push(`fecha_movimiento >= $${paramCount}`);
    queryParams.push(fecha_desde);
  }

  if (fecha_hasta) {
    paramCount++;
    whereConditions.push(`fecha_movimiento <= $${paramCount}`);
    queryParams.push(fecha_hasta + ' 23:59:59');
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';

  const query = `
    SELECT 
      tipo_movimiento,
      COUNT(*) as total_movimientos,
      SUM(cantidad) as total_cantidad
    FROM inventario_movimientos
    ${whereClause}
    GROUP BY tipo_movimiento
    ORDER BY tipo_movimiento
  `;

  const { rows } = await pool.query(query, queryParams);
  return rows;
};

// Obtener el último movimiento de un producto para calcular saldo anterior
const getUltimoMovimientoProducto = async (productoId) => {
  const { rows } = await pool.query(`
    SELECT saldo_posterior 
    FROM inventario_movimientos 
    WHERE producto_id = $1 
    ORDER BY fecha_movimiento DESC, movimiento_id DESC 
    LIMIT 1
  `, [productoId]);
  
  return rows[0] ? parseFloat(rows[0].saldo_posterior) : 0;
};

// Actualizar stock del producto después de un movimiento
const updateStockProducto = async (productoId, nuevoStock) => {
  const { rows } = await pool.query(
    'UPDATE productos SET stock_actual = $1 WHERE producto_id = $2 RETURNING *',
    [nuevoStock, productoId]
  );
  return rows[0];
};

// Obtener producto por ID
const getProductoById = async (productoId) => {
  const { rows } = await pool.query(
    'SELECT * FROM productos WHERE producto_id = $1',
    [productoId]
  );
  return rows[0];
};

module.exports = {
  getAllMovimientos,
  getTotalMovimientos,
  getMovimientoById,
  createMovimiento,
  getMovimientosByProducto,
  getResumenMovimientos,
  getUltimoMovimientoProducto,
  updateStockProducto,
  getProductoById
};