import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, FaCalendarAlt, FaBoxOpen, FaSearch, 
  FaPlus, FaTimes, FaCheckCircle, FaCreditCard, 
  FaReceipt, FaChartLine, FaExchangeAlt, FaCheck, FaSave,
  FaEye, FaBarcode
} from 'react-icons/fa';
import axiosInstance from '../axios';
import '../styles/admin.css';
import '../styles/custom.css';

const PaymentManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingCargos, setPendingCargos] = useState([]);
  const [distributedCargos, setDistributedCargos] = useState([]);
  const [revenueRecords, setRevenueRecords] = useState([]);
  const [expenseRecords, setExpenseRecords] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ revenue: 0, expense: 0, net: 0 });
  
  const [filters, setFilters] = useState({
    container_id: 'all',
    search: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [detailCargo, setDetailCargo] = useState(null);
  
  const [paymentForm, setPaymentForm] = useState({
    method: 'cash',
    receiver_phone: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    container_id: '',
    amount: '',
    currency_code: 'KRW',
    payment_method: 'cash',
    description: ''
  });

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    console.log('🔄 Active tab changed:', activeTab);
    console.log('🔍 Filters:', filters);
    fetchData();
  }, [activeTab, filters]);

  useEffect(() => {
    calculateStats();
  }, [filters.start_date, filters.end_date]);

  const fetchContainers = async () => {
    try {
      console.log('📦 Fetching containers...');
      const response = await axiosInstance.get('/api/containers-new/available');
      if (response.data.success) {
        console.log('✅ Containers loaded:', response.data.data?.length);
        setContainers(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Containers fetch error:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        await fetchPendingCargos();
      } else if (activeTab === 'distributed') {
        await fetchDistributedCargos();
      } else if (activeTab === 'revenue') {
        await fetchRevenueRecords();
      } else if (activeTab === 'expense') {
        await fetchExpenseRecords();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCargos = async () => {
    try {
      console.log('🔄 Fetching pending cargos...', filters);
      const params = new URLSearchParams({
        container_id: filters.container_id,
        search: filters.search
      });
      console.log('📡 API URL:', `/api/cargo-new/pending?${params}`);
      const response = await axiosInstance.get(`/api/cargo-new/pending?${params}`);
      console.log('✅ Response:', response.data);
      if (response.data.success) {
        console.log('📦 Pending cargos:', response.data.data);
        setPendingCargos(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Pending cargos error:', error);
      console.error('❌ Error details:', error.response?.data);
      setPendingCargos([]);
    }
  };

  const fetchDistributedCargos = async () => {
    try {
      console.log('🔄 Fetching distributed cargos...');
      const params = new URLSearchParams({
        container_id: filters.container_id,
        search: filters.search,
        status: 'distributed'
      });
      const response = await axiosInstance.get(`/api/cargo-new?${params}`);
      console.log('✅ Distributed cargos:', response.data.data?.length);
      if (response.data.success) setDistributedCargos(response.data.data || []);
    } catch (error) {
      console.error('❌ Distributed cargos error:', error);
      setDistributedCargos([]);
    }
  };

  const fetchRevenueRecords = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        payment_type: 'revenue',
        payment_method: 'all',
        container_id: filters.container_id
      });
      const response = await axiosInstance.get(`/api/payment/records?${params}`);
      if (response.data.success) setRevenueRecords(response.data.data || []);
    } catch (error) {
      console.error('Revenue records error:', error);
      setRevenueRecords([]);
    }
  };

  const fetchExpenseRecords = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date,
        payment_type: 'expense',
        payment_method: 'all',
        container_id: filters.container_id
      });
      const response = await axiosInstance.get(`/api/payment/records?${params}`);
      if (response.data.success) setExpenseRecords(response.data.data || []);
    } catch (error) {
      console.error('Expense records error:', error);
      setExpenseRecords([]);
    }
  };

  const calculateStats = async () => {
    try {
      const params = new URLSearchParams({
        start_date: filters.start_date,
        end_date: filters.end_date
      });
      const response = await axiosInstance.get(`/api/payment/stats?${params}`);
      if (response.data.success) {
        setStats({
          revenue: response.data.stats.total_revenue || 0,
          expense: response.data.stats.total_expense || 0,
          net: response.data.stats.net_income || 0
        });
      }
    } catch (error) {
      console.error('Stats error:', error);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCargo) return;
    try {
      const response = await axiosInstance.patch(
        `/api/cargo-new/${selectedCargo.id}/distribute`,
        {
          payment_method: paymentForm.method,
          receiver_phone_verified: paymentForm.receiver_phone || selectedCargo.receiver_phone
        }
      );
      if (response.data.success) {
        alert('✅ Орлого амжилттай бүртгэгдлээ!');
        setShowPaymentModal(false);
        setSelectedCargo(null);
        setPaymentForm({ method: 'cash', receiver_phone: '' });
        fetchData();
        calculateStats();
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error.response?.data?.msg || 'Орлого бүртгэхэд алдаа гарлаа');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      alert('Дүн зөв оруулна уу');
      return;
    }
    if (!expenseForm.description || !expenseForm.description.trim()) {
      alert('Тайлбар оруулна уу');
      return;
    }
    try {
      const response = await axiosInstance.post('/api/payment/expense', {
        container_id: expenseForm.container_id || null,
        amount: parseFloat(expenseForm.amount),
        currency_code: expenseForm.currency_code,
        payment_method: expenseForm.payment_method,
        description: expenseForm.description
      });
      if (response.data.success) {
        alert('✅ Зарлага амжилттай бүртгэгдлээ!');
        setShowExpenseModal(false);
        setExpenseForm({
          container_id: '',
          amount: '',
          currency_code: 'KRW',
          payment_method: 'cash',
          description: ''
        });
        fetchData();
        calculateStats();
      }
    } catch (error) {
      console.error('Expense error:', error);
      alert(error.response?.data?.msg || 'Зарлага бүртгэхэд алдаа гарлаа');
    }
  };

  const openPaymentModal = (cargo) => {
    setSelectedCargo(cargo);
    setPaymentForm({ method: 'cash', receiver_phone: cargo.receiver_phone || '' });
    setShowPaymentModal(true);
  };

  const openDetailModal = async (cargo) => {
    console.log('👁️ Opening detail modal for:', cargo);
    try {
      const response = await axiosInstance.get(`/api/cargo-new/${cargo.id}`);
      if (response.data.success) {
        console.log('✅ Cargo detail:', response.data.data);
        setDetailCargo(response.data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('❌ Detail fetch error:', error);
      alert('Дэлгэрэнгүй мэдээлэл авахад алдаа гарлаа');
    }
  };

  const formatCurrency = (amount, currency = 'KRW') => {
    if (!amount) return `0${currency}`;
    return `${parseFloat(amount).toLocaleString()}${currency}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('mn-MN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getPaymentMethodBadge = (method) => {
    if (method === 'cash') {
      return <span className="badge badge-success"><FaMoneyBillWave className="mr-1" /> Бэлэн</span>;
    }
    return <span className="badge badge-info"><FaExchangeAlt className="mr-1" /> Шилжүүлэг</span>;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'registered': { class: 'badge-success', text: 'Бүртгэгдсэн' },
      'shipped': { class: 'badge-primary', text: 'Хөдөлж байгаа' },
      'arrived': { class: 'badge-info', text: 'Ирсэн' },
      'delivered': { class: 'badge-secondary', text: 'Хүргэгдсэн' },
      'pending_distribution': { class: 'badge-warning', text: 'Тараагдаагүй' },
      'distributed': { class: 'badge-info', text: 'Тараагдсан' },
      'on_hold': { class: 'badge-danger', text: 'Саатсан' },
      'customs_processing': { class: 'badge-primary', text: 'Гааль дээр' }
    };
    const info = statusMap[status] || { class: 'badge-primary', text: status };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  const calculateTotals = (records, type) => {
    if (type === 'pending') {
      const totalCargo = records.reduce((sum, r) => sum + parseFloat(r.cargo_price || 0), 0);
      const totalStorage = records.reduce((sum, r) => sum + parseFloat(r.storage_fee || 0), 0);
      const grandTotal = totalCargo + totalStorage;
      return { totalCargo, totalStorage, grandTotal };
    } else if (type === 'revenue') {
      const totalCargo = records.reduce((sum, r) => sum + parseFloat(r.cargo_price || 0), 0);
      const totalStorage = records.reduce((sum, r) => sum + parseFloat(r.storage_fee || 0), 0);
      const grandTotal = records.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
      return { totalCargo, totalStorage, grandTotal };
    } else if (type === 'expense') {
      const grandTotal = records.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
      return { grandTotal };
    } else if (type === 'distributed') {
      const totalPrice = records.reduce((sum, r) => sum + parseFloat(r.price || 0), 0);
      return { totalPrice };
    }
    return {};
  };

  return (
    <div className="category-management p-4 md:p-6">
      <div className="page-header mb-6">
        <h1 className="text-2xl font-bold">Төлбөр тооцоо</h1>
        <p className="text-gray-600">Орлого, зарлага, төлбөрийн бүртгэл удирдлага</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border-2 border-green-200 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <FaChartLine className="text-green-600 text-2xl" />
            <span className="badge badge-success">ОРЛОГО</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</div>
          <div className="text-sm text-gray-600 mt-1">Нийт орлого</div>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <FaReceipt className="text-red-600 text-2xl" />
            <span className="badge badge-danger">ЗАРЛАГА</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.expense)}</div>
          <div className="text-sm text-gray-600 mt-1">Нийт зарлага</div>
        </div>

        <div className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow">
          <div className="flex items-center justify-between mb-2">
            <FaMoneyBillWave className="text-blue-600 text-2xl" />
            <span className="badge badge-primary">ЦЭВЭР</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.net)}</div>
          <div className="text-sm text-gray-600 mt-1">Цэвэр орлого</div>
        </div>
      </div>

      <div className="tabs-container mb-6">
        <div className="overflow-x-auto">
          <div className="flex space-x-1 border-b whitespace-nowrap">
            <button
              className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <FaBoxOpen className="mr-2" />
              Тараагдаагүй ({pendingCargos.length})
            </button>

            <button
              className={`tab-button ${activeTab === 'distributed' ? 'active' : ''}`}
              onClick={() => setActiveTab('distributed')}
            >
              <FaCheck className="mr-2" />
              Тараагдсан ({distributedCargos.length})
            </button>

            <button
              className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
              onClick={() => setActiveTab('revenue')}
            >
              <FaChartLine className="mr-2" />
              Орлого ({revenueRecords.length})
            </button>

            <button
              className={`tab-button ${activeTab === 'expense' ? 'active' : ''}`}
              onClick={() => setActiveTab('expense')}
            >
              <FaReceipt className="mr-2" />
              Зарлага ({expenseRecords.length})
            </button>
          </div>
        </div>
      </div>

      <div className="tab-content bg-white rounded-lg shadow p-4 md:p-6">
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {(activeTab === 'revenue' || activeTab === 'expense') && (
              <>
                <div className="form-group">
                  <label>Эхлэх огноо</label>
                  <input
                    type="date"
                    className="custom-input w-full"
                    value={filters.start_date}
                    onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Дуусах огноо</label>
                  <input
                    type="date"
                    className="custom-input w-full"
                    value={filters.end_date}
                    onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                  />
                </div>
              </>
            )}

            {(activeTab === 'pending' || activeTab === 'distributed' || activeTab === 'expense' || activeTab === 'revenue') && (
              <div className="form-group">
                <label>Чингэлэг</label>
                <select
                  className="custom-input w-full"
                  value={filters.container_id}
                  onChange={(e) => setFilters({...filters, container_id: e.target.value})}
                >
                  <option value="all">Бүх чингэлэг</option>
                  {containers.map(c => (
                    <option key={c.id} value={c.id}>{c.container_code}</option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'pending' || activeTab === 'distributed') && (
              <div className="form-group">
                <label>Хайлт</label>
                <input
                  type="text"
                  placeholder="Хайх..."
                  className="custom-input w-full"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
            )}

            {activeTab === 'expense' && (
              <div className="flex items-end">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="custom-button w-full"
                >
                  <FaPlus className="mr-2" /> Зарлага бүртгэх
                </button>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'pending' && (
              <>
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Багц</th>
                      <th>Илгээгч</th>
                      <th>Хүлээн авагч</th>
                      <th>Үнэ</th>
                      <th>Хадгалалт</th>
                      <th>Нийт</th>
                      <th>Төлөв</th>
                      <th>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCargos.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-8 text-gray-600">Тараагдаагүй ачаа байхгүй</td>
                      </tr>
                    ) : (
                      pendingCargos.map((cargo) => (
                        <tr key={cargo.id}>
                          <td><span className="badge badge-primary font-mono">{cargo.batch_number}</span></td>
                          <td className="whitespace-normal break-words">
                            <div>{cargo.sender_name}</div>
                            {cargo.sender_phone && <div className="text-xs text-gray-500">{cargo.sender_phone}</div>}
                          </td>
                          <td className="whitespace-normal break-words">
                            <div>{cargo.receiver_name}</div>
                            {cargo.receiver_phone && <div className="text-xs text-gray-500">{cargo.receiver_phone}</div>}
                          </td>
                          <td className="whitespace-nowrap font-semibold">{formatCurrency(cargo.cargo_price, cargo.currency_code)}</td>
                          <td className="whitespace-nowrap text-orange-600 font-semibold">{formatCurrency(cargo.storage_fee, cargo.currency_code)}</td>
                          <td className="whitespace-nowrap font-bold text-green-600">{formatCurrency(cargo.total_amount, cargo.currency_code)}</td>
                          <td className="whitespace-nowrap">{getStatusBadge(cargo.status)}</td>
                          <td className="whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openDetailModal(cargo)}
                                className="icon-button text-blue-600"
                                title="Дэлгэрэнгүй харах"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => openPaymentModal(cargo)}
                                className="icon-button text-green-600"
                                title="Орлого бүртгэх"
                              >
                                <FaCheckCircle />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {pendingCargos.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="3" className="text-right">НИЙТ ДҮН:</td>
                        <td className="text-green-600">{formatCurrency(calculateTotals(pendingCargos, 'pending').totalCargo)}</td>
                        <td className="text-orange-600">{formatCurrency(calculateTotals(pendingCargos, 'pending').totalStorage)}</td>
                        <td className="text-blue-600 text-lg">{formatCurrency(calculateTotals(pendingCargos, 'pending').grandTotal)}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}

            {activeTab === 'distributed' && (
              <>
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Багц</th>
                      <th>Илгээгч</th>
                      <th>Хүлээн авагч</th>
                      <th>Чингэлэг</th>
                      <th>Үнэ</th>
                      <th>Төлөв</th>
                      <th>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {distributedCargos.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-600">Тараагдсан ачаа байхгүй</td>
                      </tr>
                    ) : (
                      distributedCargos.map((cargo) => (
                        <tr key={cargo.id}>
                          <td><span className="badge badge-primary font-mono">{cargo.cargo_code}</span></td>
                          <td className="whitespace-normal break-words">{cargo.sender_name}</td>
                          <td className="whitespace-normal break-words">{cargo.receiver_name}</td>
                          <td className="whitespace-normal break-words">{cargo.container_code}</td>
                          <td className="whitespace-nowrap font-semibold">{formatCurrency(cargo.price, cargo.price_currency_code)}</td>
                          <td><span className="badge badge-success">Тараагдсан</span></td>
                          <td className="whitespace-nowrap">
                            <button
                              onClick={() => openDetailModal(cargo)}
                              className="icon-button text-blue-600"
                              title="Дэлгэрэнгүй харах"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {distributedCargos.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="4" className="text-right">НИЙТ ДҮН:</td>
                        <td className="text-green-600 text-lg">{formatCurrency(calculateTotals(distributedCargos, 'distributed').totalPrice)}</td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}

            {activeTab === 'revenue' && (
              <>
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Огноо</th>
                      <th>Багц</th>
                      <th>Хүлээн авагч</th>
                      <th>Ачааны үнэ</th>
                      <th>Хадгалалт</th>
                      <th>Нийт</th>
                      <th>Төлбөр</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-gray-600">Орлого байхгүй</td>
                      </tr>
                    ) : (
                      revenueRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="whitespace-nowrap">{formatDate(record.payment_date)}</td>
                          <td><span className="badge badge-primary font-mono">{record.cargo_batch_number}</span></td>
                          <td className="whitespace-normal break-words">{record.receiver_name}</td>
                          <td className="whitespace-nowrap font-semibold">{formatCurrency(record.cargo_price, record.currency_code)}</td>
                          <td className="whitespace-nowrap text-orange-600 font-semibold">{formatCurrency(record.storage_fee, record.currency_code)}</td>
                          <td className="whitespace-nowrap font-bold text-green-600">{formatCurrency(record.total_amount, record.currency_code)}</td>
                          <td className="whitespace-nowrap">{getPaymentMethodBadge(record.payment_method)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {revenueRecords.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="3" className="text-right">НИЙТ ДҮН:</td>
                        <td className="text-green-600">{formatCurrency(calculateTotals(revenueRecords, 'revenue').totalCargo)}</td>
                        <td className="text-orange-600">{formatCurrency(calculateTotals(revenueRecords, 'revenue').totalStorage)}</td>
                        <td className="text-blue-600 text-lg">{formatCurrency(calculateTotals(revenueRecords, 'revenue').grandTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}

            {activeTab === 'expense' && (
              <>
                <table className="data-table min-w-full">
                  <thead>
                    <tr>
                      <th>Огноо</th>
                      <th>Чингэлэг</th>
                      <th>Тайлбар</th>
                      <th>Дүн</th>
                      <th>Төлбөр</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseRecords.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-600">Зарлага байхгүй</td>
                      </tr>
                    ) : (
                      expenseRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="whitespace-nowrap">{formatDate(record.payment_date)}</td>
                          <td className="whitespace-normal break-words">{record.container_code || '-'}</td>
                          <td className="whitespace-normal break-words">{record.notes}</td>
                          <td className="whitespace-nowrap font-bold text-red-600">{formatCurrency(record.total_amount, record.currency_code)}</td>
                          <td className="whitespace-nowrap">{getPaymentMethodBadge(record.payment_method)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {expenseRecords.length > 0 && (
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan="3" className="text-right">НИЙТ ДҮН:</td>
                        <td className="text-red-600 text-lg">{formatCurrency(calculateTotals(expenseRecords, 'expense').grandTotal)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {showDetailModal && detailCargo && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto p-6 max-h-[90vh] overflow-y-auto">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FaBarcode className="mr-2 text-blue-600" />
                Ачааны дэлгэрэнгүй
              </h3>
              <button type="button" onClick={() => setShowDetailModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="bg-blue-50 p-3 rounded border">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Багц код:</strong> {detailCargo.batch_number}</div>
                  <div><strong>Төлөв:</strong> {getStatusBadge(detailCargo.status)}</div>
                  <div><strong>Илгээгч:</strong> {detailCargo.sender_name}</div>
                  <div><strong>Хүлээн авагч:</strong> {detailCargo.receiver_name}</div>
                </div>
              </div>

              <div className="bg-white border p-3 rounded">
                <h4 className="font-bold mb-2">Үнийн мэдээлэл:</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Ачааны үнэ:</span>
                    <span className="font-bold">{formatCurrency(detailCargo.price, detailCargo.price_currency_code)}</span>
                  </div>
                  {detailCargo.storage_fee_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Хадгалалт:</span>
                      <span className="font-bold text-orange-600">{formatCurrency(detailCargo.storage_fee_amount, detailCargo.price_currency_code)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">НИЙТ:</span>
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(detailCargo.total_with_storage, detailCargo.price_currency_code)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="custom-button-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                <FaTimes className="mr-2" /> Хаах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedCargo && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handlePaymentSubmit}>
              <div className="modal-header flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FaCheckCircle className="mr-2 text-green-600" />
                  Орлого бүртгэх
                </h3>
                <button type="button" onClick={() => setShowPaymentModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body space-y-4">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Тайлбар:</strong> Хүлээн авагч төлбөр төлөөд ачаагаа авч байна
                  </p>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">Багц:</span>
                    <span className="font-mono font-bold">{selectedCargo.batch_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Хүлээн авагч:</span>
                    <span className="font-bold">{selectedCargo.receiver_name}</span>
                  </div>
                </div>

                <div className="bg-white border border-gray-300 rounded p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Ачааны үнэ:</span>
                    <span className="font-semibold">{formatCurrency(selectedCargo.cargo_price, selectedCargo.currency_code)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Хадгалалт:</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(selectedCargo.storage_fee, selectedCargo.currency_code)}</span>
                  </div>
                  <div className="pt-2 border-t flex justify-between">
                    <span className="font-bold">НИЙТ:</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(selectedCargo.total_amount, selectedCargo.currency_code)}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Төлбөрийн хэлбэр <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 border-2 rounded cursor-pointer text-center transition-all ${
                      paymentForm.method === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input type="radio" name="method" value="cash" checked={paymentForm.method === 'cash'} 
                        onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})} className="hidden" />
                      <FaMoneyBillWave className="mx-auto mb-1 text-xl" />
                      <div className="font-semibold text-sm">Бэлэн</div>
                    </label>
                    <label className={`p-3 border-2 rounded cursor-pointer text-center transition-all ${
                      paymentForm.method === 'transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}>
                      <input type="radio" name="method" value="transfer" checked={paymentForm.method === 'transfer'}
                        onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})} className="hidden" />
                      <FaCreditCard className="mx-auto mb-1 text-xl" />
                      <div className="font-semibold text-sm">Шилжүүлэг</div>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Утасны дугаар</label>
                  <input type="tel" className="custom-input w-full"
                    placeholder={selectedCargo.receiver_phone || "Утас оруулах..."} value={paymentForm.receiver_phone}
                    onChange={(e) => setPaymentForm({...paymentForm, receiver_phone: e.target.value})} />
                </div>
              </div>

              <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={() => setShowPaymentModal(false)}>
                  <FaTimes className="mr-2" /> Цуцлах
                </button>
                <button type="submit" className="custom-button w-full sm:w-auto">
                  <FaSave className="mr-2" /> Орлого бүртгэх
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleExpenseSubmit}>
              <div className="modal-header flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <FaReceipt className="mr-2 text-red-600" />
                  Зарлага бүртгэх
                </h3>
                <button type="button" onClick={() => setShowExpenseModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body space-y-4">
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-sm text-red-800">
                    <strong>Тайлбар:</strong> Чингэлэгтэй холбоотой зарлага (тээвэр, агуулах гэх мэт)
                  </p>
                </div>

                <div className="form-group">
                  <label>Чингэлэг (заавал биш)</label>
                  <select className="custom-input w-full"
                    value={expenseForm.container_id} 
                    onChange={(e) => setExpenseForm({...expenseForm, container_id: e.target.value})}>
                    <option value="">Сонгоогүй (ерөнхий зарлага)</option>
                    {containers.map(c => (<option key={c.id} value={c.id}>{c.container_code}</option>))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Дүн <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" className="custom-input w-full"
                    value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} required 
                    placeholder="0.00" />
                </div>

                <div className="form-group">
                  <label>Валют</label>
                  <select className="custom-input w-full"
                    value={expenseForm.currency_code} onChange={(e) => setExpenseForm({...expenseForm, currency_code: e.target.value})}>
                    <option value="KRW">KRW (₩)</option>
                    <option value="MNT">MNT (₮)</option>
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Төлбөрийн хэлбэр</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 border-2 rounded cursor-pointer text-center transition-all ${
                      expenseForm.payment_method === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input type="radio" name="expense_method" value="cash" checked={expenseForm.payment_method === 'cash'}
                        onChange={(e) => setExpenseForm({...expenseForm, payment_method: e.target.value})} className="hidden" />
                      <FaMoneyBillWave className="mx-auto mb-1 text-xl" />
                      <div className="font-semibold text-sm">Бэлэн</div>
                    </label>
                    <label className={`p-3 border-2 rounded cursor-pointer text-center transition-all ${
                      expenseForm.payment_method === 'transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}>
                      <input type="radio" name="expense_method" value="transfer" checked={expenseForm.payment_method === 'transfer'}
                        onChange={(e) => setExpenseForm({...expenseForm, payment_method: e.target.value})} className="hidden" />
                      <FaCreditCard className="mx-auto mb-1 text-xl" />
                      <div className="font-semibold text-sm">Шилжүүлэг</div>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Тайлбар <span className="text-red-500">*</span></label>
                  <textarea className="custom-input w-full" rows="3"
                    value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} required 
                    placeholder="Зарлагын дэлгэрэнгүй тайлбар..." />
                </div>
              </div>

              <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={() => setShowExpenseModal(false)}>
                  <FaTimes className="mr-2" /> Цуцлах
                </button>
                <button type="submit" className="custom-button w-full sm:w-auto">
                  <FaSave className="mr-2" /> Зарлага бүртгэх
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;