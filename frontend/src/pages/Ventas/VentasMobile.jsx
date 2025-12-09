import React, { useState, useEffect } from 'react';
import { 
  UilSearch, 
  UilPlus, 
  UilEdit, 
  UilTrashAlt, 
  UilTimes, 
  UilReceipt, 
  UilBox, 
  UilAngleLeft, 
  UilAngleRight,
  UilUser,
  UilBill,
  UilMoneybill
} from '@iconscout/react-unicons';
import styles from './Ventas.module.css';

const Ventas = () => {
  // Estados
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showRecibo, setShowRecibo] = useState(false);
  const [currentVenta, setCurrentVenta] = useState(null);
  const [ventaGenerada, setVentaGenerada] = useState(null);

  // Estados para búsqueda de productos
  const [searchProduct, setSearchProduct] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductList, setShowProductList] = useState(false);

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Formulario
  const [formData, setFormData] = useState({
    cliente_id: '',
    fecha_venta: new Date().toISOString().slice(0, 16),
    subtotal: 0,
    descuento: 0,
    total: 0,
    estado: 'completado',
    metodo_pago: 'efectivo',
    observaciones: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    producto_id: '',
    cantidad: '',
    precio_unitario: '',
    producto_padre_id: ''
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
    
    if (dateString.includes('T') && dateString.includes(':')) {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('es-ES', options);
    }
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Función para generar número de factura automático incremental
  const generarNumeroFactura = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const prefijo = `FACT-${año}${mes}`;
    
    const facturasEsteMes = ventas.filter(venta => 
      venta.numero_factura && venta.numero_factura.startsWith(prefijo)
    );
    
    const numeros = facturasEsteMes.map(venta => {
      const partes = venta.numero_factura.split('-');
      return parseInt(partes[2]) || 0;
    });
    
    const ultimoNumero = numeros.length > 0 ? Math.max(...numeros) : 0;
    const siguienteNumero = ultimoNumero + 1;
    
    return `${prefijo}-${siguienteNumero.toString().padStart(3, '0')}`;
  };

  // Filtro de productos para búsqueda
  useEffect(() => {
    if (searchProduct.trim() === '') {
      setFilteredProducts(productos);
    } else {
      const filtered = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(searchProduct.toLowerCase()) ||
        producto.codigo?.toLowerCase().includes(searchProduct.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchProduct, productos]);

  // Handler para seleccionar producto
  const handleProductSelect = (producto) => {
    setNewItem(prev => ({
      ...prev,
      producto_id: producto.producto_id,
      precio_unitario: producto.precio_venta || producto.precio_unitario || 0
    }));
    setSearchProduct(producto.nombre);
    setShowProductList(false);
  };

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = ventas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(ventas.length / itemsPerPage);

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

  // En el useEffect principal,
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Realiza todas las peticiones en paralelo (agrega combos)
      const [ventasRes, clientesRes, productosRes, combosRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/ventas`).then(res => {
          if (!res.ok) throw new Error('Error al obtener ventas');
          return res.json();
        }),
        fetch(`${process.env.REACT_APP_API_URL}/clientes`).then(res => {
          if (!res.ok) throw new Error('Error al obtener clientes');
          return res.json();
        }),
        fetch(`${process.env.REACT_APP_API_URL}/productos`).then(res => {
          if (!res.ok) throw new Error('Error al obtener productos');
          return res.json();
        }),
        fetch(`${process.env.REACT_APP_API_URL}/combos`).then(res => { // ← Nueva petición
          if (!res.ok) throw new Error('Error al obtener combos');
          return res.json();
        })
      ]);

      // Extrae los datos de cada respuesta
      const ventasData = ventasRes.data || ventasRes || [];
      const clientesData = clientesRes.data || clientesRes || [];
      const productosData = productosRes.data || productosRes || [];
      const combosData = combosRes.data || combosRes || []; // ← Combos

      // Normaliza las ventas
      const ventasNormalizadas = ventasData.map(venta => {
        const cliente = clientesData.find(c => 
          Number(c.cliente_id) === Number(venta.cliente_id)
        );
        
        return {
          ...venta,
          items: Array.isArray(venta.items) ? venta.items.map(item => ({
            ...item,
            producto_nombre: productosData.find(p => 
              Number(p.producto_id) === Number(item.producto_id)
            )?.nombre || 'Producto desconocido',
            combo_nombre: combosData.find(c => 
              Number(c.combo_id) === Number(item.producto_padre_id)
            )?.nombre || null
          })) : [],
          cliente_nombre: cliente?.nombre || 'Cliente desconocido',
          cliente_nit: cliente?.nit || 'N/A'
        };
      });

      // Actualiza los estados
      setVentas(ventasNormalizadas);
      setClientes(clientesData);
      setProductos(productosData);
      setCombos(combosData); // ← Guardar combos
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Error al cargar datos. Por favor, recarga la página.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

// useEffect para detectar cambios en producto_padre_id y asignar precio automáticamente
// En el mismo useEffect, agrega esto:
useEffect(() => {
  if (newItem.producto_padre_id) {
    const comboSeleccionado = combos.find(c => c.combo_id == newItem.producto_padre_id);
    if (comboSeleccionado) {
      setNewItem(prev => ({
        ...prev,
        precio_unitario: comboSeleccionado.precio,
        cantidad: prev.cantidad || '1' // ← Auto-completar cantidad a 1
      }));
    }
  }
}, [newItem.producto_padre_id, combos]);

const getComboInfo = (comboId) => {
  const combo = combos.find(c => c.combo_id == comboId);
  return combo ? { nombre: combo.nombre, precio: combo.precio } : null;
};
  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'descuento' ? parseFloat(value || 0) : value 
    }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;

    if ((name === 'cantidad' || name === 'precio_unitario') && value !== '') {
      const regex = /^\d*\.?\d*$/; 
      if (!regex.test(value)) return; 
    }

    setNewItem(prev => ({ ...prev, [name]: value }));
  }

  const addItem = () => {
    // Validación modificada: aceptar producto_id O producto_padre_id (combo)
    if ((!newItem.producto_id && !newItem.producto_padre_id) || !newItem.cantidad || !newItem.precio_unitario) {
      alert('Debe seleccionar un producto o combo, cantidad y precio son requeridos');
      return;
    }

    let producto_nombre = '';
    
    // Si es un producto normal
    if (newItem.producto_id) {
      const producto = productos.find(p => p.producto_id == newItem.producto_id);
      if (!producto) {
        alert('Error: Producto no encontrado en la base de datos');
        return;
      }
      producto_nombre = producto.nombre;
    }
    
    // Si es un combo
    if (newItem.producto_padre_id) {
      const combo = combos.find(c => c.combo_id == newItem.producto_padre_id);
      producto_nombre = combo ? combo.nombre : `Combo #${newItem.producto_padre_id}`;
    }

    const item = {
      producto_id: newItem.producto_id || null, // Puede ser null si es combo
      producto_nombre: producto_nombre,
      cantidad: parseFloat(newItem.cantidad),
      precio_unitario: parseFloat(newItem.precio_unitario),
      producto_padre_id: newItem.producto_padre_id || null, // ID del combo
      combo_nombre: newItem.producto_padre_id ? producto_nombre : null,
      combo_precio: newItem.producto_padre_id ? parseFloat(newItem.precio_unitario) : null,
      subtotal: parseFloat(newItem.cantidad) * parseFloat(newItem.precio_unitario)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item],
      subtotal: prev.subtotal + item.subtotal,
      total: (prev.subtotal + item.subtotal) - prev.descuento
    }));

    // Reinicia el formulario
    setNewItem({
      producto_id: '',
      cantidad: '',
      precio_unitario: '',
      producto_padre_id: ''
    });
    setSearchProduct('');
};

  const removeItem = (index) => {
    const itemToRemove = formData.items[index];
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
      subtotal: prev.subtotal - itemToRemove.subtotal,
      total: (prev.subtotal - itemToRemove.subtotal) - prev.descuento
    }));
  };

  const handleDescuentoChange = (e) => {
    const descuento = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      descuento: descuento,
      total: prev.subtotal - descuento
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!formData.cliente_id || formData.items.length === 0) {
        throw new Error('Se requiere un cliente y al menos un producto');
      }

      const ventaData = {
        cliente_id: formData.cliente_id,
        numero_factura: generarNumeroFactura(),
        fecha_venta: formData.fecha_venta,
        subtotal: formData.subtotal,
        descuento: formData.descuento,
        total: formData.total,
        estado: formData.estado,
        metodo_pago: formData.metodo_pago,
        observaciones: formData.observaciones || null,
        usuario_creacion_id: 1,
        items: formData.items.map(item => ({
          producto_id: item.producto_id,
          producto_padre_id: item.producto_padre_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        }))
      };

      console.log('Datos a enviar al backend:', ventaData);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ventaData)
      });

      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.log('Error data from server:', errorData);
        } catch (jsonError) {
          const textError = await response.text();
          console.log('Raw error response:', textError);
          throw new Error(`Error ${response.status}: ${textError || response.statusText}`);
        }
        throw new Error(errorData.message || errorData.error || 'Error al registrar la venta');
      }

      const nuevaVenta = await response.json();
      const venta = nuevaVenta.data;
      
      const cliente = clientes.find(c => c.cliente_id == venta.cliente_id);
      
      const ventaNormalizada = {
        ...venta,
        items: Array.isArray(venta.items) ? venta.items.map(item => ({
          ...item,
          producto_nombre: productos.find(p => p.producto_id == item.producto_id)?.nombre || 'Producto desconocido'
        })) : [],
        cliente_nombre: cliente?.nombre || 'Cliente desconocido',
        cliente_nit: cliente?.nit || 'N/A'
      };

      setVentas(prev => [...prev, ventaNormalizada]);
      setVentaGenerada(ventaNormalizada);
      setShowForm(false);
      setShowRecibo(true);
      
    } catch (err) {
      console.error('Error al registrar venta:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta venta?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/ventas/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar');
        setVentas(prev => prev.filter(v => v?.venta_id !== id));
        alert('Venta eliminada correctamente');
      } catch (err) {
        console.error('Error:', err);
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Componente de paginación
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(ventas.length, 1)} - {Math.min(indexOfLastItem, ventas.length)} de {ventas.length} registros
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

  if (loading) return <div className={styles.loading}>Cargando ventas...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Ventas</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentVenta(null);
            setFormData({
              cliente_id: '',
              fecha_venta: new Date().toISOString().slice(0, 16),
              subtotal: 0,
              descuento: 0,
              total: 0,
              estado: 'completado',
              metodo_pago: 'efectivo',
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
          placeholder="Buscar ventas..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {/* Paginador superior */}
      <div className={styles.desktopOnly}>
        {ventas.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>

      {/* Lista de ventas */}
      <div className={styles.ventasList}>
        {currentItems.length > 0 ? (
          currentItems
            .filter(venta => {
              const term = searchTerm.toLowerCase();
              return (
                venta.numero_factura?.toLowerCase().includes(term) ||
                venta.cliente_nombre?.toLowerCase().includes(term) ||
                venta.estado?.toLowerCase().includes(term) ||
                venta.metodo_pago?.toLowerCase().includes(term)
              );
            })
            .map(venta => (
              <div key={venta.venta_id} className={styles.ventaCard}>
                <div className={styles.cardHeader}>
                  <UilReceipt size={20} color="#4a5568" />
                  <div className={styles.ventaInfo}>
                    <span className={styles.ventaFactura}>
                      {venta.numero_factura || 'Sin factura'}
                    </span>
                    <span className={styles.ventaCliente}>
                      {venta.cliente_nombre}
                    </span>
                  </div>
                  <span className={styles.ventaTotal}>
                    {formatCurrency(venta.total)}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.ventaMeta}>
                    <span>{formatDate(venta.fecha_venta)}</span>
                    <div className={styles.ventaDetails}>
                      <span 
                        className={`${styles.ventaEstado} ${styles[venta.estado?.toLowerCase() || '']}`}
                      >
                        {venta.estado || 'N/A'}
                      </span>
                      <span className={styles.ventaMetodoPago}>
                        {venta.metodo_pago || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <button 
                    className={styles.detalleButton}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        const response = await fetch(`${process.env.REACT_APP_API_URL}/ventas/${venta.venta_id}`);
                        const data = await response.json();
                        
                        if (data.success) {
                          const ventaData = {
                            ...data.data,
                            items: Array.isArray(data.data.items) ? data.data.items : []
                          };
                          setCurrentVenta(ventaData);
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
                  
                </div>
              </div>
            ))
        ) : (
          <div className={styles.noResults}>
            <UilReceipt size={40} className={styles.noResultsIcon} />
            <p>
              {ventas.length === 0 
                ? 'No hay ventas registradas' 
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
              <h2>{currentVenta ? 'Editar Venta' : 'Nueva Venta'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <form className={styles.ventaForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Cliente *</label>
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={handleInputChange}
                    required
                    className={styles.formSelect}
                  >
                    <option value="">Seleccione un cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.cliente_id} value={cliente.cliente_id}>
                        {cliente.nombre} {cliente.nit ? `(${cliente.nit})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    name="fecha_venta"
                    value={formData.fecha_venta}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    max={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Método de Pago *</label>
                  <select
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleInputChange}
                    required
                    className={styles.formSelect}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="qr">QR</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Estado *</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleInputChange}
                    required
                    className={styles.formSelect}
                  >
                    <option value="completado">Completado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
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
                  placeholder="Notas adicionales sobre la venta"
                />
              </div>

              <div className={styles.itemsSection}>
                <h3>Productos Vendidos *</h3>
                
                {formData.items.length > 0 ? (
                  <div className={styles.itemsList}>
                    {formData.items.map((item, index) => (
                      <div key={index} className={styles.itemCard}>
                        <div className={styles.itemHeader}>
                          <span className={styles.itemName}>{item.producto_nombre}</span>
                          <span className={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</span>
                        </div>
                        <div className={styles.itemDetails}>
                          <span>{item.cantidad} und</span>
                          <span>@ {formatCurrency(item.precio_unitario)}</span>
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
                    <label>Buscar Producto *</label>
                    <div className={styles.searchWrapper}>
                      <input
                        type="text"
                        value={searchProduct}
                        onChange={(e) => {
                          setSearchProduct(e.target.value);
                          setShowProductList(true);
                        }}
                        onFocus={() => setShowProductList(true)}
                        className={styles.formInput}
                        placeholder="Buscar producto por nombre o código..."
                      />
                      {showProductList && filteredProducts.length > 0 && (
                        <div className={styles.productList}>
                          {filteredProducts.map(producto => (
                            <div
                              key={producto.producto_id}
                              className={styles.productItem}
                              onClick={() => handleProductSelect(producto)}
                            >
                              <span className={styles.productName}>{producto.nombre}</span>
                              <span className={styles.productPrice}>
                                {formatCurrency(producto.precio_venta || producto.precio_unitario || 0)}
                              </span>
                              {producto.codigo && (
                                <span className={styles.productCode}>Cód: {producto.codigo}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Cantidad *</label>
                      <input
                        type="text"
                        name="cantidad"
                        min="1"
                        step="1"
                        value={newItem.cantidad}
                        onChange={handleItemChange}
                        className={styles.formInput}
                        placeholder="0"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Precio Unitario *</label>
                      <input
                        type="text"
                        name="precio_unitario"
                        min="0.01"
                        step="0.01"
                        value={newItem.precio_unitario}
                        onChange={handleItemChange}
                        className={styles.formInput}
                        placeholder="0.00"
                        readOnly={!!newItem.producto_padre_id}
                        style={newItem.producto_padre_id ? { backgroundColor: '#f0f0f0' } : {}}
                      />
                      {newItem.producto_padre_id && (
                        <small style={{ color: '#666', fontSize: '0.8rem' }}>
                          Precio definido por el combo
                        </small>
                      )}
                    </div>
                  </div>
                 {/*
<div className={styles.formGroup}>
  <label>Producto Terminado (Opcional)</label>
  <select
    name="producto_padre_id"
    value={newItem.producto_padre_id}
    onChange={handleItemChange}
    className={styles.formSelect}
  >
    <option value="">Seleccionar combo...</option>
    {combos.map(combo => (
      <option key={combo.combo_id} value={combo.combo_id}>
        {combo.nombre} - {formatCurrency(combo.precio || 0)}
      </option>
    ))}
  </select>   
  {newItem.producto_padre_id && (
    <button
      type="button"
      className={styles.clearComboButton}
      onClick={() => {
        setNewItem(prev => ({
          ...prev,
          producto_padre_id: '',
          precio_unitario: ''
        }));
      }}
    >
      Limpiar combo
    </button>
  )}
</div>
*/}

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

              <div className={styles.totalsSection}>
                <div className={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(formData.subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <label>Descuento:</label>
                  <input
                    type="number"
                    name="descuento"
                    min="0"
                    step="0.01"
                    value={formData.descuento}
                    onChange={handleDescuentoChange}
                    className={styles.discountInput}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.totalRow}>
                  <span>Total:</span>
                  <span className={styles.totalAmount}>{formatCurrency(formData.total)}</span>
                </div>
              </div>

              <div className={styles.formFooter}>
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
                    disabled={formData.items.length === 0 || !formData.cliente_id}
                  >
                    {currentVenta ? 'Actualizar' : 'Generar Venta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetalle && currentVenta && (
        <div className={styles.formOverlay}>
          <div className={styles.detalleModal}>
            <div className={styles.formHeader}>
              <h2>Detalle de Venta</h2>
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
                  <span>{currentVenta.numero_factura || 'N/A'}</span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Fecha y Hora:</span>
                  <span>{formatDate(currentVenta.fecha_venta)}</span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Cliente:</span>
                  <span>
                    {clientes.find(c => c.cliente_id === currentVenta.cliente_id)?.nombre || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Estado:</span>
                  <span className={`${styles.ventaEstado} ${styles[currentVenta.estado.toLowerCase()]}`}>
                    {currentVenta.estado}
                  </span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Método Pago:</span>
                  <span>{currentVenta.metodo_pago}</span>
                </div>
                <div>
                  <span className={styles.detalleLabel}>Vendedor:</span>
                  <span>{currentVenta.usuario_creacion_id || 'N/A'}</span>
                </div>
              </div>

              {currentVenta.observaciones && (
                <div className={styles.detalleObservaciones}>
                  <span className={styles.detalleLabel}>Observaciones:</span>
                  <p>{currentVenta.observaciones}</p>
                </div>
              )}

              <div className={styles.detalleItems}>
                <h3>Productos</h3>
                {currentVenta?.items?.length > 0 ? (
                  <ul className={styles.itemsList}>
                    {currentVenta.items.map((item, index) => {
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
                              {item.cantidad?.toLocaleString('es-BO') || '0'} und
                            </span>
                            <span>@ {formatCurrency(item.precio_unitario)}</span>
                            <span>{formatCurrency(subtotal)}</span>
                          </div>
                          
                          {item.producto_padre_id && (
                            <div className={styles.itemMeta}>
                              <span>
                                <strong>Combo:</strong> {item.combo_nombre || `Combo #${item.producto_padre_id}`}
                              </span>
                              {item.combo_precio && (
                                <span>
                                  <strong>Precio combo:</strong> {formatCurrency(item.combo_precio)}
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
                    <p className={styles.noItems}>No hay productos registrados en esta venta</p>
                  </div>
                )}
              </div>

              <div className={styles.detalleTotals}>
                <div className={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(currentVenta.subtotal)}</span>
                </div>
                {currentVenta.descuento > 0 && (
                  <div className={styles.totalRow}>
                    <span>Descuento:</span>
                    <span>-{formatCurrency(currentVenta.descuento)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Total:</span>
                  <span className={styles.totalAmount}>{formatCurrency(currentVenta.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recibo */}
      {showRecibo && ventaGenerada && (
        <div className={styles.formOverlay}>
          <div className={styles.reciboModal}>
            <div className={styles.formHeader}>
              <h2>Recibo de Venta</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowRecibo(false);
                  setVentaGenerada(null);
                }}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <div className={styles.reciboContent}>
              <div className={styles.reciboHeader}>
                <h3>RECIBO DE VENTA</h3>
                <p>N°: {ventaGenerada.numero_factura}</p>
              </div>
              
              <div className={styles.reciboInfo}>
                <div>
                  <strong>Fecha:</strong> {formatDate(ventaGenerada.fecha_venta)}
                </div>
                <div>
                  <strong>Cliente:</strong> {ventaGenerada.cliente_nombre}
                </div>
                <div>
                  <strong>NIT/CI:</strong> {ventaGenerada.cliente_nit}
                </div>
              </div>

              <div className={styles.reciboItems}>
                <h4>Productos</h4>
                <table className={styles.reciboTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant</th>
                      <th>P. Unit</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventaGenerada.items.map((item, index) => (
  <tr key={index}>
    <td>
      {item.producto_nombre}
      {item.combo_nombre && (
        <div style={{fontSize: '0.8em', color: '#666'}}>
          (Parte de: {item.combo_nombre})
        </div>
      )}
    </td>
    <td>{item.cantidad}</td>
    <td>{formatCurrency(item.precio_unitario)}</td>
    <td>{formatCurrency(item.subtotal)}</td>
  </tr>
))}
                  </tbody>
                </table>
              </div>

              <div className={styles.reciboTotal}>
                <div className={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(ventaGenerada.subtotal)}</span>
                </div>
                {ventaGenerada.descuento > 0 && (
                  <div className={styles.totalRow}>
                    <span>Descuento:</span>
                    <span>-{formatCurrency(ventaGenerada.descuento)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <strong>Total:</strong>
                  <strong>{formatCurrency(ventaGenerada.total)}</strong>
                </div>
              </div>

              <div className={styles.reciboActions}>
                <button 
                  className={styles.printButton}
                  onClick={() => window.print()}
                >
                  Imprimir Recibo
                </button>
                <button 
                  className={styles.closeReciboButton}
                  onClick={() => {
                    setShowRecibo(false);
                    setVentaGenerada(null);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;