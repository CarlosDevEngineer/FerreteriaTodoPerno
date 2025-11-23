import { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    isAuthenticated: false // ← Agrega esta propiedad
  });

  // Verificar autenticación al iniciar
  useEffect(() => {
    const verifyAuth = () => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (user && token) {
        setAuthState({
          user: JSON.parse(user),
          loading: false,
          isAuthenticated: true // ← Establece como autenticado
        });
      } else {
        setAuthState({ 
          user: null, 
          loading: false, 
          isAuthenticated: false // ← No autenticado
        });
      }
    };
    
    verifyAuth();
  }, []);

  const login = async (username, password) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Credenciales incorrectas');
      }

      const { token, usuario } = await response.json();
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      setAuthState({
        user: usuario,
        loading: false,
        isAuthenticated: true // ← Marcar como autenticado
      });
      
      return true;
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loading: false,
        isAuthenticated: false 
      }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({ 
      user: null, 
      loading: false, 
      isAuthenticated: false 
    });
  };

  return (
    <AuthContext.Provider value={{
      user: authState.user,
      loading: authState.loading,
      isAuthenticated: authState.isAuthenticated, // ← Exporta esta propiedad
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);