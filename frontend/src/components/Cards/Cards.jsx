// Cards.jsx - actualizar la parte de las cardsData y metas
import React, { useState, useEffect } from "react";
import "./Cards.css";
import Card from "../Card/Card";
import { UilUsdSquare, UilShoppingBag, UilPackage } from '@iconscout/react-unicons'; // Cambiar ícono

const Cards = () => {
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // METAS CONFIGURABLES - Actualizar para productos
  const metas = {
    ventas: 1000,        // Meta de $1000 en ventas mensuales
    compras: 500,        // Meta de $500 en compras mensuales
    productos: 50        // Meta de 50 productos registrados (ajusta según tu negocio)
  };

  // Función para calcular porcentajes basados en metas
  const calcularPorcentaje = (valor, tipo) => {
    switch(tipo) {
      case 'ventas':
        if (metas.ventas === 0) return 0;
        return Math.min(Math.round((valor / metas.ventas) * 100), 100);
      
      case 'compras':
        if (metas.compras === 0) return 0;
        return Math.min(Math.round((valor / metas.compras) * 100), 100);
      
      case 'productos':
        // Para productos: porcentaje basado en la meta de productos totales
        if (metas.productos === 0) return 0;
        return Math.min(Math.round((valor / metas.productos) * 100), 100);
      
      default:
        return 0;
    }
  };

  // Función para formatear valores
  const formatearValor = (valor, tipo) => {
    switch(tipo) {
      case 'ventas':
      case 'compras':
        return `Bs. ${valor.toLocaleString()}`;
      
      case 'productos':
        return `${valor} producto${valor !== 1 ? 's' : ''}`;
      
      default:
        return valor.toString();
    }
  };

  // Función para obtener el subtítulo (meta)
  const obtenerSubtitle = (tipo) => {
    switch(tipo) {
      case 'ventas':
        return `Meta: Bs. ${metas.ventas.toLocaleString()}`;
      
      case 'compras':
        return `Meta: Bs. ${metas.compras.toLocaleString()}`;
      
      case 'productos':
        return `Meta: ${metas.productos} productos`;
      
      default:
        return '';
    }
  };

  useEffect(() => {
    cargarMetricas();
  }, []);

  const cargarMetricas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando métricas del dashboard...');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/dashboard/metricas`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setMetricas(result.data);
        console.log('Métricas cargadas:', result.data);
      } else {
        throw new Error(result.message || 'Error en la respuesta del servidor');
      }
      
    } catch (error) {
      console.error('Error cargando métricas:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cardsData = [
    {
      title: "Ventas del Mes",
      subtitle: obtenerSubtitle('ventas'),
      color: {
        backGround: "linear-gradient(180deg, #1b4c5e 0%, #1389a7 100%)",
        boxShadow: "0px 10px 20px 0px #e0c6f5",
      },
      barValue: metricas ? calcularPorcentaje(metricas.ventasMes, 'ventas') : 0,
      value: metricas ? formatearValor(metricas.ventasMes, 'ventas') : "$0",
      png: UilUsdSquare,
      series: [
        {
          name: "Ventas",
          data: [31, 40, 28, 51, 42, 109, 100],
        },
      ],
    },
    {
      title: "Compras del Mes",
      subtitle: obtenerSubtitle('compras'),
      color: {
        backGround: "linear-gradient(180deg, #065a9e 0%, #0671c3 100%)",
        boxShadow: "0px 10px 20px 0px #FDC0C7",
      },
      barValue: metricas ? calcularPorcentaje(metricas.comprasMes, 'compras') : 0,
      value: metricas ? formatearValor(metricas.comprasMes, 'compras') : "$0",
      png: UilShoppingBag,
      series: [
        {
          name: "Compras",
          data: [10, 100, 50, 70, 80, 30, 40],
        },
      ],
    },
    {
      title: "Total Productos",
      subtitle: obtenerSubtitle('productos'),
      color: {
        backGround: "linear-gradient(180deg, #60b158 0%, #8bc34a 100%)", // Verde para productos
        boxShadow: "0px 10px 20px 0px #c8e6c9",
      },
      barValue: metricas ? calcularPorcentaje(metricas.totalProductos, 'productos') : 0,
      value: metricas ? formatearValor(metricas.totalProductos, 'productos') : "0 productos",
      png: UilPackage, // Ícono de paquete para productos
      series: [
        {
          name: "Productos",
          data: [5, 15, 25, 35, 45, 55, 65],
        },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="Cards">
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#666'
        }}>
          Cargando métricas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="Cards">
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#ff6b6b'
        }}>
          Error: {error}
          <br />
          <button 
            onClick={cargarMetricas}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="Cards">
      {cardsData.map((card, id) => (
        <div className="parentContainer" key={id}>
          <Card
            title={card.title}
            subtitle={card.subtitle}
            color={card.color}
            barValue={card.barValue}
            value={card.value}
            png={card.png}
            series={card.series}
          />
        </div>
      ))}
    </div>
  );
};

export default Cards;