import React, { useState, useEffect } from 'react';
import { UilSearch, UilPlus, UilEdit, UilTrashAlt, UilTimes, UilStore, UilPhone, UilMapMarker, UilUser, UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import styles from './Proveedor.module.css';
import { useAuth } from '../../auth/AuthContext';

const ProveedorManagerMobile = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentProveedor, setCurrentProveedor] = useState(null);
  const { user } = useAuth();

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Valor fijo para simplificar

  const [formData, setFormData] = useState({
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    contacto: '',
    activo: true
  });

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/proveedores`);
        if (!response.ok) {
          throw new Error('Error al obtener los proveedores');
        }
        const data = await response.json();
        setProveedores(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProveedores();
  }, []);

  const filteredProveedores = proveedores
    .filter(p => p && p.nombre && p.nit)
    .filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.nit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.contacto && p.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProveedores.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage);

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
      // Si hay pocas páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Si hay muchas páginas, mostrar un rango limitado
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.nombre || !formData.nit) {
        throw new Error('Nombre y NIT son requeridos');
      }

      const url = currentProveedor 
        ? `${process.env.REACT_APP_API_URL}/proveedores/${currentProveedor.proveedor_id}`
        : `${process.env.REACT_APP_API_URL}/proveedores`;

      const method = currentProveedor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...formData,
          ...(currentProveedor && {proveedor_id: currentProveedor.proveedor_id})
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar');
      }

      setProveedores(prevProveedores => {
        if (currentProveedor) {
          return prevProveedores.map(proveedor => 
            proveedor.proveedor_id === currentProveedor.proveedor_id 
              ? { ...responseData } 
              : proveedor
          );
        } else {
          return [...prevProveedores, responseData];
        }
      });

      setShowForm(false);
      alert(`Proveedor ${currentProveedor ? 'actualizado' : 'creado'} correctamente!`);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este proveedor?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/proveedores/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el proveedor');
        }

        setProveedores(proveedores.filter(p => p.proveedor_id !== id));
        alert('Proveedor eliminado correctamente');
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = (proveedor) => {
    setCurrentProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      nit: proveedor.nit,
      direccion: proveedor.direccion || '',
      telefono: proveedor.telefono || '',
      contacto: proveedor.contacto || '',
      activo: proveedor.activo || true
    });
    setShowForm(true);
  };

  const toggleActivo = async (id, currentStatus) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/proveedores/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ activo: !currentStatus })
      });

      if (!response.ok) {
        throw new Error('Error al cambiar el estado');
      }

      setProveedores(proveedores.map(p => 
        p.proveedor_id === id ? { ...p, activo: !currentStatus } : p
      ));
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando proveedores...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  // Componente de paginación reutilizable
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(filteredProveedores.length, 1)} - {Math.min(indexOfLastItem, filteredProveedores.length)} de {filteredProveedores.length} registros
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Proveedores</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentProveedor(null);
            setFormData({
              nombre: '',
              nit: '',
              direccion: '',
              telefono: '',
              contacto: '',
              activo: true
            });
            setShowForm(true);
          }}
        >
          <UilPlus size="24" color="#ffffff" />
        </button>
      </div>

      <div className={styles.searchContainer}>
        <UilSearch size="20" color="#718096" className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar proveedores..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Resetear a la primera página al buscar
          }}
          className={styles.searchInput}
        />
      </div>

      {/* Paginador superior - Solo visible en desktop */}
      <div className={styles.desktopOnly}>
        {filteredProveedores.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>

      <div className={styles.proveedoresList}>
        {currentItems.length > 0 ? (
          currentItems.map(proveedor => (
            <div key={proveedor.proveedor_id} className={styles.proveedorCard}>
              <div className={styles.cardHeader}>
                <div className={styles.proveedorTitle}>
                  <UilStore size="20" color="#4a5568" />
                  <span className={styles.proveedorName}>{proveedor.nombre}</span>
                </div>
                <div className={styles.statusContainer}>
                  <button 
                    className={`${styles.statusButton} ${proveedor.activo ? styles.active : styles.inactive}`}
                    onClick={() => toggleActivo(proveedor.proveedor_id, proveedor.activo)}
                  >
                    {proveedor.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <UilUser size="16" color="#718096" />
                  <span className={styles.infoLabel}>Contacto:</span>
                  <span className={styles.infoValue}>{proveedor.contacto || 'No especificado'}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <UilMapMarker size="16" color="#718096" />
                  <span className={styles.infoLabel}>Dirección:</span>
                  <span className={styles.infoValue}>{proveedor.direccion || 'No especificada'}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <UilPhone size="16" color="#718096" />
                  <span className={styles.infoLabel}>Teléfono:</span>
                  <span className={styles.infoValue}>{proveedor.telefono || 'No especificado'}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>NIT:</span>
                  <span className={styles.infoValue}>{proveedor.nit}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(proveedor)}
                  >
                    <UilEdit size="18" color="#2563eb" />
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(proveedor.proveedor_id)}
                  >
                    <UilTrashAlt size="18" color="#dc2626" />
                  </button>
                </div>
                <span className={styles.proveedorId}>ID: {proveedor.proveedor_id}</span>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <UilSearch size="40" className={styles.noResultsIcon} />
            <p>No se encontraron proveedores</p>
          </div>
        )}
      </div>

      {/* Paginador inferior - Visible en todos los dispositivos */}
      {filteredProveedores.length > itemsPerPage && (
        <Pagination position="bottom" />
      )}

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>{currentProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <form className={styles.proveedorForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                  placeholder="Nombre del proveedor"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>NIT *</label>
                <input 
                  type="text" 
                  name="nit"
                  value={formData.nit}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                  placeholder="Número de identificación tributaria"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Contacto</label>
                <input 
                  type="text" 
                  name="contacto"
                  value={formData.contacto}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Persona de contacto"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Teléfono</label>
                <input 
                  type="tel" 
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Número de teléfono"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input 
                  type="text" 
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className={styles.formInput}
                  placeholder="Dirección completa"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxContainer}>
                  <input 
                    type="checkbox" 
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxLabel}>Proveedor activo</span>
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
                  {currentProveedor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedorManagerMobile;