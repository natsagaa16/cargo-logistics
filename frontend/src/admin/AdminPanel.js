//frontend/src/admin/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaBoxOpen,
  FaUsers,
  FaChartLine,
  FaCalendarAlt,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import axiosInstance from '../axios'; 
import '../styles/admin.css';
import '../styles/custom.css';

export default function AdminPanel() {
  const [stats, setStats] = useState({ 
    newCargo: 10, 
    distribution: 5, 
    totalUsers: 156,
    activeOrders: 23
  });
  const [cargoList, setCargoList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    
    setCargoList([
      { id: 1, kod: 'SU250918-001', status: 'registered', weight: 10, fee: 5000, date: '2025-09-18', destination: 'Улаанбаатар' },
      { id: 2, kod: 'EXP250918-002', status: 'shipped', weight: 20, fee: 10000, date: '2025-09-18', destination: 'Дархан' },
      { id: 3, kod: 'IMP250918-003', status: 'delivered', weight: 15, fee: 7500, date: '2025-09-17', destination: 'Эрдэнэт' },
      { id: 4, kod: 'SU250918-004', status: 'pending', weight: 8, fee: 4000, date: '2025-09-16', destination: 'Чойбалсан' },
      { id: 5, kod: 'EXP250918-005', status: 'registered', weight: 25, fee: 12500, date: '2025-09-15', destination: 'Ховд' },
    ]);
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      'registered': { class: 'badge-primary', text: 'Бүртгэгдсэн' },
      'shipped': { class: 'badge-warning', text: 'Ачигдсан' },
      'delivered': { class: 'badge-success', text: 'Хүргэгдсэн' },
      'pending': { class: 'badge-danger', text: 'Хүлээгдэж байна' }
    };
    const statusInfo = statusMap[status] || { class: 'badge-primary', text: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const filteredCargo = cargoList.filter(cargo => {
    const matchesSearch = cargo.kod.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cargo.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Хянах самбар</h1>
            <p className="text-sm text-gray-600">Карго ложистикийн удирдлагын систем</p>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <FaCalendarAlt className="mr-1" />
            {new Date().toLocaleDateString('mn-MN')}
          </div>
        </div>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="stats-grid mb-6">
        <div className="custom-card blue-card">
          <div className="flex items-center">
            <div className="stat-icon bg-blue-500">
              <FaTruck className="text-lg" />
            </div>
            <div className="ml-3">
              <p className="stat-label">Шинэ Ачаа</p>
              <p className="stat-value">{stats.newCargo}</p>
              <p className="stat-desc">+5% өнгөрсөн сараас</p>
            </div>
          </div>
        </div>

        <div className="custom-card green-card">
          <div className="flex items-center">
            <div className="stat-icon bg-green-500">
              <FaBoxOpen className="text-lg" />
            </div>
            <div className="ml-3">
              <p className="stat-label">Ачаа Тараалт</p>
              <p className="stat-value">{stats.distribution}</p>
              <p className="stat-desc">Өнөөдөр</p>
            </div>
          </div>
        </div>

        <div className="custom-card purple-card">
          <div className="flex items-center">
            <div className="stat-icon bg-purple-500">
              <FaUsers className="text-lg" />
            </div>
            <div className="ml-3">
              <p className="stat-label">Нийт Хэрэглэгч</p>
              <p className="stat-value">{stats.totalUsers}</p>
              <p className="stat-desc">Идэвхтэй</p>
            </div>
          </div>
        </div>

        <div className="custom-card bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-200">
          <div className="flex items-center">
            <div className="stat-icon bg-indigo-500">
              <FaChartLine className="text-lg" />
            </div>
            <div className="ml-3">
              <p className="stat-label">Идэвхтэй Захиалга</p>
              <p className="stat-value">{stats.activeOrders}</p>
              <p className="stat-desc">Боловсруулж байна</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Table Section */}
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Ачааны Жагсаалт</h2>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Код эсвэл очих газраар хайх..."
                className="filter-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative sm:w-48">
              <FaFilter className="search-icon" />
              <select
                className="filter-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Бүх статус</option>
                <option value="registered">Бүртгэгдсэн</option>
                <option value="shipped">Ачигдсан</option>
                <option value="delivered">Хүргэгдсэн</option>
                <option value="pending">Хүлээгдэж байна</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Код</th>
                <th>Статус</th>
                <th className="hidden sm:table-cell">Жин</th>
                <th>Хөлс</th>
                <th className="hidden md:table-cell">Очих газар</th>
                <th className="hidden lg:table-cell">Огноо</th>
              </tr>
            </thead>
            <tbody>
              {filteredCargo.map((cargo) => (
                <tr key={cargo.id}>
                  <td className="font-medium">#{cargo.id}</td>
                  <td className="font-mono text-xs">{cargo.kod}</td>
                  <td>{getStatusBadge(cargo.status)}</td>
                  <td className="hidden sm:table-cell">{cargo.weight}кг</td>
                  <td className="font-semibold text-sm">{cargo.fee.toLocaleString()}₮</td>
                  <td className="hidden md:table-cell text-sm">{cargo.destination}</td>
                  <td className="hidden lg:table-cell text-xs text-gray-500">{cargo.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-footer">
          <span className="text-sm text-gray-600">
            Нийт {filteredCargo.length} ачаа
          </span>
        </div>
      </div>
    </>
  );
};