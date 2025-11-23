const pool = require('../db/db');

const ComprasModel = {
  async verificarProducto(producto_id) {
    const result = await pool.query(
      'SELECT producto_id, nombre, unidad_medida FROM productos WHERE producto_id = $1',
      [producto_id]
    );
    return result.rows[0];
  },

  async createCompra(compraData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar cabecera de compra
      const compraResult = await client.query(
        `INSERT INTO compras (
          proveedor_id, numero_factura, fecha_compra, 
          subtotal, total, estado, observaciones, fecha_creacion, usuario_creacion_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING compra_id, numero_factura, fecha_compra, total`,
        [
          compraData.proveedor_id,
          compraData.numero_factura,
          compraData.fecha_compra,
          compraData.subtotal,
          compraData.total,
          compraData.estado,
          compraData.observaciones,
          new Date(),
          compraData.usuario_creacion_id
        ]
      );
      const compra = compraResult.rows[0];

      // 2. Insertar detalles y actualizar stock
      for (const item of compraData.items) {
        // Insertar detalle
        await client.query(
          `INSERT INTO compras_detalle (
            compra_id, producto_id, cantidad, 
            precio_unitario, lote, fecha_vencimiento, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            compra.compra_id,
            item.producto_id,
            item.cantidad,
            item.precio_unitario,
            item.lote || null,
            item.fecha_vencimiento || null,
            (item.cantidad * item.precio_unitario).toFixed(2)
          ]
        );

        // Actualizar stock - lo reemplace por trigger
      }

      await client.query('COMMIT');
      return compra;

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en createCompra:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getCompraById(compra_id, withItems = true) {
  let query = `
    SELECT c.*, p.nombre as proveedor_nombre, p.nit as proveedor_nit`;
  
  if (withItems) {
    query += `,
      json_agg(
        json_build_object(
          'compra_detalle_id', cd.compra_detalle_id,
          'producto_id', cd.producto_id,
          'producto_nombre', pr.nombre,
          'cantidad', cd.cantidad,
          'precio_unitario', cd.precio_unitario,
          'subtotal', cd.subtotal,
          'lote', cd.lote,
          'fecha_vencimiento', cd.fecha_vencimiento,
          'unidad_medida', pr.unidad_medida
        )
      ) as items
    FROM compras c
    JOIN proveedores p ON c.proveedor_id = p.proveedor_id
    LEFT JOIN compras_detalle cd ON c.compra_id = cd.compra_id
    LEFT JOIN productos pr ON cd.producto_id = pr.producto_id
    WHERE c.compra_id = $1
    GROUP BY c.compra_id, p.nombre, p.nit`;
  } else {
    query += `
    FROM compras c
    JOIN proveedores p ON c.proveedor_id = p.proveedor_id
    WHERE c.compra_id = $1`;
  }
  
  const result = await pool.query(query, [compra_id]);
  return result.rows[0];
},

  async listCompras(filters = {}) {
  let query = `
    SELECT c.compra_id, c.numero_factura, c.fecha_compra, 
           c.total, c.estado, p.nombre as proveedor_nombre
    FROM compras c
    JOIN proveedores p ON c.proveedor_id = p.proveedor_id
    WHERE 1=1`;
  
  const params = [];
  let paramIndex = 1;

  // Filtros dinámicos (mantenemos los existentes)
  if (filters.proveedor_id) {
    query += ` AND c.proveedor_id = $${paramIndex++}`;
    params.push(filters.proveedor_id);
  }

  if (filters.estado) {
    query += ` AND c.estado = $${paramIndex++}`;
    params.push(filters.estado);
  }

  if (filters.desde) {
    query += ` AND c.fecha_compra >= $${paramIndex++}`;
    params.push(filters.desde);
  }

  if (filters.hasta) {
    query += ` AND c.fecha_compra <= $${paramIndex++}`;
    params.push(filters.hasta);
  }

  query += ` ORDER BY c.fecha_compra DESC`;

  const comprasResult = await pool.query(query, params);
  const compras = comprasResult.rows;

  // Si no hay compras, retornar array vacío
  if (compras.length === 0) {
    return [];
  }

  // Obtener los items para cada compra
  const comprasIds = compras.map(c => c.compra_id);
  const itemsQuery = `
    SELECT ci.*, p.nombre as producto_nombre, p.unidad_medida
    FROM compras_detalle ci
    JOIN productos p ON ci.producto_id = p.producto_id
    WHERE ci.compra_id = ANY($1)
    ORDER BY ci.compra_id, ci.compra_detalle_id`;
  
  const itemsResult = await pool.query(itemsQuery, [comprasIds]);
  const items = itemsResult.rows;

  // Combinar compras con sus items
  return compras.map(compra => {
    return {
      ...compra,
      items: items.filter(item => item.compra_id === compra.compra_id)
    };
  });
},

  async updateCompraEstado(compra_id, nuevoEstado) {
    const result = await pool.query(
      `UPDATE compras 
       SET estado = $1 
       WHERE compra_id = $2 
       RETURNING compra_id, estado`,
      [nuevoEstado, compra_id]
    );
    return result.rows[0];
  },

  // REEMPLAZA el método deleteCompra:
async deleteCompra(compra_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. PRIMERO eliminar la compra (el trigger de DELETE se encargará del stock)
    const result = await client.query(
      `DELETE FROM compras WHERE compra_id = $1 RETURNING compra_id`,
      [compra_id]
    );

    await client.query('COMMIT');
    return result.rowCount > 0;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
};

module.exports = ComprasModel;