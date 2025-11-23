const ClienteModel = require("../models/clienteModel");

const ClienteController = {
  listar: async (req, res) => {
    try {
      const clientes = await ClienteModel.listar();
      res.json(clientes);
    } catch (err) {
      res.status(500).json({ error: "Error al listar clientes" });
    }
  },

  obtenerPorId: async (req, res) => {
    try {
      const cliente = await ClienteModel.obtenerPorId(req.params.id);
      if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
      res.json(cliente);
    } catch (err) {
      res.status(500).json({ error: "Error al obtener cliente" });
    }
  },

  crear: async (req, res) => {
    try {
      const nuevo = await ClienteModel.crear(req.body);
      res.status(201).json(nuevo);
    } catch (err) {
      res.status(500).json({ error: "Error al crear cliente" });
    }
  },

  actualizar: async (req, res) => {
    try {
      const actualizado = await ClienteModel.actualizar(req.params.id, req.body);
      if (!actualizado) return res.status(404).json({ error: "Cliente no encontrado" });
      res.json(actualizado);
    } catch (err) {
      res.status(500).json({ error: "Error al actualizar cliente" });
    }
  },

  eliminar: async (req, res) => {
    try {
      const eliminado = await ClienteModel.eliminar(req.params.id);
      if (!eliminado) return res.status(404).json({ error: "Cliente no encontrado" });
      res.json({ mensaje: "Cliente eliminado" });
    } catch (err) {
      res.status(500).json({ error: "Error al eliminar cliente" });
    }
  }
};

module.exports = ClienteController;
