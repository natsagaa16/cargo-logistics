//frontend/src/components/Footer.js
import React from 'react';
import '../styles/admin.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <div className="footer-compact">
        <p className="footer-text">
          
          © {currentYear} Карго админ. Бүх эрх хуулиар хамгаалагдсан.
        </p>
      </div>
    </footer>
  );
};

export default Footer;