const express = require('express');
const router = express.Router();
const ComboController = require('../controllers/comboController');

// Rutas públicas sin autenticación
router.get('/', ComboController.listarCombos);
router.get('/:id', ComboController.obtenerCombo);
router.post('/', ComboController.crearCombo);
router.put('/:id', ComboController.actualizarCombo);
router.delete('/:id', ComboController.eliminarCombo);

// Rutas para ingredientes
router.get('/:comboId/ingredientes', ComboController.listarIngredientes);
router.post('/:comboId/ingredientes', ComboController.agregarIngrediente);
router.put('/ingredientes/:ingredienteId', ComboController.actualizarIngrediente);
router.delete('/ingredientes/:ingredienteId', ComboController.eliminarIngrediente);

module.exports = router;