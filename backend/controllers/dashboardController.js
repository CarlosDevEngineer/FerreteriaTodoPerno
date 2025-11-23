// controllers/dashboardController.js
const Dashboard = require('../models/dashboardModel');

const dashboardController = {
  // Obtener datos principales del dashboard
  getDashboardData: async (req, res) => {
    try {
      const stats = await Dashboard.getDashboardStats();
      const salesData = await Dashboard.getSalesChartData('24h');
      const topProducts = await Dashboard.getTopProducts(5);
      
      // Transformar datos para el frontend
      const transformedSalesData = salesData.map(item => ({
        timestamp: item.time_period,
        sales: parseInt(item.sales_count),
        revenue: parseFloat(item.revenue)
      }));
      
      res.json({
        success: true,
        data: {
          stats,
          salesChart: transformedSalesData,
          topProducts
        }
      });
    } catch (error) {
      console.error('Error en getDashboardData:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del dashboard',
        error: error.message
      });
    }
  },

  // Obtener datos específicos para gráficos
  getChartData: async (req, res) => {
    try {
      const { range } = req.query;
      const validRanges = ['24h', '7d', '30d'];
      const timeRange = validRanges.includes(range) ? range : '24h';
      
      const salesData = await Dashboard.getSalesChartData(timeRange);
      
      // Transformar datos para el gráfico
      const chartData = salesData.map(item => ({
        x: item.time_period,
        y: parseFloat(item.revenue)
      }));
      
      res.json({
        success: true,
        data: {
          timeRange,
          chartData
        }
      });
    } catch (error) {
      console.error('Error en getChartData:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del gráfico',
        error: error.message
      });
    }
  },

  // Obtener estadísticas rápidas para las cards
  getCardsData: async (req, res) => {
    try {
      const stats = await Dashboard.getDashboardStats();
      
      // Calcular porcentajes (ejemplo)
      const salesPercentage = 70; // Esto debería calcularse basado en datos históricos
      const revenuePercentage = 80;
      const customersPercentage = 60;
      const stockPercentage = 40;
      
      res.json({
        success: true,
        data: [
          {
            title: "Ventas Totales",
            value: stats.totalSales.toString(),
            barValue: salesPercentage,
            color: {
              backGround: "linear-gradient(180deg, #bb67ff 0%, #c484f3 100%)",
              boxShadow: "0px 10px 20px 0px #e0c6f5",
            }
          },
          {
            title: "Ingresos",
            value: `$${stats.totalRevenue.toFixed(2)}`,
            barValue: revenuePercentage,
            color: {
              backGround: "linear-gradient(180deg, #FF919D 0%, #FC929D 100%)",
              boxShadow: "0px 10px 20px 0px #FDC0C7",
            }
          },
          {
            title: "Clientes",
            value: stats.totalCustomers.toString(),
            barValue: customersPercentage,
            color: {
              backGround: "linear-gradient(rgb(248, 212, 154) -146.42%, rgb(255 202 113) -46.42%)",
              boxShadow: "0px 10px 20px 0px #F9D59B",
            }
          },
          {
            title: "Stock Bajo",
            value: stats.lowStockProducts.toString(),
            barValue: stockPercentage,
            color: {
              backGround: "linear-gradient(180deg, #5ef7ff 0%, #84f7fc 100%)",
              boxShadow: "0px 10px 20px 0px #9be0f9",
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error en getCardsData:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos para las cards',
        error: error.message
      });
    }
  }
};

module.exports = dashboardController;