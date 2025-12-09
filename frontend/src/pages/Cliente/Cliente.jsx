import React, { useState, useEffect } from 'react';
import { UilSearch, UilPlus, UilEdit, UilTrashAlt, UilTimes, UilAngleLeft, UilAngleRight } from '@iconscout/react-unicons';
import styles from './Cliente.module.css';
import { useAuth } from '../../auth/AuthContext';

const ClienteManagerMobile = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentCliente, setCurrentCliente] = useState(null);
  const { user } = useAuth();

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    nit_ci: '',
    nombre: '',
    telefono: ''
  });
  const [errors, setErrors] = useState({
    nit_ci: '',
    nombre: '',
    telefono: ''
  });


  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/clientes`);
        if (!response.ok) {
          throw new Error('Error al obtener los clientes');
        }
        const data = await response.json();
        setClientes(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  const filteredClientes = clientes
    .filter(c => c && c.nit_ci && c.nombre)
    .filter(c => 
      c.nit_ci.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.telefono && c.telefono.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

      if (name === 'nombre') {
        if (/^[A-Za-z\s]*$/.test(value)) {
          setFormData({ ...formData, [name]: value });

          setErrors(prev => ({
            ...prev,
            nombre: value.trim() === '' ? 'Nombre es obligatorio' : ''
          }));
        }
      }

      if (name === 'nit_ci') {
        if (/^\d{0,9}$/.test(value)) {
          setFormData({ ...formData, [name]: value });

          setErrors(prev => ({
            ...prev,
            nit_ci: value.trim() === '' ? 'NIT/CI es obligatorio' : ''
          }));
        }
      }

      if (name === 'telefono') {
        if (/^\d{0,8}$/.test(value)) {
          setFormData({ ...formData, [name]: value });

          // Validación en tiempo real para que sea obligatorio
          setErrors(prev => ({
            ...prev,
            telefono: value.trim() === '' ? 'Teléfono es obligatorio' : ''
          }));
        }
      }
    };



  const handleSubmit = async (e) => {
    e.preventDefault();
      if (!formData.nit_ci || !formData.nombre || !formData.telefono) {
      let mensaje = 'Por favor complete los campos obligatorios:\n';
      if (!formData.nit_ci) mensaje += '- NIT/CI\n';
      if (!formData.nombre) mensaje += '- Nombre\n';
      if (!formData.telefono) mensaje += '- Teléfono\n';
      alert(mensaje);
      return;
    }
    
    try {
      if (!formData.nit_ci || !formData.nombre) {
        throw new Error('NIT/CI y Nombre son requeridos');
      }

      const url = currentCliente 
        ? `${process.env.REACT_APP_API_URL}/clientes/${currentCliente.cliente_id}`
        : `${process.env.REACT_APP_API_URL}/clientes`;

      const method = currentCliente ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...formData,
          ...(currentCliente && {cliente_id: currentCliente.cliente_id})
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar');
      }

      setClientes(prevClientes => {
        if (currentCliente) {
          return prevClientes.map(cliente => 
            cliente.cliente_id === currentCliente.cliente_id 
              ? { ...responseData } 
              : cliente
          );
        } else {
          return [...prevClientes, responseData];
        }
      });

      setShowForm(false);
      alert(`Cliente ${currentCliente ? 'actualizado' : 'creado'} correctamente!`);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este cliente?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/clientes/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el cliente');
        }

        setClientes(clientes.filter(c => c.cliente_id !== id));
        alert('Cliente eliminado correctamente');
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = (cliente) => {
    setCurrentCliente(cliente);
    setFormData({
      nit_ci: cliente.nit_ci,
      nombre: cliente.nombre,
      telefono: cliente.telefono || ''
    });
    setShowForm(true);
  };

  // Componente de paginación reutilizable
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(filteredClientes.length, 1)} - {Math.min(indexOfLastItem, filteredClientes.length)} de {filteredClientes.length} registros
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

  if (loading) return <div className={styles.loading}>Cargando clientes...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Clientes</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentCliente(null);
            setFormData({
              nit_ci: '',
              nombre: '',
              telefono: ''
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
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className={styles.searchInput}
        />
      </div>

      {/* Paginador superior - Solo visible en desktop 
      <div className={styles.desktopOnly}>
        {filteredClientes.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>*/}

      <div className={styles.clientesList}>
        {currentItems.length > 0 ? (
          currentItems.map(cliente => (
            <div key={cliente.cliente_id} className={styles.clienteCard}>
              <div className={styles.cardHeader}>
                <span className={styles.clienteName}>{cliente.nombre}</span>
                <span className={styles.clienteId}>ID: {cliente.cliente_id}</span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>NIT/CI:</span>
                  <span className={styles.infoValue}>{cliente.nit_ci}</span>
                </div>
                
                {cliente.telefono && (
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Teléfono:</span>
                    <span className={styles.infoValue}>{cliente.telefono}</span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(cliente)}
                  >
                    <UilEdit size="18" color="#2563eb" />
                    <span>Editar</span>
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(cliente.cliente_id)}
                  >
                    <UilTrashAlt size="18" color="#dc2626" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <UilSearch size="40" className={styles.noResultsIcon} />
            <p>No se encontraron clientes</p>
          </div>
        )}
      </div>

      {/* Paginador inferior - Visible en todos los dispositivos */}
      {filteredClientes.length > itemsPerPage && (
        <Pagination position="bottom" />
      )}

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>{currentCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            
            <form className={styles.clienteForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>NIT/CI *</label>
                  <input 
                    type="text" 
                    name="nit_ci"
                    value={formData.nit_ci}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Número de identificación"
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
                    placeholder="Nombre completo del cliente"
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
                  {currentCliente ? 'Actualizar' : 'Guardar'} Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteManagerMobile;