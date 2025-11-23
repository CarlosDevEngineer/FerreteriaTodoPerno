import React, { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';
import styles from './Ventas.module.css';


const NuevaVentaModal = ({ clientes, productos, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    cliente_id: null,
    metodo_pago: 'EFECTIVO',
    observaciones: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    producto_id: '',
    cantidad: 1,
    precio_unitario: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (!newItem.producto_id || !newItem.cantidad || !newItem.precio_unitario) {
      alert('Producto, cantidad y precio son requeridos');
      return;
    }

    const producto = productos.find(p => p.producto_id == newItem.producto_id);
    if (!producto) {
      alert('Producto no encontrado');
      return;
    }

    const item = {
      producto_id: newItem.producto_id,
      producto_nombre: producto.nombre,
      cantidad: parseFloat(newItem.cantidad),
      precio_unitario: parseFloat(newItem.precio_unitario),
      subtotal: parseFloat(newItem.cantidad) * parseFloat(newItem.precio_unitario)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setNewItem({
      producto_id: '',
      cantidad: 1,
      precio_unitario: ''
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
    const ventaData = {
      ...formData,
      subtotal,
      total: subtotal - (formData.descuento || 0),
    };

    onSubmit(ventaData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Nueva Venta</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <UilTimes size="24" color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.ventaForm}>
          {/* Cliente */}
          <div className={styles.formGroup}>
            <label>Cliente *</label>
            <select
              name="cliente_id"
              value={formData.cliente_id || ''}
               onChange={(e) => {
                const value = e.target.value === 'null' ? null : e.target.value;
                setFormData(prev => ({ ...prev, cliente_id: value }));
            }}
              className={styles.formInput}
            >
              <option value="null">Cliente desconocido</option>
              {clientes.map(cliente => (
                <option key={cliente.cliente_id} value={cliente.cliente_id}>
                  {cliente.nombre} ({cliente.nit_ci})
                </option>
              ))}
            </select>
          </div>

          {/* Método de Pago */}
          <div className={styles.formGroup}>
            <label>Método de Pago *</label>
            <select
              name="metodo_pago"
              value={formData.metodo_pago}
              onChange={handleInputChange}
              required
              className={styles.formInput}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          {/* Items */}
          <div className={styles.itemsSection}>
            <h3>Productos *</h3>
            
            {formData.items.length > 0 ? (
              <div className={styles.itemsList}>
                {formData.items.map((item, index) => (
                  <div key={index} className={styles.itemCard}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemName}>{item.producto_nombre}</span>
                      <span className={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</span>
                    </div>
                    <div className={styles.itemDetails}>
                      <span>{item.cantidad} un</span>
                      <span>@ {formatCurrency(item.precio_unitario)}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.removeItemButton}
                      onClick={() => removeItem(index)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noItems}>No hay productos agregados</p>
            )}

            {/* Agregar Item */}
            <div className={styles.addItemForm}>
              <h4>Agregar Producto</h4>
              
              <div className={styles.formGroup}>
                <label>Producto *</label>
                <select
                  name="producto_id"
                  value={newItem.producto_id}
                  onChange={handleItemChange}
                  className={styles.formInput}
                  required
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map(producto => (
                    <option key={producto.producto_id} value={producto.producto_id}>
                      {producto.nombre} ({producto.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cantidad *</label>
                  <input
                    type="number"
                    name="cantidad"
                    min="1"
                    step="1"
                    value={newItem.cantidad}
                    onChange={handleItemChange}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Precio Unitario *</label>
                  <input
                    type="number"
                    name="precio_unitario"
                    min="0.01"
                    step="0.01"
                    value={newItem.precio_unitario}
                    onChange={handleItemChange}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                className={styles.addItemButton}
                onClick={addItem}
              >
                Agregar Producto
              </button>
            </div>
          </div>

          {/* Total */}
          <div className={styles.totalSection}>
            <span>Total:</span>
            <span className={styles.totalAmount}>
              {formatCurrency(formData.items.reduce((sum, item) => sum + item.subtotal, 0))}
            </span>
          </div>

          {/* Observaciones */}
          <div className={styles.formGroup}>
            <label>Observaciones</label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className={styles.formInput}
              rows="2"
            />
          </div>

          {/* Botones */}
          <div className={styles.formButtons}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton}>
              Registrar Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper function
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(value || 0);
};

export default NuevaVentaModal;