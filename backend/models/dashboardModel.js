// models/dashboardModel.js
const pool = require('../db/db');

const Dashboard = {
  // Obtener estadísticas generales del dashboard
  getDashboardStats: async () => {
    try {
      // Ventas de las últimas 24 horas
      const salesQuery = `
        SELECT 
          COUNT(*) as total_sales,
          COALESCE(SUM(total), 0) as total_revenue,
          COUNT(DISTINCT cliente_id) as total_customers
        FROM ventas 
        WHERE fecha_venta >= NOW() - INTERVAL '24 HOURS'
      `;
      
      const salesResult = await pool.query(salesQuery);
      
      // Productos con stock bajo
      const lowStockQuery = `
        SELECT COUNT(*) as low_stock_count
        FROM products 
        WHERE stock_actual <= stock_minimo AND activo = true
      `;
      
      const lowStockResult = await pool.query(lowStockQuery);
      
      // Combinar resultados
      return {
        totalSales: parseInt(salesResult.rows[0].total_sales),
        totalRevenue: parseFloat(salesResult.rows[0].total_revenue),
        totalCustomers: parseInt(salesResult.rows[0].total_customers),
        lowStockProducts: parseInt(lowStockResult.rows[0].low_stock_count)
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  },

  // Obtener datos para gráficos de ventas
  getSalesChartData: async (timeRange = '24h') => {
    try {
      let interval;
      switch (timeRange) {
        case '7d':
          interval = '1 DAY';
          break;
        case '30d':
          interval = '1 DAY';
          break;
        case '24h':
        default:
          interval = '1 HOUR';
          break;
      }
      
      const query = `
        SELECT 
          DATE_TRUNC('${interval}', fecha_venta) as time_period,
          COUNT(*) as sales_count,
          COALESCE(SUM(total), 0) as revenue
        FROM ventas 
        WHERE fecha_venta >= NOW() - INTERVAL '${getIntervalValue(timeRange)}'
        GROUP BY DATE_TRUNC('${interval}', fecha_venta)
        ORDER BY time_period
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error obteniendo datos de gráfico: ${error.message}`);
    }
  },

  // Obtener productos más vendidos
  getTopProducts: async (limit = 5) => {
    try {
      const query = `
        SELECT 
          p.nombre,
          p.producto_id,
          SUM(vd.cantidad) as total_vendido,
          SUM(vd.subtotal) as ingresos_totales
        FROM ventas_detalle vd
        JOIN products p ON vd.producto_id = p.producto_id
        JOIN ventas v ON vd.venta_id = v.venta_id
        WHERE v.fecha_venta >= NOW() - INTERVAL '7 DAYS'
        GROUP BY p.producto_id, p.nombre
        ORDER BY total_vendido DESC
        LIMIT $1
      `;
      
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error obteniendo productos top: ${error.message}`);
    }
  }
};

// Función auxiliar para determinar el intervalo de tiempo
function getIntervalValue(timeRange) {
  switch (timeRange) {
    case '7d':
      return '7 DAYS';
    case '30d':
      return '30 DAYS';
    case '24h':
    default:
      return '24 HOURS';
  }
}

module.exports = Dashboard;