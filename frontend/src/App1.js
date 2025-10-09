import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminPanel from './admin/AdminPanel';
import axiosInstance from './axios'; // withCredentials: true

export default function App() {
  return React.createElement(Router, null,
    React.createElement(Routes, null,
      React.createElement(Route, { path: "/login", element: React.createElement(Login, null) }),
      React.createElement(Route, { path: "/admin", element: React.createElement(ProtectedRoute, null) }),
      React.createElement(Route, { path: "/admin/dashboard", element: React.createElement(ProtectedRoute, null) }),
      React.createElement(Route, { path: "/dashboard", element: React.createElement(ProtectedRoute, null) }),
      React.createElement(Route, { path: "/", element: React.createElement(Navigate, { to: "/login" }) })
    )
  );
}

function ProtectedRoute() {
  const [isAuth, setIsAuth] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [role, setRole] = React.useState('');

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Таны хуучин backend API endpoint ашиглах
        const res = await axiosInstance.get('/auth/me'); // эсвэл /me, /user гэх мэт
        setIsAuth(true);
        setRole(res.data.role);
        
        if (res.data.role !== 'system_admin') {
          window.location.href = '/login';
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuth(false);
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return React.createElement('div', { 
      className: 'flex items-center justify-center min-h-screen bg-gray-100' 
    }, 
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { 
          className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4' 
        }),
        React.createElement('p', { className: 'text-gray-600' }, 'Ачааллаж байна...')
      )
    );
  }

  return isAuth && role === 'system_admin' ? 
    React.createElement(AdminPanel, null) : 
    React.createElement('div', null, 'Нэвтрэх эрх шалгаж байна...');
}