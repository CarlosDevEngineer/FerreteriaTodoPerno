// utils/FormatoFecha.js
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Fecha no disponible';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }

    // Opciones por defecto
    const defaultOptions = {
      format: 'dd/mm/yyyy', // 'dd/mm/yyyy', 'dd/mm/yy', 'full', 'time'
      time: false, // incluir hora
      locale: 'es-ES' // español
    };

    const config = { ...defaultOptions, ...options };

    // Formatear fecha según las opciones
    if (config.format === 'dd/mm/yyyy') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      let formattedDate = `${day}/${month}/${year}`;
      
      if (config.time) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        formattedDate += ` ${hours}:${minutes}`;
      }
      
      return formattedDate;
    }
    else if (config.format === 'dd/mm/yy') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString().slice(-2);
      
      let formattedDate = `${day}/${month}/${year}`;
      
      if (config.time) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        formattedDate += ` ${hours}:${minutes}`;
      }
      
      return formattedDate;
    }
    else if (config.format === 'full') {
      return date.toLocaleDateString(config.locale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...(config.time && {
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    }
    else if (config.format === 'time') {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // Por defecto: formato completo en español
    return date.toLocaleDateString(config.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(config.time && {
        hour: '2-digit',
        minute: '2-digit'
      })
    });

  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
};

// Función específica para tiempo relativo (hace x tiempo)
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return formatDate(dateString, { format: 'dd/mm/yy' });
  } catch (error) {
    return formatDate(dateString);
  }
};