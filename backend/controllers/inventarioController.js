const {
  getAllMovimientos,
  getTotalMovimientos,
  getMovimientoById,
  createMovimiento,
  getMovimientosByProducto,
  getResumenMovimientos,
  getUltimoMovimientoProducto,
  updateStockProducto,
  getProductoById
} = require('../models/inventarioModel');

// Obtener todos los movimientos con filtros y paginación
exports.getMovimientos = async (req, res) => {
  try {
    const { 
      tipo_movimiento, 
      fecha_desde, 
      fecha_hasta, 
      producto_id,
      page = 1, 
      limit = 10 
    } = req.query;

    const filtros = {
      tipo_movimiento,
      fecha_desde,
      fecha_hasta,
      producto_id,
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const movimientos = await getAllMovimientos(filtros);
    const total = await getTotalMovimientos(filtros);

    res.status(200).json({
      success: true,
      data: movimientos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener movimientos', 
      error: error.message 
    });
  }
};

// Obtener un movimiento por ID
exports.getMovimiento = async (req, res) => {
  try {
    const movimiento = await getMovimientoById(req.params.id);
    
    if (!movimiento) {
      return res.status(404).json({ 
        success: false,
        message: 'Movimiento no encontrado' 
      });
    }

    res.status(200).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el movimiento', 
      error: error.message 
    });
  }
};

// Crear un nuevo movimiento (para compras, ventas, ajustes)
exports.createMovimiento = async (req, res) => {
  try {
    const {
      producto_id,
      tipo_movimiento,
      cantidad,
      referencia_id,
      referencia_tipo,
      observaciones,
      usuario_id
    } = req.body;

    // Validaciones básicas
    if (!producto_id || !tipo_movimiento || !cantidad || !usuario_id) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: producto_id, tipo_movimiento, cantidad, usuario_id'
      });
    }

    // Verificar que el producto existe
    const producto = await getProductoById(producto_id);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener saldo anterior (último movimiento o stock actual del producto)
    let saldoAnterior;
    const ultimoMovimiento = await getUltimoMovimientoProducto(producto_id);
    saldoAnterior = ultimoMovimiento !== undefined ? ultimoMovimiento : parseFloat(producto.stock_actual);

    let saldoPosterior;

    // Calcular nuevo saldo según el tipo de movimiento
    if (tipo_movimiento === 'entrada') {
      saldoPosterior = saldoAnterior + parseFloat(cantidad);
    } else if (tipo_movimiento === 'salida') {
      if (saldoAnterior < parseFloat(cantidad)) {
        return res.status(400).json({
          success: false,
          message: 'Stock insuficiente para realizar la salida'
        });
      }
      saldoPosterior = saldoAnterior - parseFloat(cantidad);
    } else if (tipo_movimiento === 'ajuste') {
      saldoPosterior = parseFloat(cantidad); // Para ajustes, la cantidad es el nuevo valor
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipo de movimiento no válido. Use: entrada, salida o ajuste'
      });
    }

    // Crear el movimiento
    const movimientoData = {
      producto_id,
      tipo_movimiento,
      cantidad: Math.abs(parseFloat(cantidad)),
      saldo_anterior: saldoAnterior,
      saldo_posterior: saldoPosterior,
      referencia_id,
      referencia_tipo,
      observaciones,
      usuario_id
    };

    const nuevoMovimiento = await createMovimiento(movimientoData);

    // Actualizar stock del producto
    await updateStockProducto(producto_id, saldoPosterior);

    // Obtener el movimiento creado con información completa
    const movimientoCompleto = await getMovimientoById(nuevoMovimiento.movimiento_id);

    res.status(201).json({
      success: true,
      message: 'Movimiento creado exitosamente',
      data: movimientoCompleto
    });

  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear movimiento',
      error: error.message
    });
  }
};

// Obtener movimientos por producto
exports.getMovimientosByProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const movimientos = await getMovimientosByProducto(
      productoId, 
      parseInt(page), 
      parseInt(limit)
    );

    // Obtener total para paginación
    const total = await getTotalMovimientos({ producto_id: productoId });

    res.status(200).json({
      success: true,
      data: movimientos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener movimientos por producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos del producto',
      error: error.message
    });
  }
};

// Obtener resumen/estadísticas de movimientos
exports.getResumenMovimientos = async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const filtros = { fecha_desde, fecha_hasta };
    const estadisticas = await getResumenMovimientos(filtros);

    res.status(200).json({
      success: true,
      data: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener resumen de movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de movimientos',
      error: error.message
    });
  }
};

// Endpoint adicional: Obtener stock actual de un producto
exports.getStockProducto = async (req, res) => {
  try {
    const { productoId } = req.params;
    
    const producto = await getProductoById(productoId);
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener último movimiento para verificar consistencia
    const ultimoSaldo = await getUltimoMovimientoProducto(productoId);
    const stockActual = ultimoSaldo !== undefined ? ultimoSaldo : parseFloat(producto.stock_actual);

    res.status(200).json({
      success: true,
      data: {
        producto_id: producto.producto_id,
        producto_nombre: producto.nombre,
        producto_codigo: producto.codigo,
        stock_actual: stockActual,
        stock_minimo: producto.stock_minimo,
        unidad_medida: producto.unidad_medida,
        ultima_actualizacion: new Date()
      }
    });
  } catch (error) {
    console.error('Error al obtener stock del producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener stock del producto',
      error: error.message
    });
  }
};