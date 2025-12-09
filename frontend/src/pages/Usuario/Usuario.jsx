import React, { useState, useEffect } from 'react';
import { 
  UilSearch, 
  UilPlus, 
  UilEdit, 
  UilTrashAlt, 
  UilTimes, 
  UilAngleLeft, 
  UilAngleRight,
  UilUser,
  UilUserCircle,
  UilShield,
  UilKeySkeleton
} from '@iconscout/react-unicons';
import styles from './Usuario.module.css';
import {useAuth} from '../../auth/AuthContext';

const UsuariosManagerMobile = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState(null);
  const {user} = useAuth();

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    rol: 'usuario',
    password: '',
    password_hash: ''
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios`);
        if (!response.ok) {
          throw new Error('Error al obtener los usuarios');
        }
        const data = await response.json();
        setUsuarios(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const filteredUsuarios = usuarios
    .filter(u => u && u.username && u.nombre)
    .filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Lógica de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

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

    if (name === "nombre") {
      if (!/^[A-Za-z\s]*$/.test(value)) return; 
    }

    if (name === "username") {
      if (/^\d+$/.test(value)) return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.nombre || !formData.username || !formData.rol) {
        throw new Error('Nombre, username y rol son requeridos');
      }

      if (!currentUsuario && !formData.password) {
        throw new Error('La contraseña es requerida para nuevo usuario');
      }

      const url = currentUsuario 
        ? `${process.env.REACT_APP_API_URL}/usuarios/${currentUsuario.usuario_id}`
        : `${process.env.REACT_APP_API_URL}/usuarios`;

      const method = currentUsuario ? 'PUT' : 'POST';

      const usuarioData = {
        nombre: formData.nombre,
        username: formData.username,
        rol: formData.rol
      };

      if (!currentUsuario) {
        usuarioData.password = formData.password;
      } else if (formData.password) {
        usuarioData.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...usuarioData,
          ...(currentUsuario && {usuario_id: currentUsuario.usuario_id})
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al guardar');
      }

      setUsuarios(prevUsuarios => {
        if (currentUsuario) {
          return prevUsuarios.map(usuario => 
            usuario.usuario_id === currentUsuario.usuario_id 
              ? { ...responseData } 
              : usuario
          );
        } else {
          return [...prevUsuarios, responseData];
        }
      });

      setShowForm(false);
      alert(`Usuario ${currentUsuario ? 'actualizado' : 'creado'} correctamente!`);

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este usuario?')) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al eliminar el usuario');
        }

        setUsuarios(usuarios.filter(u => u.usuario_id !== id));
        alert('Usuario eliminado correctamente');
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleEdit = (usuario) => {
    setCurrentUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol,
      password: '',
      password_hash: usuario.password_hash
    });
    setShowForm(true);
  };

  // Componente de paginación reutilizable
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {Math.min(filteredUsuarios.length, 1)} - {Math.min(indexOfLastItem, filteredUsuarios.length)} de {filteredUsuarios.length} registros
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

  if (loading) return <div className={styles.loading}>Cargando usuarios...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Usuarios</h1>
        <button 
          className={styles.addButton}
          onClick={() => {
            setCurrentUsuario(null);
            setFormData({
              nombre: '',
              username: '',
              rol: 'admin',
              password: '',
              password_hash: ''
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
          placeholder="Buscar usuarios..."
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
        {filteredUsuarios.length > itemsPerPage && (
          <Pagination position="top" />
        )}
      </div>

      <div className={styles.usuariosList}>
        {currentItems.length > 0 ? (
          currentItems.map(usuario => (
            <div key={usuario.usuario_id} className={styles.usuarioCard}>
              <div className={styles.cardHeader}>
                <div className={styles.usuarioTitle}>
                  <UilUserCircle size="20" color="#4a5568" />
                  <span className={styles.usuarioUsername}>{usuario.username}</span>
                </div>
                <span className={`${styles.rolStatus} ${styles[usuario.rol]}`}>
                  {usuario.rol === 'admin' && <UilShield size="16" />}
                  {usuario.rol === 'usuario' && <UilUser size="16" />}
                  {usuario.rol}
                </span>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Nombre:</span>
                  <span className={styles.infoValue}>{usuario.nombre}</span>
                </div>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>ID:</span>
                  <span className={styles.infoValue}>{usuario.usuario_id}</span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.actionButton} ${styles.editButton}`}
                    onClick={() => handleEdit(usuario)}
                  >
                    <UilEdit size="18" color="#2563eb" />
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(usuario.usuario_id)}
                  >
                    <UilTrashAlt size="18" color="#dc2626" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>
            <UilSearch size="40" className={styles.noResultsIcon} />
            <p>No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Paginador inferior - Visible en todos los dispositivos */}
      {filteredUsuarios.length > itemsPerPage && (
        <Pagination position="bottom" />
      )}

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formModal}>
            <div className={styles.formHeader}>
              <h2>{currentUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowForm(false)}
              >
                <UilTimes size="24" color="#64748b" />
              </button>
            </div>
            <form className={styles.usuarioForm} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nombre *</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Username *</label>
                  <input 
                    type="text" 
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                    placeholder="Nombre de usuario"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Rol *</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    required
                    className={styles.formSelect}
                  >
                    <option value="admin">Administrador</option>
                    <option value="ventas">Ventas</option>
                  </select>
                </div>

                {!currentUsuario ? (
                  <div className={styles.formGroup}>
                    <label>Contraseña *</label>
                    <div className={styles.passwordInputContainer}>
                      <UilKeySkeleton size="18" color="#718096" className={styles.passwordIcon} />
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className={styles.formInput}
                        placeholder="******"
                      />
                    </div>
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label>Nueva Contraseña</label>
                    <div className={styles.passwordInputContainer}>
                      <UilKeySkeleton size="18" color="#718096" className={styles.passwordIcon} />
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="Dejar en blanco para no cambiar"
                      />
                    </div>
                  </div>
                )}
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
                  {currentUsuario ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosManagerMobile;