const ComboModel = require('../models/comboModel');

const ComboController = {
  listarCombos: async (req, res) => {
    try {
      const combos = await ComboModel.listar();
      res.json(combos);
    } catch (error) {
      console.error('Error al listar combos:', error);
      res.status(500).json({ message: 'Error al listar combos' });
    }
  },

  obtenerCombo: async (req, res) => {
    try {
      const combo = await ComboModel.obtenerPorId(req.params.id);
      if (!combo) {
        return res.status(404).json({ message: 'Combo no encontrado' });
      }
      res.json(combo);
    } catch (error) {
      console.error('Error al obtener combo:', error);
      res.status(500).json({ message: 'Error al obtener combo' });
    }
  },

  crearCombo: async (req, res) => {
    try {
      if (!req.body.nombre || !req.body.precio) {
        return res.status(400).json({ message: 'Nombre y precio son requeridos' });
      }

      const nuevoCombo = await ComboModel.crear({
        nombre: req.body.nombre,
        descripcion: req.body.descripcion || null,
        precio: parseFloat(req.body.precio),
        usuario_creacion_id: 1 // Valor por defecto o eliminar esta columna
      });

      res.status(201).json(nuevoCombo);
    } catch (error) {
      console.error('Error al crear combo:', error);
      res.status(500).json({ 
        message: 'Error al crear combo',
        error: error.message
      });
    }
  },

  actualizarCombo: async (req, res) => {
    try {
      const comboActualizado = await ComboModel.actualizar(
        req.params.id,
        req.body
      );
      if (!comboActualizado) {
        return res.status(404).json({ message: 'Combo no encontrado' });
      }
      res.json(comboActualizado);
    } catch (error) {
      console.error('Error al actualizar combo:', error);
      res.status(500).json({ message: 'Error al actualizar combo' });
    }
  },

  eliminarCombo: async (req, res) => {
    try {
      const eliminado = await ComboModel.eliminar(req.params.id);
      if (!eliminado) {
        return res.status(404).json({ message: 'Combo no encontrado' });
      }
      res.json({ message: 'Combo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar combo:', error);
      res.status(500).json({ message: 'Error al eliminar combo' });
    }
  },

  // Métodos para ingredientes
  agregarIngrediente: async (req, res) => {
    try {
      const nuevoIngrediente = await ComboModel.agregarIngrediente(
        req.params.comboId,
        req.body
      );
      res.status(201).json(nuevoIngrediente);
    } catch (error) {
      console.error('Error al agregar ingrediente:', error);
      res.status(500).json({ message: 'Error al agregar ingrediente' });
    }
  },

  actualizarIngrediente: async (req, res) => {
    try {
      const ingredienteActualizado = await ComboModel.actualizarIngrediente(
        req.params.ingredienteId,
        req.body
      );
      if (!ingredienteActualizado) {
        return res.status(404).json({ message: 'Ingrediente no encontrado' });
      }
      res.json(ingredienteActualizado);
    } catch (error) {
      console.error('Error al actualizar ingrediente:', error);
      res.status(500).json({ message: 'Error al actualizar ingrediente' });
    }
  },

  eliminarIngrediente: async (req, res) => {
    try {
      const eliminado = await ComboModel.eliminarIngrediente(req.params.ingredienteId);
      if (!eliminado) {
        return res.status(404).json({ message: 'Ingrediente no encontrado' });
      }
      res.json({ message: 'Ingrediente eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar ingrediente:', error);
      res.status(500).json({ message: 'Error al eliminar ingrediente' });
    }
  },

  listarIngredientes: async (req, res) => {
    try {
      const ingredientes = await ComboModel.obtenerIngredientesPorCombo(req.params.comboId);
      res.json(ingredientes);
    } catch (error) {
      console.error('Error al listar ingredientes:', error);
      res.status(500).json({ message: 'Error al listar ingredientes' });
    }
  }
};

module.exports = ComboController;