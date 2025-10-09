import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaBoxOpen,
  FaUsers,
  FaChartLine,
  FaCalendarAlt,
  FaSearch,
  FaFilter,
  FaEye
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axios';
import '../styles/admin.css';
import '../styles/custom.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ 
    newCargo: 0, 
    distribution: 0, 
    totalUsers: 0,
    activeOrders: 0
  });
  const [recentCargos, setRecentCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await axiosInstance.get('/api/dashboard/stats');
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      const cargoRes = await axiosInstance.get('/api/cargo-new?page=1&page_size=10');
      if (cargoRes.data.success) {
        setRecentCargos(cargoRes.data.data || []);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'registered': { class: 'badge-success', text: 'Бүртгэгдсэн' },
      'shipped': { class: 'badge-primary', text: 'Хөдөлж байгаа' },
      'arrived': { class: 'badge-info', text: 'Ирсэн' },
      'delivered': { class: 'badge-secondary', text: 'Хүргэгдсэн' }
    };
    const statusInfo = statusMap[status] || { class: 'badge-primary', text: status };
    return <span className={`badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const filteredCargo = recentCargos.filter(cargo => {
    const matchesSearch = cargo.cargo_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || cargo.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
              Хянах самбар
            </h1>
            <p className="text-sm text-gray-600">
              Карго ложистикийн удирдлагын систем
            </p>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-500 bg-white px-3 py-2 rounded-lg shadow">
            <FaCalendarAlt className="mr-2" />
            {new Date().toLocaleDateString('mn-MN', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <div className="custom-card blue-card cursor-pointer" onClick={() => navigate('/admin/cargo')}>
          <div className="flex items-center w-full">
            <div className="stat-icon bg-blue-500">
              <FaTruck className="text-lg" />
            </div>
            <div className="ml-4 flex-1">
              <p className="stat-label text-sm">Шинэ ачаа</p>
              <p className="stat-value text-2xl md:text-3xl font-bold">
                {loading ? '...' : stats.newCargo}
              </p>
              <p className="stat-desc text-xs mt-1">Өнөөдөр бүртгэгдсэн</p>
            </div>
          </div>
        </div>

        <div className="custom-card green-card cursor-pointer" onClick={() => navigate('/admin/containers')}>
          <div className="flex items-center w-full">
            <div className="stat-icon bg-green-500">
              <FaBoxOpen className="text-lg" />
            </div>
            <div className="ml-4 flex-1">
              <p className="stat-label text-sm">Нээлттэй чингэлэг</p>
              <p className="stat-value text-2xl md:text-3xl font-bold">
                {loading ? '...' : stats.distribution}
              </p>
              <p className="stat-desc text-xs mt-1">Бүртгэлд нээлттэй</p>
            </div>
          </div>
        </div>

        <div className="custom-card purple-card cursor-pointer" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center w-full">
            <div className="stat-icon bg-purple-500">
              <FaUsers className="text-lg" />
            </div>
            <div className="ml-4 flex-1">
              <p className="stat-label text-sm">Нийт хэрэглэгч</p>
              <p className="stat-value text-2xl md:text-3xl font-bold">
                {loading ? '...' : stats.totalUsers}
              </p>
              <p className="stat-desc text-xs mt-1">Идэвхтэй</p>
            </div>
          </div>
        </div>

        <div className="custom-card bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-800 border-indigo-200 cursor-pointer">
          <div className="flex items-center w-full">
            <div className="stat-icon bg-indigo-500">
              <FaChartLine className="text-lg" />
            </div>
            <div className="ml-4 flex-1">
              <p className="stat-label text-sm">Идэвхтэй ачаа</p>
              <p className="stat-value text-2xl md:text-3xl font-bold">
                {loading ? '...' : stats.activeOrders}
              </p>
              <p className="stat-desc text-xs mt-1">Хүргэлтэнд</p>
            </div>
          </div>
        </div>
      </div>

      <div className="table-container bg-white rounded-lg shadow-lg">
        <div className="table-header px-4 py-4 border-b">
          <h2 className="table-title text-lg md:text-xl">Сүүлийн ачаануудын жагсаалт</h2>
        </div>

        <div className="filters-section p-4 bg-gray-50 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Ачааны код, илгээгч, хүлээн авагчаар хайх..."
                className="filter-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-48">
              <FaFilter className="search-icon" />
              <select
                className="filter-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Бүх төлөв</option>
                <option value="registered">Бүртгэгдсэн</option>
                <option value="shipped">Хөдөлж байгаа</option>
                <option value="arrived">Ирсэн</option>
                <option value="delivered">Хүргэгдсэн</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left">Код</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Илгээгч</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Хүлээн авагч</th>
                <th className="px-4 py-3 text-left">Төлөв</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Жин/Эзлэхүүн</th>
                <th className="px-4 py-3 text-left">Үнэ</th>
                <th className="px-4 py-3 text-left hidden xl:table-cell">Огноо</th>
                <th className="px-4 py-3 text-center">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-2 text-gray-500">Ачааллаж байна...</p>
                  </td>
                </tr>
              ) : filteredCargo.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    Ачаа олдсонгүй
                  </td>
                </tr>
              ) : (
                filteredCargo.map((cargo) => (
                  <tr key={cargo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs sm:text-sm">
                      {cargo.cargo_code}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-sm">
                      {cargo.sender_name}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm">
                      {cargo.receiver_name}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(cargo.status)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm">
                      {cargo.cargo_type === 'weight' 
                        ? `${cargo.weight_kg} кг`
                        : `${(parseFloat(cargo.volume_cbm) || 0).toFixed(4)} м³`
                      }
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600 text-sm">
                      {parseFloat(cargo.price).toLocaleString()}₩
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-500">
                      {new Date(cargo.registered_date).toLocaleDateString('mn-MN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        className="icon-button text-blue-600"
                        title="Дэлгэрэнгүй"
                        onClick={() => navigate('/admin/cargo')}
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer px-4 py-3 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-sm text-gray-600">
              Нийт {filteredCargo.length} ачаа харуулж байна
            </span>
            <button 
              className="custom-button text-sm"
              onClick={() => navigate('/admin/cargo')}
            >
              Бүх ачааг харах
            </button>
          </div>
        </div>
      </div>
    </>
  );
}