const {
  getAllProductos,
  getProductoById,
  getProductoByCodigo,
  createProducto,
  updateProducto,
  deleteProducto
} = require('../models/productoModel');

// Obtener todos los productos
exports.getProductos = async (req, res) => {
  try {
    const productos = await getAllProductos();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

// Obtener un producto por ID
exports.getProducto = async (req, res) => {
  try {
    const producto = await getProductoById(req.params.id);
    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el producto', error: error.message });
  }
};

// Crear un nuevo producto
exports.createProducto = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); // Debug
    
    // Verificar si el código ya existe
    const productoExistente = await getProductoByCodigo(req.body.codigo);
    if (productoExistente) {
      return res.status(400).json({ message: 'El código de producto ya existe' });
    }

    // Validación mejorada
    const requiredFields = ['codigo', 'nombre', 'precio_venta', 'usuario_id'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Campos requeridos faltantes',
        missingFields
      });
    }

    // Asegurar tipos de datos correctos
    const productoData = {
      ...req.body,
      precio_venta: parseFloat(req.body.precio_venta),
      stock_actual: parseInt(req.body.stock_actual) || 0,
      stock_minimo: parseInt(req.body.stock_minimo) || 0,
      es_terminado: Boolean(req.body.es_terminado),
      activo: Boolean(req.body.activo)
    };

    const nuevoProducto = await createProducto(productoData);
    res.status(201).json(nuevoProducto);

  } catch (error) {
    console.error('Error en createProducto:', error);
    res.status(500).json({ 
      message: 'Error al crear producto',
      error: error.message,
      stack: error.stack // Solo para desarrollo
    });
  }
};

// Actualizar un producto
// Actualizar un producto (versión sin middleware de autenticación)
exports.updateProducto = async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); // Debug
    console.log('ID de producto recibido:', req.body.producto_id); // Debug
    const producto_id = req.body.producto_id;
    const userId = req.body.usuario_id; // Ahora obtenemos el ID directamente del body

    // Validación básica
    if (!producto_id) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de producto es requerido' 
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario es requerido para registrar la modificación'
      });
    }

    // Obtener producto existente
    const productoExistente = await getProductoById(producto_id);
    if (!productoExistente) {
      return res.status(404).json({ 
        success: false,
        message: 'Producto no encontrado' 
      });
    }

    // Validar campos requeridos
    if (!req.body.codigo || !req.body.nombre || !req.body.precio_venta) {
      return res.status(400).json({ 
        success: false,
        message: 'Código, nombre y precio son requeridos' 
      });
    }

    // Preparar datos para actualización
    const updateData = {
      codigo: req.body.codigo,
      nombre: req.body.nombre,
      descripcion: req.body.descripcion || productoExistente.descripcion,
      tipo_producto: req.body.tipo_producto || productoExistente.tipo_producto,
      es_terminado: Boolean(req.body.es_terminado),
      stock_actual: parseFloat(req.body.stock_actual) || 0,
      stock_minimo: parseFloat(req.body.stock_minimo) || 0,
      unidad_medida: req.body.unidad_medida || productoExistente.unidad_medida,
      costo_unitario: parseFloat(req.body.costo_unitario) || 0,
      precio_venta: parseFloat(req.body.precio_venta),
      activo: Boolean(req.body.activo)
    };

    // Actualizar producto (asegúrate que updateProducto acepta el userId)
    const productoActualizado = await updateProducto(producto_id, updateData, userId);
    
    res.status(200).json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: productoActualizado
    });

  } catch (error) {
    console.error('Error en updateProducto:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar un producto
exports.deleteProducto = async (req, res) => {
  try {
    // Verificar si el producto existe
    const productoExistente = await getProductoById(req.params.id);
    if (!productoExistente) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    await deleteProducto(req.params.id);
    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
};