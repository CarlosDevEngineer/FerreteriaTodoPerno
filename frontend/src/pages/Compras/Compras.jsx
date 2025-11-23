import React, { useState, useEffect } from 'react';
import { UilSearch, UilPlus, UilEdit, UilTrashAlt, UilTimes, UilReceipt, UilBox, UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import styles from './Compras.module.css';

const ComprasMobile = () => {
  // Estados
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [currentCompra, setCurrentCompra] = useState(null);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Formulario
  const [formData, setFormData] = useState({
    proveedor_id: '',
    numero_factura: '',
    fecha_compra: new Date().toISOString().split('T')[0],
    observaciones: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
    lote: '',
    fecha_vencimiento: ''
  });

  // Helpers
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

 // Función para generar número de factura automático incremental
const generarNumeroFactura = () => {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const prefijo = `FACT-${año}${mes}`;
  
  // Filtrar facturas del mes actual
  const facturasEsteMes = compras.filter(compra => 
    compra.numero_factura && compra.numero_factura.startsWith(prefijo)
  );
  
  // Extraer números secuenciales
  const numeros = facturasEsteMes.map(compra => {
    const partes = compra.numero_factura.split('-');
    return parseInt(partes[2]) || 0;
  });
  
  // Encontrar el número más alto y sumar 1
  const ultimoNumero = numeros.length > 0 ? Math.max(...numeros) : 0;
  const siguienteNumero = ultimoNumero + 1;
  
  return `${prefijo}-${siguienteNumero.toString().padStart(3, '0')}`;
};

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = compras.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(compras.length / itemsPerPage);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Ir a la página anterior
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Ir a la página siguiente
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Realiza todas las peticiones en paralelo
      const [comprasRes, proveedoresRes, productosRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/compras`).then(res => {
          if (!res.ok) throw new Error('Error al obtener compras');
          return res.json();
        }),
        fetch(`${process.env.REACT_APP_API_URL}/proveedores`).then(res => {
          if (!res.ok) throw new Error('Error al obtener proveedores');
          return res.json();
        }),
        fetch(`${process.env.REACT_APP_API_URL}/productos`).then(res => {
          if (!res.ok) throw new Error('Error al obtener productos');
          return res.json();
        })
      ]);

      // Extrae los datos de cada respuesta
      const comprasData = comprasRes.data || comprasRes || [];
      const proveedoresData = proveedoresRes.data || proveedoresRes || [];
      const productosData = productosRes.data || productosRes || [];

      // Normaliza las compras manteniendo la estructura actual
      const comprasNormalizadas = comprasData.map(compra => {
        // Busca el proveedor por ID - usa comparación estricta y convierte a número si es necesario
        const proveedor = proveedoresData.find(p => 
          Number(p.proveedor_id) === Number(compra.proveedor_id)
        );
        
        return {
          ...compra,
          items: Array.isArray(compra.items) ? compra.items.map(item => ({
            ...item,
            producto_nombre: productosData.find(p => 
              Number(p.producto_id) === Number(item.producto_id)
            )?.nombre || 'Producto desconocido',
            unidad_medida: productosData.find(p => 
              Number(p.producto_id) === Number(item.producto_id)
            )?.unidad_medida || 'un'
          })) : [],
          proveedor_nombre: proveedor?.nombre || 'Proveedor desconocido',
          proveedor_nit: proveedor?.nit || 'N/A'
        };
      });

      // Actualiza los estados
      setCompras(comprasNormalizadas);
      setProveedores(proveedoresData);
      setProductos(productosData);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Error al cargar datos. Por favor, recarga la página.");
      
      // Intenta cargar al menos los proveedores y productos si falla compras
      try {
        const [proveedoresRes, productosRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL}/proveedores`).then(res => res.json()),
          fetch(`${process.env.REACT_APP_API_URL}/productos`).then(res => res.json())
        ]);
        
        setProveedores(proveedoresRes.data || proveedoresRes || []);
        setProductos(productosRes.data || productosRes || []);
      } catch (secondaryError) {
        console.error("Error loading secondary data:", secondaryError);
      }
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    // Validación reforzada
    if (!newItem.producto_id || !newItem.cantidad || !newItem.precio_unitario) {
      alert('Producto, cantidad y precio son requeridos');
      return;
    }

    // Busca el producto seleccionado
    const producto = productos.find(p => p.producto_id == newItem.producto_id);

    if (!producto) {
      alert('Error: Producto no encontrado en la base de datos');
      return;
    }

    // Crea el item con todos los datos necesarios
    const item = {
      producto_id: newItem.producto_id,
      producto_nombre: producto.nombre,
      unidad_medida: producto.unidad_medida || 'un',
      cantidad: parseFloat(newItem.cantidad),
      precio_unitario: parseFloat(newItem.precio_unitario),
      lote: newItem.lote || '',
      fecha_vencimiento: newItem.fecha_vencimiento || null,
      subtotal: parseFloat(newItem.cantidad) * parseFloat(newItem.precio_unitario)
    };

    // Actualiza el estado
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    // Reinicia el formulario de item
    setNewItem({
      producto_id: '',
      cantidad: '',
      precio_unitario: '',
      lote: '',
      fecha_vencimiento: ''
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validaciones
      if (!formData.proveedor_id || formData.items.length === 0) {
        throw new Error('Se requiere un proveedor y al menos un producto');
      }

      // Prepara los datos para el backend
      const compraData = {
        proveedor_id: formData.proveedor_id,
        numero_factura: formData.numero_factura || null,
        fecha_compra: formData.fecha_compra,
        observaciones: formData.observaciones || null,
        items: formData.items.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          lote: item.lote || null,
          fecha_vencimiento: item.fecha_vencimiento || null
        })),
        subtotal: formData.items.reduce((sum, item) => sum + item.subtotal, 0),
        total: formData.items.reduce((sum, item) => sum + item.subtotal, 0)
      };

      // Envía los datos
      const method = currentCompra ? 'PUT' : 'POST';
      const url = currentCompra 
        ? `${process.env.REACT_APP_API_URL}/compras/${currentCompra.compra_id}`
        : `${process.env.REACT_APP_API_URL}/compras`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compraData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar la compra');
      }

      // Éxito: actualiza la lista y cierra el modal
      const nuevaCompra = await response.json();
      const compra = nuevaCompra.data;
      
      // Busca el proveedor para mostrar su nombre
      const proveedor = proveedores.find(p => p.proveedor_id == compra.proveedor_id);
      
      const compraNormalizada = {
        ...compra,
        items: Array.isArray(compra.items) ? compra.items.map(item => ({
          ...item,
          producto_nombre: productos.find(p => p.producto_id == item.producto_id)?.nombre || 'Producto desconocido',
          unidad_medida: productos.find(p => p.producto_id == item.producto_id)?.unidad_medida || 'un'
        })) : [],
        proveedor_nombre: proveedor?.nombre || 'Proveedor desconocido',
        proveedor_nit: proveedor?.nit || 'N/A'
      };

      setCompras(prev => {
        if (currentCompra) {
          return prev.map(c => c.compra_id === compraNormalizada.compra_id ? compraNormalizada : c);
        } else {
          return [...prev, compraNormalizada];
        }
      });

      setShowForm(false);
      alert(currentCompra ? 'Compra actualizada correctamente!' : 'Compra registrada correctamente!');
    } catch (err) {
      console.error('Error al registrar compra:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta compra?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/compras/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar');
        setCompras(prev => prev.filter(c => c?.compra_id !== id));
        alert('Compra eliminada correctamente');
      } catch (err) {
        console.error('Error:', err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Componente de paginación reutilizable
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(compras.length, 1)} - {Math.min(indexOfLastItem, compras.length)} de {compras.length} registros
      </div>
      
      <div className={styles.paginationButtons}>
        <button 
          onClick={goToPrevPage} 
          disabled={currentPage === 1}
          className={styles.paginationButton}
        >
          <UilAngleLeft size="16" />
        </button>
        
        {getPageNumbers().map(number => (
          <button
            key={number}
            onClick={() => paginate(number)}
            className={`${styles.paginationButton} ${currentPage === number ? styles.activePage : ''}`}
          >
            {number}
          </button>
        ))}
        
        <button 
          onClick={goToNextPage} 
          disabled={currentPage === totalPages}
          className={styles.paginationButton}
        >
          <UilAngleRight size="16" />
        </button>
      </div>
    </div>
  );

  if (loading) return <div className={styles.loading}>Cargando compras...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Compras</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentCompra(null);
            setFormData({
              proveedor_id: '',
              numero_factura: generarNumeroFactura(), // Generar número automático
              fecha_compra: new Date().toISOString().split('T')[0],
              observaciones: '',
              items: []
            });
            setShowForm(true);
          }}
        >
          <UilPlus size="24" color="#ffffff" />
        </button>
      </div>

      {/* Búsqueda */}
      <div className={styles.searchContainer}>
        <UilSearch size="20" color="#718096" className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar compras..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {/* Paginador superior - Solo visible en desktop */}
      <div className={styles.desktopOnly}>
        {compras.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>

      {/* Lista de compras */}
      <div className={styles.comprasList}>
        {currentItems.length > 0 ? (
          currentItems
            .filter(compra => {
              const term = searchTerm.toLowerCase();
              return (
                compra.numero_factura?.toLowerCase().includes(term) ||
                compra.proveedor_nombre?.toLowerCase().includes(term) ||
                compra.estado?.toLowerCase().includes(term)
              );
            })
            .map(compra => (
              <div key={compra.compra_id} className={styles.compraCard}>
                {/* Cabecera */}
                <div className={styles.cardHeader}>
                  <UilReceipt size={20} color="#4a5568" />
                  <div className={styles.compraInfo}>
                    <span className={styles.compraFactura}>
                      {compra.numero_factura || 'Sin factura'}
                    </span>
                    
                     
                  </div>
                  <span className={styles.compraTotal}>
                    {formatCurrency(compra.total)}
                  </span>
                </div>

                {/* Cuerpo */}
                <div className={styles.cardBody}>
                  <div className={styles.compraMeta}>
                    <span>{formatDate(compra.fecha_compra)}</span>
                    <span 
                      className={`${styles.compraEstado} ${
                        styles[compra.estado?.toLowerCase() || '']
                      }`}
                    >
                      {compra.estado || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Pie de tarjeta */}
                <div className={styles.cardFooter}>
                  <button 
                    className={styles.detalleButton}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/compras/${compra.compra_id}/detalle`);
                        const data = await response.json();
                        
                        if (data.success) {
                          const compraData = {
                            ...data.data,
                            items: Array.isArray(data.data.items) ? data.data.items : []
                          };
                          setCurrentCompra(compraData);
                          setShowDetalle(true);
                        } else {
                          alert(data.message || 'Error al cargar detalle');
                        }
                      } catch (error) {
                        console.error('Error:', error);
                        alert('Error de conexión al cargar detalle');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Ver Detalle
                  </button>
                  <div className={styles.compraActions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => {
                        setCurrentCompra(compra);
                        setFormData({
                          proveedor_id: compra.proveedor_id,
                          numero_factura: compra.numero_factura || '',
                          fecha_compra: compra.fecha_compra?.split('T')[0] || new Date().toISOString().split('T')[0],
                          observaciones: compra.observaciones || '',
                          items: compra.items || []
                        });
                        setShowForm(true);
                      }}
                    >
                      <UilEdit size={18} color="#2563eb" />
                    </button>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDelete(compra.compra_id)}
                    >
                      <UilTrashAlt size={18} color="#dc2626" />
                    </button>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className={styles.noResults}>
            <UilReceipt size={40} className={styles.noResultsIcon} />
            <p>
              {compras.length === 0 
                ? 'No hay compras registradas' 
                : 'No se encontraron resultados para: "' + searchTerm + '"'
              }
            </p>
          </div>
        )}
      </div>

      

      {/* Modal de Formulario */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>{currentCompra ? 'Editar Compra' : 'Nueva Compra'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <form className={styles.compraForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Proveedor *</label>
                  <select
                    name="proveedor_id"
                    value={formData.proveedor_id}
                    onChange={handleInputChange}
                    required
                    className={styles.formSelect}
                  >
                    <option value="">Seleccione un proveedor</option>
                    {proveedores.map(proveedor => (
                      <option key={proveedor.proveedor_id} value={proveedor.proveedor_id}>
                        {proveedor.nombre} ({proveedor.nit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>N° Factura</label>
                  <input
                    type="text"
                    name="numero_factura"
                    value={formData.numero_factura}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="Número de factura"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha *</label>
                  <input
                    type="date"
                    name="fecha_compra"
                    value={formData.fecha_compra}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    max={new Date().toISOString().split('T')[0]} // No permite fechas futuras
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Observaciones</label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  className={styles.formTextarea}
                  rows="2"
                  placeholder="Notas adicionales"
                />
              </div>

              <div className={styles.itemsSection}>
                <h3>Productos Comprados *</h3>
                
                {formData.items.length > 0 ? (
                  <div className={styles.itemsList}>
                    {formData.items.map((item, index) => (
                      <div key={index} className={styles.itemCard}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemName}>{item.producto_nombre}</span>
                          <span className={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</span>
                        </div>
                        <div className={styles.itemDetails}>
                          <span>{item.cantidad} {item.unidad_medida}</span>
                          <span>@ {formatCurrency(item.precio_unitario)}</span>
                          {item.lote && <span>Lote: {item.lote}</span>}
                        </div>
                        <button
                          type="button"
                          className={styles.removeItemButton}
                          onClick={() => removeItem(index)}
                        >
                          <UilTrashAlt size="14" color="#dc2626" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noItems}>No hay productos agregados</p>
                )}

                <div className={styles.addItemForm}>
                  <h4>Agregar Producto</h4>
                  
                  <div className={styles.formGroup}>
                    <label>Producto *</label>
                    <select
                      name="producto_id"
                      value={newItem.producto_id}
                      onChange={handleItemChange}
                      className={styles.formSelect}
                    >
                      <option value="">Seleccione un producto</option>
                      {productos.map(producto => (
                        <option key={producto.producto_id} value={producto.producto_id}>
                          {producto.nombre} ({producto.unidad_medida})
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
                        min="0.01"
                        step="0.01"
                        value={newItem.cantidad}
                        onChange={handleItemChange}
                        className={styles.formInput}
                        placeholder="0.00"
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
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Lote</label>
                      <input
                        type="text"
                        name="lote"
                        value={newItem.lote}
                        onChange={handleItemChange}
                        className={styles.formInput}
                        placeholder="Número de lote"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Fecha Venc.</label>
                      <input
                        type="date"
                        name="fecha_vencimiento"
                        value={newItem.fecha_vencimiento}
                        onChange={handleItemChange}
                        className={styles.formInput}
                        min={new Date().toISOString().split('T')[0]} // Solo fechas futuras
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.addItemButton}
                    onClick={addItem}
                  >
                    <UilPlus size="16" color="#ffffff" />
                    Agregar Producto
                  </button>
                </div>
              </div>

              <div className={styles.formFooter}>
                <div className={styles.totalSection}>
                  <span>Total:</span>
                  <span className={styles.totalAmount}>
                    {formatCurrency(formData.items.reduce((sum, item) => sum + item.subtotal, 0))}
                  </span>
                </div>

                <div className={styles.formButtons}>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={() => setShowForm(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={formData.items.length === 0}
                  >
                    {currentCompra ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetalle && currentCompra && (
        <div className={styles.formOverlay}>
          <div className={styles.detalleModal}>
            <div className={styles.formHeader}>
              <h2>Detalle de Compra</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowDetalle(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <div className={styles.detalleContent}>
              <div className={styles.detalleHeader}>
                <div>
                  <span className={styles.detalleLabel}>Factura:</span>
                  <span>{currentCompra.numero_factura || 'N/A'}</span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Fecha:</span>
                  <span>{formatDate(currentCompra.fecha_compra)}</span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Proveedor:</span>
                  <span>
                    {proveedores.find(p => p.proveedor_id === currentCompra.proveedor_id)?.nombre || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Estado:</span>
                  <span className={`${styles.compraEstado} ${styles[currentCompra.estado.toLowerCase()]}`}>
                    {currentCompra.estado}
                  </span>
                </div>
              </div>

              {currentCompra.observaciones && (
                <div className={styles.detalleObservaciones}>
                  <span className={styles.detalleLabel}>Observaciones:</span>
                  <p>{currentCompra.observaciones}</p>
                </div>
              )}

              <div className={styles.detalleItems}>
                <h3>Productos</h3>
                {currentCompra?.items?.length > 0 ? (
                  <ul className={styles.itemsList}>
                    {currentCompra.items.map((item, index) => {
                      const producto = productos.find(p => p.producto_id === item.producto_id) || {};
                      const subtotal = item.subtotal || (item.cantidad * item.precio_unitario);
                      
                      return (
                        <li key={`${item.producto_id}-${index}`} className={styles.detalleItem}>
                          <div className={styles.itemInfo}>
                            <UilBox size="16" color="#4a5568" />
                            <span>
                              {item.producto_nombre || producto.nombre || 'Producto desconocido'}
                            </span>
                          </div>
                          
                          <div className={styles.itemDetails}>
                            <span>
                              {item.cantidad?.toLocaleString('es-BO') || '0'} 
                              {item.unidad_medida || producto.unidad_medida || 'un'}
                            </span>
                            <span>@ {formatCurrency(item.precio_unitario)}</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          
                          {(item.lote || item.fecha_vencimiento) && (
                            <div className={styles.itemMeta}>
                              {item.lote && (
                                <span>
                                  <strong>Lote:</strong> {item.lote}
                                </span>
                              )}
                              {item.fecha_vencimiento && (
                                <span>
                                  <strong>Vence:</strong> {formatDate(item.fecha_vencimiento)}
                                </span>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={styles.noItemsContainer}>
                    <UilBox size={32} className={styles.noItemsIcon} />
                    <p className={styles.noItems}>No hay productos registrados en esta compra</p>
                  </div>
                )}
              </div>

              <div className={styles.detalleTotal}>
                <span>Total:</span>
                <span>{formatCurrency(currentCompra.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasMobile;