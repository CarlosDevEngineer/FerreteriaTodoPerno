import React, { useState, useEffect } from 'react';
import { UilSearch, UilPlus, UilEdit, UilTrashAlt, UilTimes, UilLayerGroup, UilInfoCircle, UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import styles from './ProductoCombo.module.css';
import { useAuth } from '../../auth/AuthContext';

const ComboManager = () => {
  const [combos, setCombos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showComboForm, setShowComboForm] = useState(false);
  const [showIngredienteForm, setShowIngredienteForm] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(null);
  const { user } = useAuth();

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Formulario combo
  const [comboForm, setComboForm] = useState({
    nombre: '',
    descripcion: '',
    precio: ''
  });

  // Formulario ingrediente
  const [ingredienteForm, setIngredienteForm] = useState({
    producto_id: '',
    cantidad: ''
  });

  // Lista temporal de ingredientes para el nuevo combo
  const [tempIngredientes, setTempIngredientes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener combos
        const combosResponse = await fetch(`${process.env.REACT_APP_API_URL}/combos`);
        if (!combosResponse.ok) throw new Error('Error al obtener los combos');
        const combosData = await combosResponse.json();
        
        // Obtener productos disponibles
        const productosResponse = await fetch(`${process.env.REACT_APP_API_URL}/productos`);
        if (!productosResponse.ok) throw new Error('Error al obtener los productos');
        const productosData = await productosResponse.json();
        
        setCombos(combosData);
        setProductos(productosData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCombos = combos
    .filter(c => c && c.nombre)
    .filter(c => 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCombos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCombos.length / itemsPerPage);

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

  const handleComboInputChange = (e) => {
    const { name, value } = e.target;
    setComboForm({
      ...comboForm,
      [name]: value
    });
  };

  const handleIngredienteInputChange = (e) => {
    const { name, value } = e.target;
    setIngredienteForm({
      ...ingredienteForm,
      [name]: value
    });
  };

  const handleAddTempIngrediente = () => {
    if (!ingredienteForm.producto_id || !ingredienteForm.cantidad) {
      alert('Seleccione un producto y especifique la cantidad');
      return;
    }

    const productoSeleccionado = productos.find(p => p.producto_id == ingredienteForm.producto_id);
    
    setTempIngredientes([...tempIngredientes, {
      producto_id: ingredienteForm.producto_id,
      cantidad: ingredienteForm.cantidad,
      nombre: productoSeleccionado.nombre,
      unidad_medida: productoSeleccionado.unidad_medida
    }]);

    // Resetear formulario de ingrediente
    setIngredienteForm({
      producto_id: '',
      cantidad: ''
    });
  };

  const handleRemoveTempIngrediente = (index) => {
    const nuevosIngredientes = [...tempIngredientes];
    nuevosIngredientes.splice(index, 1);
    setTempIngredientes(nuevosIngredientes);
  };

  const handleComboSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!comboForm.nombre || !comboForm.precio) {
        throw new Error('Nombre y precio son requeridos');
      }

      if (tempIngredientes.length === 0 && !currentCombo) {
        throw new Error('Debe agregar al menos un ingrediente');
      }

      // 1. Primero crear/actualizar el combo
      const url = currentCombo 
        ? `${process.env.REACT_APP_API_URL}/combos/${currentCombo.combo_id}`
        : `${process.env.REACT_APP_API_URL}/combos`;

      const method = currentCombo ? 'PUT' : 'POST';

      const comboResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          nombre: comboForm.nombre,
          descripcion: comboForm.descripcion || null,
          precio: parseFloat(comboForm.precio)
        })
      });

      if (!comboResponse.ok) {
        const errorData = await comboResponse.json();
        throw new Error(errorData.message || 'Error al guardar el combo');
      }

      const comboData = await comboResponse.json();

      // 2. Si es un nuevo combo, agregar los ingredientes
      if (!currentCombo) {
        for (const ingrediente of tempIngredientes) {
          await fetch(`${process.env.REACT_APP_API_URL}/combos/${comboData.combo_id}/ingredientes`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify({
              producto_id: parseInt(ingrediente.producto_id),
              cantidad: parseFloat(ingrediente.cantidad)
            })
          });
        }
      }

      // Actualizar la lista de combos
      const updatedResponse = await fetch(`${process.env.REACT_APP_API_URL}/combos`);
      const updatedData = await updatedResponse.json();
      setCombos(updatedData);

      setShowComboForm(false);
      setTempIngredientes([]);
      alert(`Combo ${currentCombo ? 'actualizado' : 'creado'} correctamente!`);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteCombo = async (id) => {
    if (window.confirm('¿Eliminar este combo y todos sus ingredientes?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/combos/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el combo');
        }

        setCombos(combos.filter(c => c.combo_id !== id));
        alert('Combo eliminado correctamente');
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleDeleteIngrediente = async (comboId, ingredienteId) => {
    if (window.confirm('¿Eliminar este ingrediente del combo?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/combos/${comboId}/ingredientes/${ingredienteId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el ingrediente');
        }

        // Actualizar la lista de combos
        const updatedCombos = await fetch(`${process.env.REACT_APP_API_URL}/combos`);
        const updatedData = await updatedCombos.json();
        setCombos(updatedData);

        alert('Ingrediente eliminado correctamente');
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleEditCombo = (combo) => {
    setCurrentCombo(combo);
    setComboForm({
      nombre: combo.nombre,
      descripcion: combo.descripcion || '',
      precio: combo.precio.toString()
    });
    setTempIngredientes([]);
    setShowComboForm(true);
  };

  const handleAddIngrediente = (combo) => {
    setCurrentCombo(combo);
    setIngredienteForm({
      producto_id: '',
      cantidad: ''
    });
    setShowIngredienteForm(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(value);
  };

  // Componente de paginación reutilizable
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(filteredCombos.length, 1)} - {Math.min(indexOfLastItem, filteredCombos.length)} de {filteredCombos.length} registros
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

  if (loading) return <div className={styles.loading}>Cargando combos...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gestión de Combos</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentCombo(null);
            setComboForm({
              nombre: '',
              descripcion: '',
              precio: ''
            });
            setTempIngredientes([]);
            setShowComboForm(true);
          }}
        >
          <UilPlus size="24" color="#ffffff" />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <UilSearch size="20" color="#718096" className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar combos..."
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
        {filteredCombos.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>

      <div className={styles.combosList}>
        {currentItems.length > 0 ? (
          currentItems.map(combo => (
            <div key={combo.combo_id} className={styles.comboCard}>
              <div className={styles.cardHeader}>
                <div className={styles.comboTitle}>
                  <UilLayerGroup size="20" color="#4a5568" />
                  <span className={styles.comboName}>{combo.nombre}</span>
                </div>
                <span className={styles.comboPrice}>{formatCurrency(combo.precio)}</span>
              </div>
              
              {combo.descripcion && (
                <div className={styles.comboDescription}>
                  <UilInfoCircle size="16" color="#718096" />
                  <span>{combo.descripcion}</span>
                </div>
              )}
              
              <div className={styles.ingredientesList}>
                <h3>Ingredientes:</h3>
                {combo.ingredientes && combo.ingredientes.length > 0 ? (
                  combo.ingredientes.map(ingrediente => (
                    <div key={ingrediente.ingrediente_id} className={styles.ingredienteItem}>
                      <span className={styles.ingredienteName}>
                        {ingrediente.nombre_producto}
                      </span>
                      <span className={styles.ingredienteQuantity}>
                        {ingrediente.cantidad} {ingrediente.unidad_medida}
                      </span>
                      <button 
                        className={styles.deleteIngredienteButton}
                        onClick={() => handleDeleteIngrediente(combo.combo_id, ingrediente.ingrediente_id)}
                      >
                        <UilTrashAlt size="16" color="#dc2626" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={styles.noIngredientes}>
                    Este combo no tiene ingredientes registrados
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <button 
                  className={styles.addIngredienteButton}
                  onClick={() => handleAddIngrediente(combo)}
                >
                  <UilPlus size="16" color="#ffffff" />
                  Agregar Ingrediente
                </button>
                <div className={styles.comboActions}>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleEditCombo(combo)}
                  >
                    <UilEdit size="18" color="#2563eb" />
                  </button>
                  <button 
                    className={styles.deleteButton}
                    onClick={() => handleDeleteCombo(combo.combo_id)}
                  >
                    <UilTrashAlt size="18" color="#dc2626" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <UilLayerGroup size="40" className={styles.noResultsIcon} />
            <p>No se encontraron combos</p>
          </div>
        )}
      </div>

      {/* Paginador inferior - Visible en todos los dispositivos */}
      {filteredCombos.length > itemsPerPage && (
        <Pagination position="bottom" />
      )}

      {/* Formulario de Combo */}
      {showComboForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>{currentCombo ? 'Editar Combo' : 'Nuevo Combo'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => {
                  setShowComboForm(false);
                  setTempIngredientes([]);
                }}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <form className={styles.comboForm} onSubmit={handleComboSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre del Combo *</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={comboForm.nombre}
                    onChange={handleComboInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Ej: Perfume Floral 30ml"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Precio de Venta *</label>
                  <input 
                    type="number" 
                    name="precio"
                    min="0"
                    step="0.01"
                    value={comboForm.precio}
                    onChange={handleComboInputChange}
                    required
                    className={styles.formInput}
                    placeholder="0.00"
                  />
                </div>
                
                {/* LABEL DE DESCRIPCION OCULTO EN MOBILE 
                <div className={styles.formGroup}>
                  <label>Descripción</label>
                  <textarea
                    name="descripcion"
                    value={comboForm.descripcion}
                    onChange={handleComboInputChange}
                    className={styles.formTextarea}
                    placeholder="Descripción detallada del combo"
                    rows="3"
                  />
                </div>*/}
              </div>

              {/* Lista de ingredientes temporales */}
              {!currentCombo && (
                <div className={styles.ingredientesSection}>
                  <h3>Ingredientes del Combo *</h3>
                  
                  {tempIngredientes.length > 0 ? (
                    <div className={styles.tempIngredientesList}>
                      {tempIngredientes.map((ingrediente, index) => (
                        <div key={index} className={styles.tempIngredienteItem}>
                          <span>{ingrediente.nombre}</span>
                          <span>{ingrediente.cantidad} {ingrediente.unidad_medida}</span>
                          <button
                            type="button"
                            className={styles.removeTempIngredienteButton}
                            onClick={() => handleRemoveTempIngrediente(index)}
                          >
                            <UilTrashAlt size="14" color="#dc2626" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noTempIngredientes}>No hay ingredientes agregados</p>
                  )}

                  <div className={styles.addIngredienteForm}>
                    <div className={styles.formGroup}>
                      <label>Producto *</label>
                      <select
                        name="producto_id"
                        value={ingredienteForm.producto_id}
                        onChange={handleIngredienteInputChange}
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
                    
                    <div className={styles.formGroup}>
                      <label>Cantidad *</label>
                      <input 
                        type="number" 
                        name="cantidad"
                        min="0.01"
                        step="0.01"
                        value={ingredienteForm.cantidad}
                        onChange={handleIngredienteInputChange}
                        className={styles.formInput}
                        placeholder="Ej: 24.5"
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.addTempIngredienteButton}
                      onClick={handleAddTempIngrediente}
                    >
                      <UilPlus size="16" color="#ffffff" />
                      Agregar Ingrediente
                    </button>
                  </div>
                </div>
              )}

              <div className={styles.formButtons}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowComboForm(false);
                    setTempIngredientes([]);
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitButton}>
                  {currentCombo ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario para agregar ingredientes a combos existentes */}
      {showIngredienteForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>Agregar Ingrediente - {currentCombo?.nombre}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowIngredienteForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <form className={styles.ingredienteForm} onSubmit={async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/combos/${currentCombo.combo_id}/ingredientes`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                  },
                  body: JSON.stringify({
                    producto_id: parseInt(ingredienteForm.producto_id),
                    cantidad: parseFloat(ingredienteForm.cantidad)
                  })
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.message || 'Error al agregar ingrediente');
                }

                // Actualizar la lista de combos
                const updatedCombos = await fetch(`${process.env.REACT_APP_API_URL}/combos`);
                const updatedData = await updatedCombos.json();
                setCombos(updatedData);

                setShowIngredienteForm(false);
                alert('Ingrediente agregado correctamente!');
              } catch (err) {
                console.error('Error:', err);
                setError(err.message);
                alert(`Error: ${err.message}`);
              }
            }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Producto *</label>
                  <select
                    name="producto_id"
                    value={ingredienteForm.producto_id}
                    onChange={handleIngredienteInputChange}
                    required
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
                
                <div className={styles.formGroup}>
                  <label>Cantidad *</label>
                  <input 
                    type="number" 
                    name="cantidad"
                    min="0.01"
                    step="0.01"
                    value={ingredienteForm.cantidad}
                    onChange={handleIngredienteInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Ej: 24.5"
                  />
                </div>
              </div>

              <div className={styles.formButtons}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowIngredienteForm(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitButton}>
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboManager;