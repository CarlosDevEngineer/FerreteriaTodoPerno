
import "./Updates.css";
import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
} from "@mui/material";

// Ícono SVG para el selector
const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

const ProductsChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState('mes'); 

  useEffect(() => {
    cargarDatosGrafico();
  }, [periodo]);

  const cargarDatosGrafico = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/productos-mas-vendidos?periodo=${periodo}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setChartData(result.data);
      } else {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }
      
    } catch (error) {
      console.error('Error cargando datos del gráfico:', error);
      setError(error.message);
      // Datos de ejemplo para demo
      setChartData(generarDatosDemo());
    } finally {
      setLoading(false);
    }
  };

  // Datos de demostración (eliminar cuando el backend esté listo)
  const generarDatosDemo = () => {
    const productos = [
      'Jabón Oriental',
      'Fragancia Floral', 
      'Envase 30ml',
      'Crema Hidratante',
      'Shampoo Natural',
      'Aceite Esencial',
      'Perfume Clásico',
      'Loción Corporal'
    ];
    
    return productos.map((producto, index) => ({
      producto: producto.length > 15 ? producto.substring(0, 15) + '...' : producto,
      ventas: Math.floor(Math.random() * 100) + 10,
      cantidad: Math.floor(Math.random() * 50) + 5,
      fullName: producto
    }));
  };

  // Colores para las barras
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

  return (
    <div className="ProductsChart">
      <div className="chart-header">
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={periodo}
            label="Período"
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <MenuItem value="dia">Hoy</MenuItem>
            <MenuItem value="semana">Esta semana</MenuItem>
            <MenuItem value="mes">Este mes</MenuItem>
            <MenuItem value="año">Este año</MenuItem>
          </Select>
        </FormControl>
      </div>

      {loading ? (
        <div className="chart-loading">
          Cargando datos del gráfico...
        </div>
      ) : error ? (
        <div className="chart-error">
          Error: {error}
          <button onClick={cargarDatosGrafico}>Reintentar</button>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60, // Más espacio para los nombres largos
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="producto" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'ventas') return [`${value} ventas`, 'Ventas'];
                  if (name === 'cantidad') return [`${value} unidades`, 'Cantidad'];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.fullName || label;
                  }
                  return label;
                }}
              />
              <Legend />
              <Bar 
                dataKey="ventas" 
                name="Total Ventas" 
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="cantidad" 
                name="Unidades Vendidas" 
                fill={COLORS[1]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resumen estadístico */}
      {!loading && !error && chartData.length > 0 && (
        <div className="chart-summary">
          <div className="summary-item">
            <span>Producto más vendido:</span>
            <strong>{chartData[0]?.fullName || chartData[0]?.producto}</strong>
          </div>
          <div className="summary-item">
            <span>Total ventas período:</span>
            <strong>{chartData.reduce((sum, item) => sum + item.ventas, 0)} ventas</strong>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsChart;