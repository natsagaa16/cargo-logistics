import React, { useState, useEffect } from 'react';
import { FaBars, FaUser, FaSignOutAlt, FaBell, FaChevronDown, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../axios';
import '../styles/admin.css';

const Header = ({ toggleSidebar }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState({ username: 'Admin', role: 'system_admin' });
  const navigate = useNavigate();

  useEffect(() => {
    // User мэдээлэл авах
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Parse user data error:', e);
      }
    }
  }, []);

  // Click outside эвент
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/logout');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  // Mock notifications
  const notifications = [
    { id: 1, message: "Шинэ ачаа бүртгэгдлээ", time: "5 минутын өмнө", unread: true },
    { id: 2, message: "Чингэлэг хөдөлсөн", time: "1 цагийн өмнө", unread: true },
    { id: 3, message: "Төлбөр баталгаажлаа", time: "2 цагийн өмнө", unread: false }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="admin-topbar">
      <div className="w-full flex items-center justify-between">
        
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={toggleSidebar}
            className="hamburger"
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>
          
          
          <div className="topbar-brand flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="topbar-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <h1 className="brand-text">
              <span className="hidden sm:inline">Жим Гүн Трэйд ХХК</span>
              <span className="sm:hidden">ЖГТ</span>
            </h1>
          </div>
        </div>

        
        <div className="flex items-center space-x-2 sm:space-x-4">
          
          {/* Notifications Dropdown */}
          <div className="dropdown-container relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="notification-btn"
              aria-label="Мэдэгдэл"
            >
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h3 className="notification-title">
                    Мэдэгдэл ({unreadCount} шинэ)
                  </h3>
                </div>
                <div className="notification-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.unread ? 'bg-blue-50' : ''}`}
                    >
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {notification.time}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notification-footer">
                  <button className="notification-see-all">
                    Бүгдийг харах
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div className="dropdown-container relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="profile-btn"
            >
              <div className="profile-avatar">
                <FaUser className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <span className="profile-name">
                {user.username || 'Admin'}
              </span>
              <FaChevronDown className={`profile-arrow ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="profile-dropdown">
                {/* User Info Header */}
                <div className="profile-dropdown-header">
                  <div className="profile-avatar-large">
                    <FaUser className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="profile-dropdown-name">{user.username || 'Admin'}</div>
                    <div className="profile-dropdown-email">
                      {user.role === 'system_admin' ? 'Систем админ' : 'Ажилтан'}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="profile-dropdown-menu">
                  <button 
                    className="profile-dropdown-item"
                    onClick={() => navigate('/admin/settings')}
                  >
                    <FaCog className="w-4 h-4" />
                    Тохиргоо
                  </button>
                  
                  <hr className="profile-dropdown-divider" />
                  
                  <button
                    onClick={handleLogout}
                    className="profile-dropdown-item text-red-600 hover:bg-red-50"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    Гарах
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;