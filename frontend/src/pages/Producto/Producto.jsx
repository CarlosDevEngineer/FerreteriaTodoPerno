import React, { useState, useEffect } from 'react';
import { 
  UilSearch, 
  UilPlus, 
  UilEdit, 
  UilTrashAlt, 
  UilTimes, 
  UilAngleLeft, 
  UilAngleRight, 
  UilDollarSign,
  UilBars,
  UilBox,
  UilWeight,
  UilLabel,
  UilInvoice,
  UilChartBar 
} from '@iconscout/react-unicons';
import styles from './Producto.module.css';
import {useAuth} from '../../auth/AuthContext';

const ProductosManagerMobile = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const {user} = useAuth();

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Opciones para unidades de medida
  const unidadesMedida = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'caja', label: 'Caja' },
    { value: 'gramos', label: 'Gramos' },
    { value: 'litros', label: 'Litros' },
  ];
  const tiposProducto = [
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'materiales_construccion', label: 'Materiales de Construcción' },
  { value: 'materiales_pintura', label: 'Materiales Pintura' },
  { value: 'otros', label: 'Otros' }
];

  // Estado del formulario
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo_producto: 'materia_prima',
    es_terminado: false,
    stock_actual: '',
    stock_minimo: '',
    unidad_medida: 'unidad',
    costo_unitario: '',
    precio_venta: '',
    activo: true
  });

  // Obtener productos del backend con Fetch
  useEffect(() => {
  if (showForm && !currentProduct) {
    const nuevoCodigo = generarProximoCodigo();
    setFormData(prev => ({
      ...prev,
      codigo: nuevoCodigo
    }));
  }
}, [showForm, currentProduct, productos]);
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/productos`);
        if (!response.ok) {
          throw new Error('Error al obtener los productos');
        }
        const data = await response.json();
        setProductos(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const filteredProducts = productos
    .filter(p => p && p.codigo && p.nombre)
    .filter(p => 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

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
  const generarProximoCodigo = () => {
  if (productos.length === 0) return 'PR0001';
  
  // Obtener todos los códigos que siguen el formato PR0001
  const codigos = productos
    .filter(p => p.codigo && p.codigo.match(/^PR\d+$/))
    .map(p => {
      const numero = parseInt(p.codigo.replace('PR', ''), 10);
      return isNaN(numero) ? 0 : numero;
    });
  
  // Encontrar el número más alto
  const maxNumero = codigos.length > 0 ? Math.max(...codigos) : 0;
  
  // Generar el próximo código
  const siguienteNumero = maxNumero + 1;
  return `PR${siguienteNumero.toString().padStart(4, '0')}`;
};

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Formatear valor como moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(value);
  };

  // Manejar cambio de precio con formato
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    // Remover caracteres no numéricos excepto punto decimal
    const numericValue = value.replace(/[^\d.]/g, '');
    setFormData({
      ...formData,
      [name]: numericValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.codigo || !formData.nombre || !formData.precio_venta) {
        throw new Error('Código, nombre y precio son requeridos');
      }

      const url = currentProduct 
        ? `${process.env.REACT_APP_API_URL}/productos/${currentProduct.producto_id}`
        : `${process.env.REACT_APP_API_URL}/productos`;

      const method = currentProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...formData,
          usuario_id: user.usuario_id,
          ...(currentProduct && {producto_id:currentProduct.producto_id})
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar');
      }

      setProductos(prevProducts => {
        if (currentProduct) {
          return prevProducts.map(product => 
            product.producto_id === currentProduct.producto_id 
              ? { ...responseData } 
              : product
          );
        } else {
          return [...prevProducts, responseData];
        }
      });

      setShowForm(false);
      alert(`Producto ${currentProduct ? 'actualizado' : 'creado'} correctamente!`);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };
        
  // Eliminar producto
  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este producto?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/productos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el producto');
        }

        setProductos(productos.filter(p => p.producto_id !== id));
        alert('Producto eliminado correctamente');
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Editar producto
  const handleEdit = (producto) => {
    setCurrentProduct(producto);
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      tipo_producto: producto.tipo_producto || '',
      es_terminado: producto.es_terminado || false,
      stock_actual: producto.stock_actual || '',
      stock_minimo: producto.stock_minimo || '',
      unidad_medida: producto.unidad_medida || 'unidad',
      costo_unitario: producto.costo_unitario || '',
      precio_venta: producto.precio_venta || '',
      activo: producto.activo
    });
    setShowForm(true);
  };

  // Componente de paginación reutilizable
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(filteredProducts.length, 1)} - {Math.min(indexOfLastItem, filteredProducts.length)} de {filteredProducts.length} registros
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

  if (loading) return <div className={styles.loading}>Cargando productos...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Productos</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentProduct(null);
            setFormData({
              codigo: '',
              nombre: '',
              descripcion: '',
              tipo_producto: '',
              es_terminado: false,
              stock_actual: '',
              stock_minimo: '',
              unidad_medida: 'unidad',
              costo_unitario: '',
              precio_venta: '',
              activo: true
            });
            setShowForm(true);
          }}
        >
          <UilPlus size="24" color="#ffffff" />
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className={styles.searchContainer}>
        <UilSearch size="20" color="#718096" className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar productos..."
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
        {filteredProducts.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>

      {/* Lista de productos */}
<div className={styles.productList}>
  {currentItems.length > 0 ? (
    currentItems.map(producto => (
      <div key={producto.producto_id} className={styles.productCard}>
        <div className={styles.cardHeader}>
          <div className={styles.productCodeContainer}>
            <span className={styles.productCode}>{producto.codigo}</span>
          </div>
          <span className={`${styles.stockStatus} ${
            producto.stock_actual <= producto.stock_minimo ? styles.stockStatusLow : styles.stockStatusOk
          }`}>
            <UilInvoice size="16" className={styles.cardIcon} />
            {producto.stock_actual} {producto.unidad_medida}
          </span>
        </div>
        
        <div className={styles.productName}>
          <UilBox size="18" color="#2d3748" className={styles.cardIcon} />
          {producto.nombre}
        </div>
        
        <div className={styles.productType}>
          <UilLabel size="16" color="#718096" className={styles.cardIcon} />
          {producto.tipo_producto || 'Sin tipo'}
        </div>
        
        <div className={styles.cardFooter}>
          <span className={styles.productPrice}>
            ${Number(producto.precio_venta).toFixed(2)}
          </span>
          <span className={`${styles.productStatus} ${
            producto.activo ? styles.productStatusActive : styles.productStatusInactive
          }`}>
            {producto.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        
        <div className={styles.productActions}>
                  <button 
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(producto)}
                  >
                    <UilEdit size="18" color="#2563eb" />
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(producto.producto_id)}
                  >
                    <UilTrashAlt size="18" color="#dc2626" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              <UilSearch size="40" className={styles.noResultsIcon} />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

      {/* Formulario modal */}
      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>{currentProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            <form className={styles.productForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Código *</label>
                  <input 
                    type="text" 
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Código del producto"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Producto</label>
                  <select
                    name="tipo_producto"
                    value={formData.tipo_producto}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                  >
                    {tiposProducto.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Unidad de Medida</label>
                  <select
                    name="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                  >
                    {unidadesMedida.map((unidad) => (
                      <option key={unidad.value} value={unidad.value}>
                        {unidad.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Stock Actual</label>
                  <input 
                    type="number" 
                    name="stock_actual"
                    value={formData.stock_actual}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={styles.formInput}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Stock Mínimo</label>
                  <input 
                    type="number" 
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={styles.formInput}
                    placeholder="0"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Costo Unitario</label>
                  <div className={styles.priceInputContainer}>
                    <UilDollarSign size="18" color="#718096" className={styles.currencyIcon} />
                    <input 
                      type="text" 
                      name="costo_unitario"
                      value={formData.costo_unitario}
                      onChange={handlePriceChange}
                      className={styles.formInput}
                      placeholder="0.00"
                    />
                  </div>
                  {formData.costo_unitario && (
                    <span className={styles.currencyPreview}>
                      {formatCurrency(parseFloat(formData.costo_unitario) || 0)}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Precio de Venta *</label>
                  <div className={styles.priceInputContainer}>
                    <UilDollarSign size="18" color="#718096" className={styles.currencyIcon} />
                    <input 
                      type="text" 
                      name="precio_venta"
                      value={formData.precio_venta}
                      onChange={handlePriceChange}
                      required
                      className={styles.formInput}
                      placeholder="0.00"
                    />
                  </div>
                  {formData.precio_venta && (
                    <span className={styles.currencyPreview}>
                      {formatCurrency(parseFloat(formData.precio_venta) || 0)}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  className={styles.formTextarea}
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div className={styles.formCheckboxes}>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="es_terminado"
                    checked={formData.es_terminado}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxCheckmark}></span>
                  <span className={styles.checkboxLabel}>Producto Terminado</span>
                </label>
                
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxCheckmark}></span>
                  <span className={styles.checkboxLabel}>Activo</span>
                </label>
              </div>

              <div className={styles.formButtons}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitButton}>
                  {currentProduct ? 'Actualizar' : 'Guardar'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosManagerMobile;