import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, FaBox, FaCalculator, FaList, FaUsers, 
  FaFileInvoice, FaSms, FaCog, FaExchangeAlt, FaTruck, 
  FaChartBar, FaBoxOpen
} from 'react-icons/fa';
import '../styles/admin.css';

export default function Sidebar({ isOpen }) {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname.includes(path);
  };
  
  return (
    <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          <li>
            <Link 
              to="/admin/dashboard" 
              className={`sidebar-item ${isActive('dashboard') ? 'active' : ''}`}
            >
              <FaHome className="sidebar-icon" />
              <span className="sidebar-text">Дашбоард</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/containers" 
              className={`sidebar-item ${isActive('containers') ? 'active' : ''}`}
            >
              <FaTruck className="sidebar-icon" />
              <span className="sidebar-text">Чингэлэг удирдлага</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/cargo" 
              className={`sidebar-item ${isActive('cargo') ? 'active' : ''}`}
            >
              <FaBoxOpen className="sidebar-icon" />
              <span className="sidebar-text">Ачаа удирдлага</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/payment" 
              className={`sidebar-item ${isActive('payment') ? 'active' : ''}`}
            >
              <FaCalculator className="sidebar-icon" />
              <span className="sidebar-text">Тооцоо & Төлбөр</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/categories" 
              className={`sidebar-item ${isActive('categories') ? 'active' : ''}`}
            >
              <FaList className="sidebar-icon" />
              <span className="sidebar-text">Ангилал удирдлага</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/reports" 
              className={`sidebar-item ${isActive('reports') ? 'active' : ''}`}
            >
              <FaChartBar className="sidebar-icon" />
              <span className="sidebar-text">Тайлан</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/users" 
              className={`sidebar-item ${isActive('users') ? 'active' : ''}`}
            >
              <FaUsers className="sidebar-icon" />
              <span className="sidebar-text">Хэрэглэгч удирдлага</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/documents" 
              className={`sidebar-item ${isActive('documents') ? 'active' : ''}`}
            >
              <FaFileInvoice className="sidebar-icon" />
              <span className="sidebar-text">Баримт удирдлага</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/sms" 
              className={`sidebar-item ${isActive('sms') ? 'active' : ''}`}
            >
              <FaSms className="sidebar-icon" />
              <span className="sidebar-text">SMS удирдлага</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/settings" 
              className={`sidebar-item ${isActive('settings') ? 'active' : ''}`}
            >
              <FaCog className="sidebar-icon" />
              <span className="sidebar-text">Тохиргоо</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/exchange" 
              className={`sidebar-item ${isActive('exchange') ? 'active' : ''}`}
            >
              <FaExchangeAlt className="sidebar-icon" />
              <span className="sidebar-text">Найман шарга</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}