import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './admin/Dashboard';
import ContainerManagement from './admin/ContainerManagement';
import CargoManagement from './admin/CargoManagement';
import CategoryManagement from './admin/CategoryManagement';
import PaymentManagement from './admin/PaymentManagement';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar1';
import Footer from './components/Footer';
import './styles/admin.css';
import './styles/custom.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/admin" element={<ProtectedAdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="containers" element={<ContainerManagement />} />
          <Route path="cargo" element={<CargoManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          
      
          <Route path="payment" element={<PaymentManagement />} />
          
          <Route path="reports" element={<ComingSoon title="Тайлан" />} />
          <Route path="users" element={<ComingSoon title="Хэрэглэгч удирдлага" />} />
          <Route path="documents" element={<ComingSoon title="Баримт удирдлага" />} />
          <Route path="sms" element={<ComingSoon title="SMS удирдлага" />} />
          <Route path="settings" element={<ComingSoon title="Тохиргоо" />} />
          <Route path="exchange" element={<ComingSoon title="Найман шарга" />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

function ProtectedAdminLayout() {
  const [isAuth, setIsAuth] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [role, setRole] = React.useState('');
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axiosInstance.get('/auth/me');
        setIsAuth(true);
        setRole(res.data.role);
        
        if (!['system_admin', 'staff'].includes(res.data.role)) {
          navigate('/login');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ачааллаж байна...</p>
        </div>
      </div>
    );
  }

  if (!isAuth || !['system_admin', 'staff'].includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-layout">
      <TopBar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="admin-container">
        <Sidebar isOpen={sidebarOpen} />
        <div className="admin-main">
          <Outlet />
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">Энэ хуудас хөгжүүлэгдэж байна...</p>
        <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
       
        </div>
      </div>
    </div>
  );
}