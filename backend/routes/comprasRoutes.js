const express = require('express');
const router = express.Router();
const ComprasController = require('../controllers/comprasController');

// Ruta para crear una compra
router.post('/', ComprasController.crearCompra);

// Ruta para obtener una compra específica
router.get('/:id', ComprasController.obtenerCompra);
router.get('/:id/detalle', ComprasController.obtenerCompraDetalle);

// Ruta para listar compras (con filtros opcionales)
router.get('/', ComprasController.listarCompras);

// Ruta para cambiar el estado de una compra
router.patch('/:id/estado', ComprasController.cambiarEstadoCompra);

// Ruta para eliminar una compra
router.delete('/:id', ComprasController.eliminarCompra);

module.exports = router;