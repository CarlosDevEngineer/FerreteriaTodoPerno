const ProveedorModel = require("../models/proveedorModel");

const ProveedorController = {
  listar: async (req, res) => {
    try {
      const proveedores = await ProveedorModel.listar();
      res.json(proveedores);
    } catch (err) {
      res.status(500).json({ error: "Error al listar proveedores" });
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const proveedor = await ProveedorModel.obtenerPorId(req.params.id);
      if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });
      res.json(proveedor);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener proveedor" });
    }
  },

  crear: async (req, res) => {
    try {
      const nuevo = await ProveedorModel.crear(req.body);
      res.status(201).json(nuevo);
    } catch (err) {
      res.status(500).json({ error: "Error al crear proveedor" });
    }
  },

  actualizar: async (req, res) => {
    try {
      const actualizado = await ProveedorModel.actualizar(req.params.id, req.body);
      if (!actualizado) return res.status(404).json({ error: "Proveedor no encontrado" });
      res.json(actualizado);
    } catch (err) {
      res.status(500).json({ error: "Error al actualizar proveedor" });
    }
  },

  eliminar: async (req, res) => {
    try {
      const eliminado = await ProveedorModel.eliminar(req.params.id);
      if (!eliminado) return res.status(404).json({ error: "Proveedor no encontrado" });
      res.json({ mensaje: "Proveedor eliminado" });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar proveedor" });
    }
  }
};

module.exports = ProveedorController;
