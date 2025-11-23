import React from 'react';
import { UilTimes, UilPrint, UilBox } from '@iconscout/react-unicons';
import styles from './Ventas.module.css';

const DetalleVentaModal = ({ venta, onClose, onPrint }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.detalleModal}>
        <div className={styles.modalHeader}>
          <h2>Detalle de Venta #{venta.venta_id}</h2>
          <div className={styles.modalActions}>
            <button onClick={onPrint} className={styles.printButton}>
              <UilPrint size="20" />
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              <UilTimes size="24" color="#64748b" />
            </button>
          </div>
        </div>

        <div className={styles.detalleContent}>
          {/* Información general */}
          <div className={styles.detalleInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha:</span>
              <span>{formatDate(venta.fecha_venta)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Cliente:</span>
              <span>{venta.cliente_nombre || 'No especificado'}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Método de Pago:</span>
              <span>{venta.metodo_pago}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Estado:</span>
              <span className={`${styles.ventaEstado} ${styles[venta.estado.toLowerCase()]}`}>
                {venta.estado}
              </span>
            </div>
          </div>

          {/* Productos */}
          <div className={styles.detalleItems}>
            <h3>Productos</h3>
            {venta.items && venta.items.length > 0 ? (
              <ul className={styles.itemsList}>
                {venta.items.map((item, index) => (
                  <li key={index} className={styles.detalleItem}>
                    <div className={styles.itemInfo}>
                      <UilBox size="16" color="#4a5568" />
                      <span>{item.producto_nombre || `Producto ${item.producto_id}`}</span>
                    </div>
                    <div className={styles.itemDetails}>
                      <span>{item.cantidad} un</span>
                      <span>@ {formatCurrency(item.precio_unitario)}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noItems}>No hay productos registrados</p>
            )}
          </div>

          {/* Totales */}
          <div className={styles.detalleTotales}>
            <div className={styles.totalRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(venta.subtotal)}</span>
            </div>
            {venta.descuento > 0 && (
              <div className={styles.totalRow}>
                <span>Descuento:</span>
                <span>-{formatCurrency(venta.descuento)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <strong>Total:</strong>
              <strong>{formatCurrency(venta.total)}</strong>
            </div>
          </div>

          {/* Observaciones */}
          {venta.observaciones && (
            <div className={styles.detalleObservaciones}>
              <h4>Observaciones</h4>
              <p>{venta.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleVentaModal;