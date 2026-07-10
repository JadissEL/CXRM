import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('client' | 'barber' | 'admin')[];
  fallbackPath?: string;
}

// Fonction pour décoder le token JWT
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur lors du décodage du token:', error);
    return null;
  }
};

// Vérifier si le token est expiré
const isTokenExpired = (decodedToken: any): boolean => {
  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['client', 'barber', 'admin'],
  fallbackPath = '/login'
}) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('Aucun token trouvé, redirection vers:', fallbackPath);
    return <Navigate to={fallbackPath} replace />;
  }

  const decodedToken = decodeToken(token);
  
  if (!decodedToken) {
    console.log('Token invalide, redirection vers:', fallbackPath);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    return <Navigate to={fallbackPath} replace />;
  }

  if (isTokenExpired(decodedToken)) {
    console.log('Token expiré, redirection vers:', fallbackPath);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    return <Navigate to={fallbackPath} replace />;
  }

  const userRole = decodedToken.role;
  
  if (!allowedRoles.includes(userRole)) {
    console.log(`Rôle ${userRole} non autorisé. Rôles autorisés:`, allowedRoles);
    // Rediriger vers le dashboard approprié selon le rôle
    switch (userRole) {
      case 'client':
        return <Navigate to="/client-dashboard" replace />;
      case 'barber':
        return <Navigate to="/barber-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  console.log(`Accès autorisé pour le rôle: ${userRole}`);
  return <>{children}</>;
}; 