const VentasModel = require('../models/ventasModel');

const VentasController = {
  // Listar ventas
  async listarVentas(req, res) {
    try {
      const filters = {
        desde: req.query.desde,
        hasta: req.query.hasta,
        estado: req.query.estado
      };

      const ventas = await VentasModel.listarVentas(filters);
      
      res.json({
        success: true,
        data: ventas
      });
    } catch (error) {
      console.error('Error al listar ventas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al listar ventas',
        error: error.message
      });
    }
  },

  // Obtener detalle de venta
  async obtenerVentaDetalle(req, res) {
    try {
      const ventaId = req.params.id;
      const venta = await VentasModel.obtenerVentaConDetalle(ventaId);
      
      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }

      res.json({
        success: true,
        data: venta
      });
    } catch (error) {
      console.error('Error al obtener venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener venta',
        error: error.message
      });
    }
  },

 // En ventasController.js, modifica la función crearVenta:
// En ventasController.js
async crearVenta(req, res) {
  try {
    console.log('Datos recibidos:', req.body);
    
    const ventaData = req.body;
    
    // Validación de items
    if (!ventaData.items || ventaData.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe incluir al menos un producto'
      });
    }

    // Usar el usuario del middleware o uno por defecto
    ventaData.usuario_creacion_id = req.user?.usuarioId || 3;

    console.log('Creando venta para usuario:', ventaData.usuario_creacion_id);
    
    // Crear la venta y obtener el ID
    const ventaId = await VentasModel.crearVenta(ventaData);
    
    // 🔥 OBTENER LA VENTA COMPLETA CON DETALLES
    const ventaCompleta = await VentasModel.obtenerVentaConDetalle(ventaId);
    
    if (!ventaCompleta) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener los detalles de la venta creada'
      });
    }

    console.log('Venta creada exitosamente:', ventaCompleta);
    
    res.json({
      success: true,
      message: 'Venta creada exitosamente',
      data: ventaCompleta // ← Enviamos todos los datos de la venta
    });

  } catch (error) {
    console.error('Error en crearVenta:', error);
    
    // Manejar error de stock insuficiente específico
    if (error.message.includes('Stock insuficiente')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Manejar error de usuario no encontrado
    if (error.message.includes('Usuario no encontrado')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear venta',
      error: error.message
    });
  }
}
};

module.exports = VentasController;