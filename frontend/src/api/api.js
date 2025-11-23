import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}`,
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      // Lógica para manejar token expirado
      const { logout } = useAuth();
      logout();
    }
    return Promise.reject(error);
  }
);

export default api;