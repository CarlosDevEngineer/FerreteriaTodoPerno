import React, { useState, useEffect, useCallback } from 'react';
import { 
  UilSearch, 
  UilFilter,
  UilFileDownload,
  UilFile,
  UilChartPie,
  UilAngleLeft, 
  UilAngleRight,
  UilBox,
  UilArrowUp,
  UilArrowDown,
  UilCalendarAlt,
  UilUser
} from '@iconscout/react-unicons';
import styles from './Inventario.module.css';
import { useAuth } from '../../auth/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Íconos SVG (los mismos que en tu componente de ventas)
const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
  </svg>
);

const ExcelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6zm5-7.5h4.5v1.5H13v2h1.5V19H13v1.5h-2v-6zm5 0h2.5v1.5H16v1h1.5v1.5H16v1.5h-2v-6zm-10 0h3v1.5h-3v1h2v1.5h-2V19h3v1.5H9v-6z"/>
  </svg>
);

const Inventario = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: '',
    producto_id: ''
  });

  const { user } = useAuth();

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalMovimientos, setTotalMovimientos] = useState(0);

  // Tipos de movimiento (actualizados según tu respuesta)
  const tiposMovimiento = [
    { value: 'entrada_compra', label: 'Entrada por Compra', color: '#10b981', icon: UilArrowDown },
    { value: 'salida_venta', label: 'Salida por Venta', color: '#ef4444', icon: UilArrowUp },
    { value: 'ajuste', label: 'Ajuste', color: '#f59e0b', icon: UilChartPie },
    { value: 'entrada', label: 'Entrada', color: '#10b981', icon: UilArrowDown },
    { value: 'salida', label: 'Salida', color: '#ef4444', icon: UilArrowUp }
  ];

  // Obtener movimientos del backend
  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        
        // Agregar filtros a los parámetros
        if (filtros.tipo_movimiento) queryParams.append('tipo_movimiento', filtros.tipo_movimiento);
        if (filtros.fecha_desde) queryParams.append('fecha_desde', filtros.fecha_desde);
        if (filtros.fecha_hasta) queryParams.append('fecha_hasta', filtros.fecha_hasta);
        if (filtros.producto_id) queryParams.append('producto_id', filtros.producto_id);
        
        // Agregar paginación
        queryParams.append('page', currentPage);
        queryParams.append('limit', itemsPerPage);

        const response = await fetch(`http://localhost:5000/api/inventario-movimientos?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Error al obtener los movimientos de inventario');
        }
        
        const result = await response.json();
        
        // Verificar la estructura de la respuesta
        if (result.success && Array.isArray(result.data)) {
          setMovimientos(result.data);
          setTotalMovimientos(result.pagination?.total || result.data.length);
        } else {
          throw new Error('Estructura de respuesta inválida');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movimientos:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, [filtros, currentPage, itemsPerPage]);

  // Filtrar movimientos localmente por búsqueda
  const filteredMovimientos = movimientos.filter(mov => {
    if (!mov) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      mov.producto_nombre?.toLowerCase().includes(searchLower) ||
      mov.tipo_movimiento?.toLowerCase().includes(searchLower) ||
      mov.observaciones?.toLowerCase().includes(searchLower) ||
      mov.referencia_tipo?.toLowerCase().includes(searchLower) ||
      mov.producto_codigo?.toLowerCase().includes(searchLower)
    );
  });

  // Lógica de paginación
  const totalPages = Math.ceil(totalMovimientos / itemsPerPage);

  // Cambiar página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPrevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  // Generar números de página
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Resetear a primera página al cambiar filtros
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      tipo_movimiento: '',
      fecha_desde: '',
      fecha_hasta: '',
      producto_id: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Función para formatear fecha
  const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '--/--/----';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      let formatted = `${day}/${month}/${year}`;
      
      if (includeTime) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        formatted += ` ${hours}:${minutes}`;
      }
      
      return formatted;
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Exportar a Excel
  const exportarExcel = () => {
    try {
      const datosParaExportar = filteredMovimientos.map(mov => ({
        'ID Movimiento': mov.movimiento_id,
        'Producto': mov.producto_nombre,
        'Código': mov.producto_codigo,
        'Tipo Movimiento': mov.tipo_movimiento,
        'Cantidad': parseFloat(mov.cantidad),
        'Saldo Anterior': parseFloat(mov.saldo_anterior),
        'Saldo Posterior': parseFloat(mov.saldo_posterior),
        'Referencia': `${mov.referencia_tipo} #${mov.referencia_id}`,
        'Observaciones': mov.observaciones || '',
        'Fecha': formatDate(mov.fecha_movimiento, true),
        'Usuario': mov.usuario_nombre || 'N/A',
        'Unidad Medida': mov.unidad_medida
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosParaExportar);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos_Inventario');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fechaExportacion = new Date().toISOString().split('T')[0];
      saveAs(data, `movimientos_inventario_${fechaExportacion}.xlsx`);
      
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar a Excel: ' + error.message);
    }
  };

  // Exportar a PDF
  const exportarPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      
      // Título
      doc.setFontSize(18);
      doc.text('Reporte de Movimientos de Inventario', 14, 15);
      
      // Información del reporte
      doc.setFontSize(10);
      doc.text(`Generado el: ${formatDate(new Date().toISOString())}`, 14, 22);
      doc.text(`Total de movimientos: ${filteredMovimientos.length}`, 14, 28);
      
      // Preparar datos de la tabla
      const tableData = filteredMovimientos.map(mov => [
        mov.movimiento_id.toString(),
        mov.producto_nombre || 'N/A',
        mov.tipo_movimiento,
        parseFloat(mov.cantidad).toString(),
        parseFloat(mov.saldo_anterior).toString(),
        parseFloat(mov.saldo_posterior).toString(),
        formatDate(mov.fecha_movimiento),
        mov.usuario_nombre || 'N/A'
      ]);

      // Crear tabla PDF
      autoTable(doc, {
        startY: 35,
        head: [['ID', 'Producto', 'Tipo', 'Cantidad', 'Saldo Ant.', 'Saldo Post.', 'Fecha', 'Usuario']],
        body: tableData,
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [66, 153, 225],
          textColor: 255
        },
        margin: { top: 35 },
        theme: 'grid'
      });
      
      // Guardar PDF
      const fechaExportacion = new Date().toISOString().split('T')[0];
      doc.save(`movimientos_inventario_${fechaExportacion}.pdf`);
      
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar a PDF: ' + error.message);
    }
  };

  // Formatear fecha para display
  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener información del tipo de movimiento
  const getTipoMovimientoInfo = (tipo) => {
    return tiposMovimiento.find(t => t.value === tipo) || {
      label: tipo,
      color: '#6b7280',
      icon: UilBox
    };
  };

  // Componente de paginación
  const Pagination = ({ position }) => (
    <div className={`${styles.pagination} ${styles[position]}`}>
      <div className={styles.paginationInfo}>
        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalMovimientos)} de {totalMovimientos} registros
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

  if (loading) return <div className={styles.loading}>Cargando movimientos...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <UilBox size="32" color="#4299e1" />
          <h1>Movimientos de Inventario</h1>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.exportButtonExcel} 
            onClick={exportarExcel}
            disabled={filteredMovimientos.length === 0}
          >
            <ExcelIcon />
            Excel
          </button>
          <button 
            className={styles.exportButtonPDF} 
            onClick={exportarPDF}
            disabled={filteredMovimientos.length === 0}
          >
            <PdfIcon />
            PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersHeader}>
          <UilFilter size="20" color="#4a5568" />
          <span>Filtros</span>
        </div>
        
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label>Tipo de Movimiento</label>
            <select
              name="tipo_movimiento"
              value={filtros.tipo_movimiento}
              onChange={handleFilterChange}
              className={styles.filterSelect}
            >
              <option value="">Todos los tipos</option>
              {tiposMovimiento.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha Desde</label>
            <input
              type="date"
              name="fecha_desde"
              value={filtros.fecha_desde}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Fecha Hasta</label>
            <input
              type="date"
              name="fecha_hasta"
              value={filtros.fecha_hasta}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterActions}>
            <button className={styles.limpiarButton} onClick={limpiarFiltros}>
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className={styles.searchContainer}>
        <UilSearch size="20" color="#718096" className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Buscar por producto, observaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Paginador superior */}
      {totalMovimientos > itemsPerPage && (
        <Pagination position="top" />
      )}

      {/* Lista de movimientos */}
      <div className={styles.movimientosList}>
        {filteredMovimientos.length > 0 ? (
          filteredMovimientos.map(movimiento => {
            const tipoInfo = getTipoMovimientoInfo(movimiento.tipo_movimiento);
            const IconComponent = tipoInfo.icon;
            
            return (
              <div key={movimiento.movimiento_id} className={styles.movimientoCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.movimientoInfo}>
                    <div className={styles.tipoMovimiento} style={{ color: tipoInfo.color }}>
                      <IconComponent size="18" />
                      {tipoInfo.label}
                    </div>
                    <div className={styles.fechaMovimiento}>
                      <UilCalendarAlt size="14" />
                      {formatFecha(movimiento.fecha_movimiento)}
                    </div>
                  </div>
                  <div className={styles.referencia}>
                    {movimiento.referencia_tipo} #{movimiento.referencia_id}
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  <div className={styles.productoInfo}>
                    <UilBox size="16" className={styles.cardIcon} />
                    <span className={styles.productoNombre}>
                      {movimiento.producto_nombre || 'Producto no disponible'}
                    </span>
                    <span className={styles.productoCodigo}>
                      ({movimiento.producto_codigo || 'N/A'})
                    </span>
                  </div>
                  
                  <div className={styles.detallesMovimiento}>
                    <div className={styles.cantidadInfo}>
                      <span className={styles.cantidadLabel}>Cantidad:</span>
                      <span className={`${styles.cantidad} ${
                        movimiento.tipo_movimiento.includes('entrada') ? styles.cantidadPositiva : styles.cantidadNegativa
                      }`}>
                        {movimiento.tipo_movimiento.includes('entrada') ? '+' : '-'}{movimiento.cantidad}
                      </span>
                    </div>
                    
                    <div className={styles.saldos}>
                      <span>Saldo anterior: {movimiento.saldo_anterior}</span>
                      <span>Saldo posterior: {movimiento.saldo_posterior}</span>
                    </div>
                  </div>
                  
                  {movimiento.observaciones && (
                    <div className={styles.observaciones}>
                      <strong>Observaciones:</strong> {movimiento.observaciones}
                    </div>
                  )}
                </div>
                
                <div className={styles.cardFooter}>
                  <div className={styles.usuarioInfo}>
                    <UilUser size="14" />
                    Usuario: {movimiento.usuario_nombre || 'N/A'}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.noResults}>
            <UilSearch size="40" className={styles.noResultsIcon} />
            <p>No se encontraron movimientos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventario;