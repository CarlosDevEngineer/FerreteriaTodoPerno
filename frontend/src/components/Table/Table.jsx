import React, { useState, useEffect, useCallback } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { 
  Button, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField 
} from "@mui/material";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "./Table.css";

// Íconos SVG
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

const makeStyle = (status) => {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower.includes('completado') || statusLower.includes('aprobado') || statusLower.includes('entregado')) {
    return {
      background: 'rgb(145 254 159 / 47%)',
      color: 'green',
      fontWeight: 'bold',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'inline-block',
      minWidth: '80px',
      textAlign: 'center'
    }
  }
  else if (statusLower.includes('pendiente') || statusLower.includes('procesando')) {
    return {
      background: '#ffadad8f',
      color: 'red',
      fontWeight: 'bold',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'inline-block',
      minWidth: '80px',
      textAlign: 'center'
    }
  }
  else {
    return {
      background: '#59bfff',
      color: 'white',
      fontWeight: 'bold',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'inline-block',
      minWidth: '80px',
      textAlign: 'center'
    }
  }
}

export default function VentasTable() {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Usar useCallback para memoizar la función de aplicar filtros
  const aplicarFiltros = useCallback(() => {
    if (ventas.length === 0) {
      setVentasFiltradas([]);
      return;
    }

    let ventasFiltradas = [...ventas];
    const hoy = new Date();

    console.log('Aplicando filtro:', filtroPeriodo);
    console.log('Total ventas:', ventas.length);

    switch (filtroPeriodo) {
      case 'diario':
        const hoyInicio = new Date(hoy);
        hoyInicio.setHours(0, 0, 0, 0);
        const hoyFin = new Date(hoy);
        hoyFin.setHours(23, 59, 59, 999);
        
        ventasFiltradas = ventasFiltradas.filter(venta => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= hoyInicio && fechaVenta <= hoyFin;
        });
        console.log('Ventas diarias:', ventasFiltradas.length);
        break;
      
      case 'semanal':
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        
        ventasFiltradas = ventasFiltradas.filter(venta => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= inicioSemana;
        });
        console.log('Ventas semanales:', ventasFiltradas.length);
        break;
      
      case 'mensual':
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        finMes.setHours(23, 59, 59, 999);
        
        ventasFiltradas = ventasFiltradas.filter(venta => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta >= inicioMes && fechaVenta <= finMes;
        });
        console.log('Ventas mensuales:', ventasFiltradas.length);
        break;
      
      case 'personalizado':
        if (fechaInicio && fechaFin) {
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          fin.setHours(23, 59, 59, 999);
          
          ventasFiltradas = ventasFiltradas.filter(venta => {
            const fechaVenta = new Date(venta.fecha);
            return fechaVenta >= inicio && fechaVenta <= fin;
          });
          console.log('Ventas personalizadas:', ventasFiltradas.length);
        }
        break;
      
      default: // 'todos'
        ventasFiltradas = [...ventas];
        console.log('Todas las ventas:', ventasFiltradas.length);
        break;
    }

    setVentasFiltradas(ventasFiltradas);
  }, [ventas, filtroPeriodo, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarVentasRecientes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]); // Ahora solo depende de aplicarFiltros
  // Dentro de Table.jsx - agrega estas funciones
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

