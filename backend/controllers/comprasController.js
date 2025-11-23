const ComprasModel = require('../models/comprasModel');

const ComprasController = {
  async crearCompra(req, res) {
    try {
      // Validación básica
      if (!req.body.proveedor_id || !req.body.items || req.body.items.length === 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Proveedor y al menos un item son requeridos' 
        });
      }

      // Validar que los productos existan y agregar nombres
      for (const item of req.body.items) {
        const producto = await ComprasModel.verificarProducto(item.producto_id);
        if (!producto) {
          return res.status(400).json({
            success: false,
            message: `Producto con ID ${item.producto_id} no encontrado`
          });
        }
        item.producto_nombre = producto.nombre;
        item.unidad_medida = producto.unidad_medida;
      }

      // Calcular totales
      const subtotal = req.body.items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
      const total = subtotal; // Puedes agregar impuestos aquí si es necesario

      const compraData = {
        proveedor_id: req.body.proveedor_id,
        numero_factura: req.body.numero_factura || null,
        fecha_compra: req.body.fecha_compra || new Date(),
        subtotal,
        total,
        estado: req.body.estado || 'COMPLETADA',
        observaciones: req.body.observaciones || null,
        usuario_creacion_id: req.user?.id || null,
        items: req.body.items
      };

      const nuevaCompra = await ComprasModel.createCompra(compraData);
      
      res.status(201).json({
        success: true,
        data: nuevaCompra
      });

    } catch (error) {
      console.error('Error al crear compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al crear compra',
        error: error.message
      });
    }
  },
  async obtenerCompra(req, res) {
    try {
      const compra = await ComprasModel.getCompraById(req.params.id);
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      res.json({
        success: true,
        data: compra
      });
    } catch (error) {
      console.error('Error al obtener compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener compra',
        error: error.message
      });
    }
  },

async obtenerCompraDetalle(req, res) {
  try {
    const compraId = req.params.id;
    
    // Usamos directamente getCompraById que ya incluye los items
    const compra = await ComprasModel.getCompraById(compraId);
    
    if (!compra) {
      return res.status(404).json({
        success: false,
        message: 'Compra no encontrada'
      });
    }

    // Aseguramos que items siempre sea un array
    if (!compra.items) {
      compra.items = [];
    } else if (!Array.isArray(compra.items)) {
      // En caso de que items venga como objeto (poco probable con json_agg)
      compra.items = [compra.items];
    }
    
    res.json({
      success: true,
      data: compra
    });
  } catch (error) {
    console.error('Error al obtener detalle de compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de compra',
      error: error.message
    });
  }
},

  async listarCompras(req, res) {
  try {
    const filters = {
      proveedor_id: req.query.proveedor_id,
      estado: req.query.estado,
      desde: req.query.desde,
      hasta: req.query.hasta
    };

    const compras = await ComprasModel.listCompras(filters);
    
    res.json({
      success: true,
      data: compras
    });
  } catch (error) {
    console.error('Error al listar compras:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar compras',
      error: error.message
    });
  }
},

  async cambiarEstadoCompra(req, res) {
    try {
      const { nuevoEstado } = req.body;
      
      if (!['COMPLETADA', 'CANCELADA', 'PENDIENTE'].includes(nuevoEstado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado no válido'
        });
      }

      const compra = await ComprasModel.updateCompraEstado(req.params.id, nuevoEstado);
      
      if (!compra) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      res.json({
        success: true,
        data: compra
      });
    } catch (error) {
      console.error('Error al cambiar estado de compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de compra',
        error: error.message
      });
    }
  },

  async eliminarCompra(req, res) {
    try {
      const eliminada = await ComprasModel.deleteCompra(req.params.id);
      
      if (!eliminada) {
        return res.status(404).json({
          success: false,
          message: 'Compra no encontrada'
        });
      }

      res.json({
        success: true,
        message: 'Compra eliminada correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar compra:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar compra',
        error: error.message
      });
    }
  }
};

module.exports = ComprasController;