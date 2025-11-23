// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../db/db'); // Ajusta la ruta

// En tu dashboardRoutes.js - actualizar el endpoint /metricas
router.get('/metricas', async (req, res) => {
  try {
    console.log('Solicitando métricas del dashboard...');

    // 1. Ventas del mes actual
    const ventasMesQuery = `
      SELECT COALESCE(SUM(v.total), 0) as total_ventas
      FROM ventas v
      WHERE DATE_TRUNC('month', v.fecha_venta) = DATE_TRUNC('month', CURRENT_DATE)
      AND v.estado = 'completado'
    `;

    // 2. Compras del mes actual
    const comprasMesQuery = `
      SELECT COALESCE(SUM(c.total), 0) as total_compras
      FROM compras c
      WHERE DATE_TRUNC('month', c.fecha_compra) = DATE_TRUNC('month', CURRENT_DATE)
      AND c.estado = 'completado'
    `;

    // 3. TOTAL de productos registrados (NUEVO)
    const totalProductosQuery = `
      SELECT COUNT(*) as total_productos
      FROM productos p
      WHERE p.activo = true
    `;

    // 4. Productos con stock bajo (lo mantenemos por si lo necesitas después)
    const stockBajoQuery = `
      SELECT COUNT(*) as productos_stock_bajo
      FROM productos p
      WHERE p.stock_actual <= p.stock_minimo
      AND p.activo = true
    `;

    const [
      ventasResult, 
      comprasResult, 
      totalProductosResult, 
      stockResult
    ] = await Promise.all([
      pool.query(ventasMesQuery),
      pool.query(comprasMesQuery),
      pool.query(totalProductosQuery),
      pool.query(stockBajoQuery)
    ]);

    const metricas = {
      ventasMes: parseFloat(ventasResult.rows[0].total_ventas) || 0,
      comprasMes: parseFloat(comprasResult.rows[0].total_compras) || 0,
      totalProductos: parseInt(totalProductosResult.rows[0].total_productos) || 0,
      productosStockBajo: parseInt(stockResult.rows[0].productos_stock_bajo) || 0 // Por si acaso
    };

    console.log('Métricas obtenidas:', metricas);
    
    res.json({
      success: true,
      data: metricas
    });

  } catch (error) {
    console.error('Error en endpoint /metricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas del dashboard',
      error: error.message
    });
  }
});
// En tu dashboardRoutes.js - agregar este endpoint
router.get('/ventas-recientes', async (req, res) => {
  try {
    console.log('Solicitando ventas recientes...');

    const query = `
      SELECT 
        v.venta_id as id,
        v.numero_factura as factura,
        c.nombre as cliente,
        v.fecha_venta as fecha,
        v.total,
        v.estado,
        STRING_AGG(p.nombre, ', ') as productos
      FROM ventas v
      JOIN clientes c ON v.cliente_id = c.cliente_id
      JOIN ventas_detalle vd ON v.venta_id = vd.venta_id
      JOIN productos p ON vd.producto_id = p.producto_id
      WHERE v.estado = 'completado'
      GROUP BY v.venta_id, c.nombre, v.fecha_venta, v.total, v.estado
      ORDER BY v.fecha_venta DESC
      LIMIT 10
    `;

    const result = await pool.query(query);
    
    // Formatear las fechas para mejor visualización
    const ventasFormateadas = result.rows.map(venta => ({
      ...venta,
      fecha: venta.fecha, // devuelves la fecha cruda

      total: parseFloat(venta.total).toLocaleString('es-ES', {
        style: 'currency',
        currency: 'BOB'
      })
    }));

    console.log(`Ventas recientes obtenidas: ${ventasFormateadas.length}`);
    
    res.json({
      success: true,
      data: ventasFormateadas
    });

  } catch (error) {
    console.error('Error en endpoint /ventas-recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas recientes',
      error: error.message
    });
  }
});
// En tu dashboardRoutes.js - agregar este endpoint
router.get('/productos-mas-vendidos', async (req, res) => {
  try {
    const { periodo = 'semana' } = req.query;
    
    let whereClause = '';
    const ahora = new Date();

    switch (periodo) {
      case 'dia':
        whereClause = `WHERE v.fecha_venta >= CURRENT_DATE`;
        break;
      case 'semana':
        whereClause = `WHERE v.fecha_venta >= DATE_TRUNC('week', CURRENT_DATE)`;
        break;
      case 'mes':
        whereClause = `WHERE v.fecha_venta >= DATE_TRUNC('month', CURRENT_DATE)`;
        break;
      case 'año':
        whereClause = `WHERE v.fecha_venta >= DATE_TRUNC('year', CURRENT_DATE)`;
        break;
      default:
        whereClause = `WHERE v.fecha_venta >= DATE_TRUNC('week', CURRENT_DATE)`;
    }

    const query = `
      SELECT 
        p.nombre as producto,
        p.nombre as full_name,
        COUNT(vd.venta_detalle_id) as ventas,
        SUM(vd.cantidad) as cantidad,
        SUM(vd.subtotal) as total_ventas
      FROM ventas_detalle vd
      JOIN productos p ON vd.producto_id = p.producto_id
      JOIN ventas v ON vd.venta_id = v.venta_id
      ${whereClause}
      AND v.estado = 'completado'
      GROUP BY p.producto_id, p.nombre
      ORDER BY ventas DESC, cantidad DESC
      LIMIT 10
    `;

    const result = await pool.query(query);
    
    const datosFormateados = result.rows.map(item => ({
      producto: item.producto.length > 15 ? item.producto.substring(0, 15) + '...' : item.producto,
      fullName: item.producto,
      ventas: parseInt(item.ventas),
      cantidad: parseInt(item.cantidad),
      totalVentas: parseFloat(item.total_ventas)
    }));

    res.json({
      success: true,
      data: datosFormateados,
      periodo: periodo
    });

  } catch (error) {
    console.error('Error en endpoint /productos-mas-vendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos más vendidos',
      error: error.message
    });
  }
});

module.exports = router;