const formatTime = (dateString) => {
  if (!dateString) return '--:--';
  
  try {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    return '--:--';
  }
};
  const cargarVentasRecientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando ventas recientes...');
      const response = await fetch('http://localhost:5000/api/dashboard/ventas-recientes');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Ventas cargadas:', result.data);
        setVentas(result.data);
      } else {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }

    } catch (error) {
      console.error('Error cargando ventas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha a YYYY-MM-DD (para inputs de fecha)
  const formatearFechaInput = (fechaString) => {
    try {
      const fecha = new Date(fechaString);
      return fecha.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  // Establecer fechas por defecto para filtro personalizado
  useEffect(() => {
    if (filtroPeriodo === 'personalizado' && !fechaInicio && !fechaFin) {
      const hoy = new Date();
      const haceUnaSemana = new Date();
      haceUnaSemana.setDate(hoy.getDate() - 7);
      
      setFechaInicio(formatearFechaInput(haceUnaSemana));
      setFechaFin(formatearFechaInput(hoy));
    }
  }, [filtroPeriodo, fechaInicio, fechaFin]);

  const exportarExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(ventasFiltradas.map(v => ({
        'Factura': v.factura || v.id,
        'Cliente': v.cliente,
        'Productos': v.productos,
        'Fecha': v.fecha,
        'Total': v.total,
        'Estado': v.estado
      })));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
      
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(data, `ventas_${filtroPeriodo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar a Excel: ' + error.message);
    }
  };

  const exportarPDF = () => {
    try {
      // Crear instancia de PDF con orientación landscape para más espacio
      const doc = new jsPDF('landscape');
      
      // Título
      doc.setFontSize(18);
      doc.text(`Reporte de Ventas - ${filtroPeriodo.toUpperCase()}`, 14, 15);
      
      // Información del reporte
      doc.setFontSize(10);
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 22);
      doc.text(`Total de ventas: ${ventasFiltradas.length}`, 14, 28);
      
      // Preparar datos de la tabla
      const tableData = ventasFiltradas.map(v => [
        v.factura || v.id,
        v.cliente,
        v.productos.length > 25 ? v.productos.substring(0, 25) + '...' : v.productos,
        v.fecha,
        v.total,
        v.estado
      ]);

      // Crear tabla PDF
      autoTable(doc, {
        startY: 35,
        head: [['Factura', 'Cliente', 'Productos', 'Fecha', 'Total', 'Estado']],
        body: tableData,
        styles: { 
          fontSize: 8, 
          cellPadding: 2,
          overflow: 'linebreak'
        },
        headStyles: { 
          fillColor: [66, 135, 245],
          textColor: 255
        },
        margin: { top: 35 },
        theme: 'grid'
      });
      
      // Guardar PDF
      doc.save(`ventas_${filtroPeriodo}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      alert('Error al exportar a PDF: ' + error.message);
    }
  };

  const calcularTotal = () => {
    return ventasFiltradas.reduce((total, venta) => {
      // Extraer el valor numérico del total
      const valorTexto = venta.total.replace('Bs.', '').replace(/\./g, '').replace(',', '.').trim();
      const valor = parseFloat(valorTexto);
      return total + (isNaN(valor) ? 0 : valor);
    }, 0);
  };

  if (loading) {
    return (
      <div className="Table">
        <h3>Ventas Recientes</h3>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Cargando ventas...
        </div>
      </div>
    );
  }

  return (
    <div className="Table">
      <div className="table-header">
        <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.5rem' }}>Ventas Recientes</h3>
        
        <div className="table-controls">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Período</InputLabel>
            <div className="selector-fechas">
              <Select
                value={filtroPeriodo}
                label="Período"
                onChange={(e) => setFiltroPeriodo(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="diario">Hoy</MenuItem>
                <MenuItem value="semanal">Esta semana</MenuItem>
                <MenuItem value="mensual">Este mes</MenuItem>
                <MenuItem value="personalizado">Personalizado</MenuItem>
              </Select>
            </div>
          </FormControl>

          {filtroPeriodo === 'personalizado' && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Desde"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                size="small"
                label="Hasta"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}

          <div className="export-buttons">
            <div className="button-excel">
              <Button
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={exportarExcel}
                size="small"
                color="success"
                sx={{ 
                    color: 'white',
                    '&:hover': {
                      color: 'white'
                    }
                  }}
                disabled={ventasFiltradas.length === 0}
              >
                Excel
              </Button>
            </div>
            <div className="button-pdf">
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={exportarPDF}
                size="small"
                color="error"
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    color: 'white'
                  }
                }}
                disabled={ventasFiltradas.length === 0}
              >
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="table-summary">
        <span>
          📊 {ventasFiltradas.length} ventas encontradas
        </span>
        <span>
          💰 Total: Bs. {calcularTotal().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {error ? (
        <div className="error-container">
          ❌ Error: {error}
          <br />
          <Button 
            variant="contained"
            onClick={cargarVentasRecientes}
            sx={{ mt: 1 }}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <div className="table-scroll-container">
          <TableContainer component={Paper} sx={{ boxShadow: 'none', height: '250px' }}>
            <Table className="responsive-table" aria-label="tabla de ventas" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell align="left"><strong>Factura</strong></TableCell>
                  <TableCell align="left"><strong>Productos</strong></TableCell>
                  <TableCell align="left"><strong>Fecha</strong></TableCell>
                  <TableCell align="left"><strong>Hora</strong></TableCell>
                  <TableCell align="left"><strong>Total</strong></TableCell>
                  <TableCell align="left"><strong>Estado</strong></TableCell>
                  {/* Eliminada la columna "Acciones" */}
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" style={{ padding: '3rem' }}>
                      <div className="no-data-message">
                        {ventas.length === 0 
                          ? '📝 No hay ventas registradas' 
                          : `🔍 No hay ventas para el período "${filtroPeriodo}" seleccionado`
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  ventasFiltradas.map((venta) => (
                    <TableRow
                      key={venta.id}
                      sx={{ 
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: "#f8f9fa" }
                      }}
                    >
                      <TableCell component="th" scope="row" style={{ fontWeight: '500' }}>
                        {venta.cliente}
                      </TableCell>
                      <TableCell align="left" style={{ fontFamily: 'monospace', color: '#666' }}>
                        #{venta.factura || venta.id}
                      </TableCell>
                      <TableCell align="left" title={venta.productos}>
                        <div style={{ maxWidth: '200px' }}>
                          {venta.productos.length > 35 
                            ? venta.productos.substring(0, 35) + '...' 
                            : venta.productos
                          }
                        </div>
                      </TableCell>
                      <TableCell align="left" style={{ fontWeight: '500' }}>
                        {formatDate(venta.fecha)}
                      </TableCell>
                      <TableCell align="left" style={{ color: '#666', fontFamily: 'monospace' }}>
                        {formatTime(venta.fecha)}
                      </TableCell>
                      <TableCell align="left" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {venta.total}
                      </TableCell>
                      <TableCell align="left">
                        <span style={makeStyle(venta.estado)}>
                          {venta.estado}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </div>
  );
}