const pool = require('../db/db');
const VentasModel = {
  // Listar todas las ventas
  async listarVentas(filters = {}) {
    let query = `
      SELECT v.*, c.nombre as cliente_nombre, c.nit_ci as cliente_nit
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.cliente_id
      WHERE 1=1`;
    
    const params = [];
    let paramIndex = 1;

    // Filtros
    if (filters.desde) {
      query += ` AND v.fecha_venta >= $${paramIndex++}`;
      params.push(filters.desde);
    }

    if (filters.hasta) {
      query += ` AND v.fecha_venta <= $${paramIndex++}`;
      params.push(filters.hasta);
    }

    if (filters.estado) {
      query += ` AND v.estado = $${paramIndex++}`;
      params.push(filters.estado);
    }

    query += ` ORDER BY v.fecha_venta DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  // En ventasModel.js - función obtenerVentaConDetalle
// En ventasModel.js - función obtenerVentaConDetalle
async obtenerVentaConDetalle(venta_id) {
  try {
    // Obtener venta principal - INCLUYENDO numero_factura
    const ventaQuery = `
      SELECT v.*, c.nombre as cliente_nombre, c.nit_ci as cliente_nit,
             u.nombre as vendedor_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.cliente_id
      LEFT JOIN usuarios u ON v.usuario_creacion_id = u.usuario_id
      WHERE v.venta_id = $1`;
    
    const ventaResult = await pool.query(ventaQuery, [venta_id]);
    if (ventaResult.rows.length === 0) return null;

    // Obtener items de la venta
    const itemsQuery = `
  SELECT vd.*, 
         p.nombre as producto_nombre, 
         p.codigo as producto_codigo,
         p.unidad_medida,
         cp.nombre as combo_nombre,
         cp.precio as combo_precio
  FROM ventas_detalle vd
  LEFT JOIN productos p ON vd.producto_id = p.producto_id
  LEFT JOIN combos cp ON vd.producto_padre_id = cp.combo_id
  WHERE vd.venta_id = $1`;
    
    const itemsResult = await pool.query(itemsQuery, [venta_id]);

    const itemsConSubtotal = itemsResult.rows.map(item => ({
      ...item,
      subtotal: item.subtotal || (item.cantidad * item.precio_unitario)
    }));

    const venta = ventaResult.rows[0];
    
    return {
      ...venta,
      items: itemsConSubtotal,
      subtotal: venta.subtotal || itemsConSubtotal.reduce((sum, item) => sum + item.subtotal, 0),
      total: venta.total || (venta.subtotal - (venta.descuento || 0))
    };
    
  } catch (error) {
    console.error('Error en obtenerVentaConDetalle:', error);
    throw error;
  }
},

  // Crear una nueva venta
  // En ventasModel.js - función crearVenta
async crearVenta(ventaData) {
  const { cliente_id, usuario_creacion_id, numero_factura, items, ...rest } = ventaData;
  
  // Validar que el usuario existe
  const userCheck = await pool.query(
    'SELECT usuario_id FROM usuarios WHERE usuario_id = $1', 
    [usuario_creacion_id]
  );
  
  if (userCheck.rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  // Calcular totales
  const subtotal = rest.subtotal || items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  const total = rest.total || (subtotal - (rest.descuento || 0));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar cabecera de venta - INCLUYENDO numero_factura
    const ventaQuery = `
      INSERT INTO ventas (
        cliente_id, usuario_creacion_id, numero_factura, fecha_venta, 
        subtotal, descuento, total, estado, 
        metodo_pago, observaciones
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING venta_id`;
    
    const ventaValues = [
      cliente_id,
      usuario_creacion_id,
      numero_factura, // ← Número de factura desde el frontend
      rest.fecha_venta || new Date(),
      subtotal,
      rest.descuento || 0,
      total,
      rest.estado || 'COMPLETADA',
      rest.metodo_pago || 'EFECTIVO',
      rest.observaciones || null
    ];

    const ventaResult = await client.query(ventaQuery, ventaValues);
    const ventaId = ventaResult.rows[0].venta_id;

    // 2. Insertar items de venta
    for (const item of items) {
      const itemQuery = `
        INSERT INTO ventas_detalle (
          venta_id, producto_id, cantidad, precio_unitario, subtotal
        ) VALUES ($1, $2, $3, $4, $5)`;
      
      const itemSubtotal = item.cantidad * item.precio_unitario;
      
      await client.query(itemQuery, [
        ventaId,
        item.producto_id,
        item.cantidad,
        item.precio_unitario,
        itemSubtotal
      ]);
    }

    await client.query('COMMIT');
    return ventaId;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
};

module.exports = VentasModel;