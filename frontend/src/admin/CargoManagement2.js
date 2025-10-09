//frontend/src/admin/CargoManagement.js
import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash,
  FaBox, FaBarcode, FaQrcode, FaUsers, FaTruck,
  FaWeight, FaCube, FaCalendarAlt, FaTimes, FaSave,
  FaInfoCircle, FaFileInvoice, FaWarehouse, FaExclamationTriangle,
  FaTag, FaMapMarkerAlt, FaImage, FaUpload, FaSyncAlt, FaPrint, FaCheckCircle,
  FaMoneyBillWave, FaGlobe, FaUser, FaHistory, FaSearchPlus, FaPhone, FaUndo
} from 'react-icons/fa';
import JsBarcode from 'jsbarcode';
import axiosInstance from '../axios';
import '../styles/admin.css';
import '../styles/custom.css';
const CargoManagement = () => {
  const [cargos, setCargos] = useState([]);
  const [containers, setContainers] = useState([]);
  const [storageFees, setStorageFees] = useState([]);
  const [paymentLocations, setPaymentLocations] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedContainer, setSelectedContainer] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [newSelectedStatus, setNewSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 20 });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
 
  // Image Modal States
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState([]);
  // History States
  const [cargoStatusHistory, setCargoStatusHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Current User State
  const [currentUser, setCurrentUser] = useState(null);
  // Reverse Distribution States
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [reversingCargo, setReversingCargo] = useState(false);
  const [cargoForm, setCargoForm] = useState({
    container_id: '',
    cargo_name: '',
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    cargo_type: 'weight',
    weight_kg: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    total_pieces: 1,
    storage_fee_id: '',
    payment_location_id: '',
    description: '',
    images: [],
    currency_code: '',
    is_manual_price: false,
    manual_price: ''
  });
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    receiver_phone: ''
  });
 
  const [formErrors, setFormErrors] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const cargoStatuses = [
    { code: 'registered', name: 'Бүртгэгдсэн' },
    { code: 'shipped', name: 'Хөдөлж байгаа' },
    { code: 'arrived', name: 'Ирсэн' },
    { code: 'delivered', name: 'Хүргэгдсэн' },
    { code: 'pending_distribution', name: 'Тараагдаагүй' },
    { code: 'distributed', name: 'Тараагдсан' },
    { code: 'on_hold', name: 'Саатсан' },
    { code: 'customs_processing', name: 'Гааль дээр' }
  ];
  useEffect(() => {
    fetchCargos();
    fetchContainers();
    fetchStorageFees();
    fetchPaymentLocations();
    fetchCurrencies();
  }, [searchTerm, selectedStatus, selectedContainer, pagination.currentPage]);
  useEffect(() => {
    calculatePrice();
  }, [
    cargoForm.container_id,
    cargoForm.cargo_type,
    cargoForm.weight_kg,
    cargoForm.length_cm,
    cargoForm.width_cm,
    cargoForm.height_cm,
    cargoForm.total_pieces
  ]);
  useEffect(() => {
    if (showDetailModal && isPrintMode) {
      window.print();
      setIsPrintMode(false);
    }
  }, [showDetailModal, isPrintMode]);
  useEffect(() => {
    if (!showImageModal) return;
   
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') previousImage();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'Escape') setShowImageModal(false);
    };
   
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showImageModal, selectedImageIndex, modalImages]);
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get('/auth/me');
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Get user error:', error);
      }
    };
    fetchCurrentUser();
  }, []);
  const calculatePrice = () => {
    if (!cargoForm.container_id) {
      setCalculatedPrice(null);
      return;
    }
    const container = containers.find(c => c.id == cargoForm.container_id);
    if (!container) return;
    let unitPrice = 0;
    if (cargoForm.cargo_type === 'weight' && cargoForm.weight_kg) {
      unitPrice = parseFloat(cargoForm.weight_kg) * parseFloat(container.price_per_kg);
    } else if (cargoForm.cargo_type === 'volume' && cargoForm.length_cm && cargoForm.width_cm && cargoForm.height_cm) {
      const volume = (parseFloat(cargoForm.length_cm) * parseFloat(cargoForm.width_cm) * parseFloat(cargoForm.height_cm)) / 1000000;
      unitPrice = volume * parseFloat(container.price_per_cbm);
    }
    const totalPrice = unitPrice.toFixed(2);
    const currencyCode = getCurrencyCode(container.currency_id);
    setCalculatedPrice({
      totalPrice,
      pieces: cargoForm.total_pieces,
      currency: currencyCode
    });
  };
  const fetchCargos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage);
      params.append('page_size', pagination.pageSize);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedContainer !== 'all') params.append('container_id', selectedContainer);
      if (searchTerm) params.append('search', searchTerm);
 
      const response = await axiosInstance.get(`/api/cargo-new?${params}`);
      if (response.data.success) {
        const cargosData = response.data.data || [];
        cargosData.forEach(cargo => {
          if (cargo.images) {
            try {
              cargo.images = JSON.parse(cargo.images);
            } catch (e) {
              cargo.images = [];
            }
          } else {
            cargo.images = [];
          }
        });
        setCargos(cargosData);
        setPagination({
          ...pagination,
          totalPages: response.data.total_pages || 1,
          totalItems: response.data.total_items || 0
        });
      }
    } catch (error) {
      console.error('Cargo fetch error:', error);
      setCargos([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchContainers = async () => {
    try {
      const response = await axiosInstance.get('/api/containers-new/available');
      if (response.data.success) {
        setContainers(response.data.data || []);
      }
    } catch (error) {
      console.error('Containers fetch error:', error);
    }
  };
  const fetchStorageFees = async () => {
    try {
      const response = await axiosInstance.get('/api/storage-fees');
      if (response.data.success) {
        setStorageFees(response.data.data || []);
      }
    } catch (error) {
      console.error('Storage fees fetch error:', error);
    }
  };
  const fetchPaymentLocations = async () => {
    try {
      const response = await axiosInstance.get('/api/payment-locations');
      if (response.data.success) {
        setPaymentLocations(response.data.data || []);
      }
    } catch (error) {
      console.error('Payment locations fetch error:', error);
    }
  };
  const fetchCurrencies = async () => {
    try {
      const response = await axiosInstance.get('/api/payment-currencies');
      if (response.data.success) {
        setCurrencies(response.data.data || []);
      }
    } catch (error) {
      console.error('Currencies fetch error:', error);
    }
  };
  const fetchCargoHistory = async (cargoId) => {
    setLoadingHistory(true);
    try {
      const response = await axiosInstance.get(`/api/cargo-new/${cargoId}/history`);
      if (response.data.success) {
        setCargoStatusHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('History fetch error:', error);
      setCargoStatusHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };
  const handleReverseDistribution = async () => {
    if (!reverseReason.trim()) {
      alert('Буцаах шалтгаан оруулна уу');
      return;
    }
   
    if (!window.confirm('⚠️ Та итгэлтэй байна уу?\n\nЭнэ үйлдэл:\n• Төлбөрийн бүртгэлийг устгана\n• Ачааг "Тараагдаагүй" төлөвт буцаана\n\nДавтан тараах боломжтой болно.')) {
      return;
    }
   
    setReversingCargo(true);
    try {
      const response = await axiosInstance.patch(
        `/api/cargo-new/${selectedCargo.id}/reverse-distribution`,
        { reason: reverseReason }
      );
     
      if (response.data.success) {
        alert('✅ Тараалт амжилттай буцаагдлаа!\n\nТөлбөрийн бүртгэл устгагдсан.');
        setShowReverseModal(false);
        setReverseReason('');
        setShowDetailModal(false);
        fetchCargos();
      }
    } catch (error) {
      console.error('Reverse distribution error:', error);
      alert(error.response?.data?.msg || 'Тараалт буцаахад алдаа гарлаа');
    } finally {
      setReversingCargo(false);
    }
  };
  const getCurrencyCode = (currencyId) => {
    if (!currencyId) return '';
    const currency = currencies.find(c => c.id == currencyId);
    return currency ? currency.currency_code : '';
  };
  const formatCurrency = (amount, currencyCode) => {
    if (!amount) return `0${currencyCode || ''}`;
    return `${parseFloat(amount).toLocaleString()}${currencyCode || ''}`;
  };
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Зөвхөн зураг файл сонгоно уу!');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Зургийн хэмжээ 2MB-с бага байх ёстой!');
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await axiosInstance.post('/api/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setCargoForm({
          ...cargoForm,
          images: [...cargoForm.images, response.data.imageUrl]
        });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert(error.response?.data?.msg || 'Зураг хуулахад алдаа гарлаа');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };
  const removeImage = async (index, imageUrl) => {
    try {
      await axiosInstance.delete('/api/delete-image', { data: { imageUrl } });
      const newImages = [...cargoForm.images];
      newImages.splice(index, 1);
      setCargoForm({ ...cargoForm, images: newImages });
    } catch (error) {
      console.error('Image delete error:', error);
      const newImages = [...cargoForm.images];
      newImages.splice(index, 1);
      setCargoForm({ ...cargoForm, images: newImages });
    }
  };
  const validateForm = () => {
    const errors = {};
    if (!cargoForm.container_id) errors.container_id = 'Чингэлэг заавал сонгоно уу';
    if (!cargoForm.sender_name.trim()) errors.sender_name = 'Илгээгчийн нэр оруулна уу';
    if (!cargoForm.receiver_name.trim()) errors.receiver_name = 'Хүлээн авагчийн нэр оруулна уу';
   
    if (cargoForm.is_manual_price) {
      if (!cargoForm.manual_price || parseFloat(cargoForm.manual_price) <= 0) {
        errors.manual_price = 'Үнэ зөв оруулна уу';
      }
    } else {
      if (cargoForm.cargo_type === 'weight') {
        if (!cargoForm.weight_kg || parseFloat(cargoForm.weight_kg) <= 0) {
          errors.weight_kg = 'Жинг зөв оруулна уу';
        }
      } else if (cargoForm.cargo_type === 'volume') {
        if (!cargoForm.length_cm || parseFloat(cargoForm.length_cm) <= 0) errors.length_cm = 'Урт оруулна уу';
        if (!cargoForm.width_cm || parseFloat(cargoForm.width_cm) <= 0) errors.width_cm = 'Өргөн оруулна уу';
        if (!cargoForm.height_cm || parseFloat(cargoForm.height_cm) <= 0) errors.height_cm = 'Өндөр оруулна уу';
      }
    }
   
    if (!cargoForm.total_pieces || parseInt(cargoForm.total_pieces) < 1) {
      errors.total_pieces = 'Ширхэг 1-с дээш байна';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleAddCargo = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const requestData = {
        ...cargoForm,
        is_manual_price: cargoForm.is_manual_price ? 1 : 0,
        manual_price: cargoForm.is_manual_price ? parseFloat(cargoForm.manual_price) : null
      };
     
      const response = await axiosInstance.post('/api/cargo-new', requestData);
 
      if (response.data.success) {
        const container = containers.find(c => c.id == cargoForm.container_id);
        const currencySymbol = getCurrencyCode(container?.currency_id);
        alert(`Амжилттай бүртгэгдлээ!\n\nБагц: ${response.data.batch_number}\nШирхэг: ${response.data.cargo_codes.length}\nНийт үнэ: ${response.data.total_price.toLocaleString()}${currencySymbol}`);
   
        setShowAddModal(false);
        resetForm();
        fetchCargos();
      }
    } catch (error) {
      console.error('Add cargo error:', error);
      alert(error.response?.data?.msg || 'Ачаа бүртгэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteCargo = async (id) => {
    if (!window.confirm('Энэ ачааг устгахдаа итгэлтэй байна уу?')) return;
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/cargo-new/${id}`);
      if (response.data.success) {
        alert('Ачаа амжилттай устгагдлаа');
        fetchCargos();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.msg || 'Устгахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };
  const handleStatusChange = async () => {
    if (!newSelectedStatus) return;
   
    // Distributed төлөвт шилжих үед төлбөрийн хэлбэр шаардлагатай
    if (newSelectedStatus === 'distributed' && selectedCargo.status !== 'distributed') {
      if (!paymentData.method) {
        alert('Төлбөрийн хэлбэр сонгоно уу!');
        return;
      }
    }
   
    try {
      const requestData = {
        status: newSelectedStatus,
        payment_method: paymentData.method,
        receiver_phone_verified: paymentData.receiver_phone || selectedCargo.receiver_phone
      };
     
      const response = await axiosInstance.patch(
        `/api/cargo-new/${selectedCargo.id}/status`,
        requestData
      );
     
      if (response.data.success) {
        if (response.data.payment_recorded) {
          alert('✅ Төлөв шинэчлэгдэж, төлбөр бүртгэгдлээ!');
        } else {
          alert('Төлөв амжилттай шинэчлэгдлээ');
        }
        setShowStatusModal(false);
        setNewSelectedStatus('');
        setPaymentData({ method: 'cash', receiver_phone: '' });
        fetchCargos();
      }
    } catch (error) {
      console.error('Status change error:', error);
      alert(error.response?.data?.msg || 'Төлөв өөрчлөхөд алдаа гарлаа');
    }
  };
  const openDetailModal = async (cargo) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/cargo-new/${cargo.id}`);
      if (response.data.success) {
        const data = response.data.data;
        data.cargo_codes = response.data.batch_cargos.map(b => b.cargo_code) || [data.cargo_code];
        setSelectedCargo(data);
        setShowDetailModal(true);
        // Төлөвийн түүх татах
        await fetchCargoHistory(cargo.id);
      }
    } catch (error) {
      console.error('Fetch detail error:', error);
      alert('Дэлгэрэнгүй мэдээлэл авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };
  const handlePrint = async (cargo) => {
    await openDetailModal(cargo);
    setIsPrintMode(true);
  };
  const openStatusModal = async (cargo) => {
    setSelectedCargo(cargo);
    setNewSelectedStatus(cargo.status);
    setShowStatusModal(true);
   
    // Дэлгэрэнгүй мэдээлэл + storage fee тооцоолох
    try {
      const response = await axiosInstance.get(`/api/cargo-new/${cargo.id}`);
      if (response.data.success) {
        setSelectedCargo(response.data.data);
      }
    } catch (error) {
      console.error('Fetch cargo detail error:', error);
    }
  };
  const openImageModal = (images, index = 0) => {
    setModalImages(images);
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };
  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % modalImages.length);
  };
  const previousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + modalImages.length) % modalImages.length);
  };
  useEffect(() => {
    if (showDetailModal && selectedCargo && selectedCargo.cargo_codes) {
      selectedCargo.cargo_codes.forEach((code, index) => {
        const barcodeElement = document.getElementById(`barcode-${index}`);
        if (barcodeElement) {
          JsBarcode(barcodeElement, code, {
            format: "CODE128",
            lineColor: "#000000",
            width: 2,
            height: 80,
            fontSize: 14,
            displayValue: true,
            textMargin: 4,
            margin: 5
          });
        }
      });
    }
  }, [showDetailModal, selectedCargo]);
  const resetForm = () => {
    setCargoForm({
      container_id: '',
      cargo_name: '',
      sender_name: '',
      sender_phone: '',
      sender_address: '',
      receiver_name: '',
      receiver_phone: '',
      receiver_address: '',
      cargo_type: 'weight',
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
      total_pieces: 1,
      storage_fee_id: '',
      payment_location_id: '',
      description: '',
      images: [],
      currency_code: '',
      is_manual_price: false,
      manual_price: ''
    });
    setFormErrors({});
    setCalculatedPrice(null);
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
  const getStatusLabel = (statusCode) => {
    const statusMap = {
      'registered': 'Бүртгэгдсэн',
      'shipped': 'Хөдөлж байгаа',
      'arrived': 'Ирсэн',
      'delivered': 'Хүргэгдсэн',
      'pending_distribution': 'Тараагдаагүй',
      'distributed': 'Тараагдсан',
      'on_hold': 'Саатсан',
      'customs_processing': 'Гааль дээр'
    };
    return statusMap[statusCode] || statusCode;
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };
  const getCurrencySymbol = (cargo) => {
    return cargo.currency_code || cargo.price_currency_code || '';
  };
  const getStorageFeeName = (id) => {
    const fee = storageFees.find(f => f.id == id);
    return fee ? `${fee.fee_name} - ${Number(fee.price_per_day).toLocaleString()}${getCurrencyCode(fee.currency_id)}/${fee.unit_type === 'per_piece' ? 'ширхэг' : fee.unit_type === 'per_kg' ? 'кг' : 'м³'}` : '-';
  };
  const getPaymentLocationName = (id) => {
    const loc = paymentLocations.find(l => l.id == id);
    return loc ? `${loc.location_name} (${getCurrencyCode(loc.currency_id)})` : '-';
  };
  const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  };
  return (
    <div className="cargo-management min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <FaBox className="mr-3 text-blue-600" />
              Ачаа удирдлага
            </h1>
            <p className="text-sm text-gray-600">Ачааны бүртгэл, хяналт, удирдлага</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="custom-button flex items-center space-x-2 px-6 py-3"
          >
            <FaPlus className="w-4 h-4" />
            <span>Ачаа бүртгэх</span>
          </button>
        </div>
      </div>
      {/* FILTERS */}
      <div className="filters-section mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Ачааны код, нэр, илгээгч хайх..."
              className="filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
     
          <div className="relative">
            <FaFilter className="search-icon" />
            <select
              className="filter-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Бүх төлөв</option>
              {cargoStatuses.map(status => (
                <option key={status.code} value={status.code}>{status.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              className="filter-input"
              value={selectedContainer}
              onChange={(e) => setSelectedContainer(e.target.value)}
            >
              <option value="all">Бүх чингэлэг</option>
              {containers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.container_code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* TABLE */}
      <div className="table-container bg-white rounded-lg shadow overflow-hidden">
        <div className="table-header px-4 py-3 border-b">
          <h2 className="table-title">Ачааны жагсаалт</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3">Ачааны код</th>
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3">Зураг</th>
                <th className="px-4 py-3">Илгээгч</th>
                <th className="px-4 py-3">Хүлээн авагч</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3">Жин/Эзлэхүүн</th>
                <th className="px-4 py-3">Үнэ</th>
                <th className="px-4 py-3">Чингэлэг</th>
                <th className="px-4 py-3">Төлөв</th>
                <th className="px-4 py-3">Тоо/Ширхэг</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12" className="text-center py-8">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-2 text-gray-500">Ачааллаж байна...</p>
                  </td>
                </tr>
              ) : cargos.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center py-8 text-gray-500">
                    Ачаа олдсонгүй
                  </td>
                </tr>
              ) : (
                cargos.map((cargo) => (
                  <tr key={cargo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">
                      <div className="flex items-center space-x-2">
                        <FaBarcode className="text-blue-500" />
                        <span className="font-medium">{cargo.cargo_code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{cargo.cargo_name || '-'}</td>
                    <td className="px-4 py-3">
                      {cargo.images && cargo.images.length > 0 ? (
                        <div className="relative group">
                          <img
                            src={`${window.location.origin}${cargo.images[0]}`}
                            alt="Cargo"
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              openImageModal(cargo.images, 0);
                            }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=No+Image' }}
                          />
                          {cargo.images.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {cargo.images.length}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                          <FaImage className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{cargo.sender_name}</div>
                        <div className="text-gray-500 text-xs">{cargo.sender_phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{cargo.receiver_name}</div>
                        <div className="text-gray-500 text-xs">{cargo.receiver_phone || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {cargo.cargo_type === 'weight' ? (
                        <span className="badge badge-warning flex items-center space-x-1">
                          <FaWeight className="w-3 h-3" />
                          <span>Жин</span>
                        </span>
                      ) : (
                        <span className="badge badge-info flex items-center space-x-1">
                          <FaCube className="w-3 h-3" />
                          <span>Эзлэхүүн</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cargo.cargo_type === 'weight'
                        ? `${cargo.weight_kg} кг`
                        : `${(parseFloat(cargo.volume_cbm) || 0).toFixed(4)} м³`
                      }
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      {parseFloat(cargo.price * cargo.total_pieces).toLocaleString()}{getCurrencySymbol(cargo)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-primary">{cargo.container_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(cargo.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {cargo.total_pieces}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          className="icon-button text-blue-600"
                          title="Дэлгэрэнгүй"
                          onClick={() => openDetailModal(cargo)}
                        >
                          <FaEye />
                        </button>
                        <button
                          className="icon-button text-orange-600"
                          title="Төлөв өөрчлөх"
                          onClick={() => openStatusModal(cargo)}
                        >
                          <FaSyncAlt />
                        </button>
                        {currentUser?.role === 'system_admin' && cargo.status === 'distributed' && (
                          <button
                            className="icon-button text-yellow-600 hover:bg-yellow-50"
                            title="Тараалт буцаах (Admin only)"
                            onClick={() => {
                              setSelectedCargo(cargo);
                              setShowReverseModal(true);
                            }}
                          >
                            <FaUndo />
                          </button>
                        )}
                        <button
                          className="icon-button text-purple-600"
                          title="Хэвлэх"
                          onClick={() => handlePrint(cargo)}
                        >
                          <FaPrint />
                        </button>
                        <button
                          className="icon-button text-red-600"
                          title="Устгах"
                          onClick={() => handleDeleteCargo(cargo.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer flex justify-between items-center px-4 py-3 border-t">
          <span className="text-sm text-gray-600">
            Нийт {pagination.totalItems || cargos.length} ачаа
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="pagination-btn"
            >
              Өмнөх
            </button>
            <span className="text-sm text-gray-600 px-3 py-1">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="pagination-btn"
            >
              Дараах
            </button>
          </div>
        </div>
      </div>
      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl">
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaPlus className="w-5 h-5 mr-3 text-blue-600" />
                Ачаа бүртгэх
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="icon-button text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
           
            <div className="modal-body max-h-[70vh] overflow-y-auto">
              <form onSubmit={handleAddCargo}>
                <div className="space-y-6">
                  {/* Container Selection */}
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaTruck className="inline w-4 h-4 mr-2 text-blue-600" />
                      Чингэлэг <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`custom-input ${formErrors.container_id ? 'border-red-300 bg-red-50' : ''}`}
                      value={cargoForm.container_id}
                      onChange={(e) => {
                        setCargoForm({...cargoForm, container_id: e.target.value});
                        setFormErrors({...formErrors, container_id: ''});
                      }}
                    >
                      <option value="">Чингэлэг сонгох...</option>
                      {containers.map((container) => (
                        <option key={container.id} value={container.id}>
                          {container.container_code} - {container.direction_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.container_id && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FaExclamationTriangle className="w-3 h-3 mr-1" />
                        {formErrors.container_id}
                      </p>
                    )}
                  </div>
                  {/* Cargo Name */}
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaTag className="inline w-4 h-4 mr-2 text-purple-600" />
                      Ачааны нэр
                    </label>
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Ачааны нэр оруулах..."
                      value={cargoForm.cargo_name}
                      onChange={(e) => setCargoForm({...cargoForm, cargo_name: e.target.value})}
                    />
                  </div>
                  {/* Sender Info */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                      <FaUsers className="mr-2" />
                      Илгээгчийн мэдээлэл
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Нэр <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`custom-input ${formErrors.sender_name ? 'border-red-300 bg-red-50' : ''}`}
                          placeholder="Илгээгчийн нэр..."
                          value={cargoForm.sender_name}
                          onChange={(e) => {
                            setCargoForm({...cargoForm, sender_name: e.target.value});
                            setFormErrors({...formErrors, sender_name: ''});
                          }}
                        />
                        {formErrors.sender_name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.sender_name}</p>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Утас</label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="Утасны дугаар..."
                          value={cargoForm.sender_phone}
                          onChange={(e) => setCargoForm({...cargoForm, sender_phone: e.target.value})}
                        />
                      </div>
                      <div className="form-group md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Хаяг</label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="Хаяг..."
                          value={cargoForm.sender_address}
                          onChange={(e) => setCargoForm({...cargoForm, sender_address: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Receiver Info */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-4 flex items-center">
                      <FaUsers className="mr-2" />
                      Хүлээн авагчийн мэдээлэл
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Нэр <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          className={`custom-input ${formErrors.receiver_name ? 'border-red-300 bg-red-50' : ''}`}
                          placeholder="Хүлээн авагчийн нэр..."
                          value={cargoForm.receiver_name}
                          onChange={(e) => {
                            setCargoForm({...cargoForm, receiver_name: e.target.value});
                            setFormErrors({...formErrors, receiver_name: ''});
                          }}
                        />
                        {formErrors.receiver_name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.receiver_name}</p>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Утас</label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="Утасны дугаар..."
                          value={cargoForm.receiver_phone}
                          onChange={(e) => setCargoForm({...cargoForm, receiver_phone: e.target.value})}
                        />
                      </div>
                      <div className="form-group md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Хаяг</label>
                        <input
                          type="text"
                          className="custom-input"
                          placeholder="Хаяг..."
                          value={cargoForm.receiver_address}
                          onChange={(e) => setCargoForm({...cargoForm, receiver_address: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Cargo Type Selection */}
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <FaBox className="inline w-4 h-4 mr-2 text-green-600" />
                      Ачааны төрөл <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cargo_type"
                          value="weight"
                          checked={cargoForm.cargo_type === 'weight'}
                          onChange={(e) => setCargoForm({...cargoForm, cargo_type: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span className="flex items-center gap-2">
                          <FaWeight className="text-yellow-600" />
                          <span className="font-medium">Жин</span>
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cargo_type"
                          value="volume"
                          checked={cargoForm.cargo_type === 'volume'}
                          onChange={(e) => setCargoForm({...cargoForm, cargo_type: e.target.value})}
                          className="w-4 h-4"
                        />
                        <span className="flex items-center gap-2">
                          <FaCube className="text-blue-600" />
                          <span className="font-medium">Эзлэхүүн</span>
                        </span>
                      </label>
                    </div>
                  </div>
                  {/* Weight or Volume Input */}
                  {!cargoForm.is_manual_price && (
                    <>
                      {cargoForm.cargo_type === 'weight' ? (
                        <div className="form-group">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <FaWeight className="inline w-4 h-4 mr-2 text-yellow-600" />
                            Жин (кг) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className={`custom-input ${formErrors.weight_kg ? 'border-red-300 bg-red-50' : ''}`}
                            placeholder="Жинг оруулах..."
                            value={cargoForm.weight_kg}
                            onChange={(e) => {
                              setCargoForm({...cargoForm, weight_kg: e.target.value});
                              setFormErrors({...formErrors, weight_kg: ''});
                            }}
                          />
                          {formErrors.weight_kg && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.weight_kg}</p>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Урт (см) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className={`custom-input ${formErrors.length_cm ? 'border-red-300 bg-red-50' : ''}`}
                              placeholder="Урт..."
                              value={cargoForm.length_cm}
                              onChange={(e) => {
                                setCargoForm({...cargoForm, length_cm: e.target.value});
                                setFormErrors({...formErrors, length_cm: ''});
                              }}
                            />
                            {formErrors.length_cm && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.length_cm}</p>
                            )}
                          </div>
                          <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Өргөн (см) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className={`custom-input ${formErrors.width_cm ? 'border-red-300 bg-red-50' : ''}`}
                              placeholder="Өргөн..."
                              value={cargoForm.width_cm}
                              onChange={(e) => {
                                setCargoForm({...cargoForm, width_cm: e.target.value});
                                setFormErrors({...formErrors, width_cm: ''});
                              }}
                            />
                            {formErrors.width_cm && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.width_cm}</p>
                            )}
                          </div>
                          <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Өндөр (см) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className={`custom-input ${formErrors.height_cm ? 'border-red-300 bg-red-50' : ''}`}
                              placeholder="Өндөр..."
                              value={cargoForm.height_cm}
                              onChange={(e) => {
                                setCargoForm({...cargoForm, height_cm: e.target.value});
                                setFormErrors({...formErrors, height_cm: ''});
                              }}
                            />
                            {formErrors.height_cm && (
                              <p className="text-red-500 text-xs mt-1">{formErrors.height_cm}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {/* Total Pieces */}
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaBox className="inline w-4 h-4 mr-2 text-purple-600" />
                      Тоо/Ширхэг <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={`custom-input ${formErrors.total_pieces ? 'border-red-300 bg-red-50' : ''}`}
                      placeholder="Ширхэгийн тоо..."
                      value={cargoForm.total_pieces}
                      onChange={(e) => {
                        setCargoForm({...cargoForm, total_pieces: e.target.value});
                        setFormErrors({...formErrors, total_pieces: ''});
                      }}
                    />
                    {formErrors.total_pieces && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.total_pieces}</p>
                    )}
                  </div>
                  {/* Price - Calculated or Manual */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-xl border border-green-200 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-800 flex items-center gap-2">
                        <FaMoneyBillWave className="text-green-600" />
                        Үнийн мэдээлэл
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cargoForm.is_manual_price}
                          onChange={(e) => setCargoForm({
                            ...cargoForm,
                            is_manual_price: e.target.checked,
                            manual_price: e.target.checked ? cargoForm.manual_price : ''
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Гараас үнэ оруулах</span>
                      </label>
                    </div>
                    {cargoForm.is_manual_price ? (
                      <div className="form-group mb-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Үнэ оруулах <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className={`custom-input ${formErrors.manual_price ? 'border-red-300 bg-red-50' : ''}`}
                          placeholder="Үнэ оруулах..."
                          value={cargoForm.manual_price}
                          onChange={(e) => {
                            setCargoForm({...cargoForm, manual_price: e.target.value});
                            setFormErrors({...formErrors, manual_price: ''});
                          }}
                          required={cargoForm.is_manual_price}
                        />
                        {formErrors.manual_price && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.manual_price}</p>
                        )}
                      </div>
                    ) : (
                      calculatedPrice && (
                        <div>
                          <div className="text-3xl font-bold text-green-600">
                            {parseFloat(calculatedPrice.totalPrice).toLocaleString()} {calculatedPrice.currency}
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            {calculatedPrice.pieces} ширхэг
                          </p>
                        </div>
                      )
                    )}
                  </div>
                  {/* Storage Fee & Payment Location */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaWarehouse className="inline w-4 h-4 mr-2 text-orange-600" />
                        Хадгалалтын үнэ
                      </label>
                      <select
                        className="custom-input"
                        value={cargoForm.storage_fee_id}
                        onChange={(e) => setCargoForm({...cargoForm, storage_fee_id: e.target.value})}
                      >
                        <option value="">Сонгох...</option>
                        {storageFees.map((fee) => (
                          <option key={fee.id} value={fee.id}>
                            {fee.fee_name} - {Number(fee.price_per_day).toLocaleString()}{getCurrencyCode(fee.currency_id)}/{fee.unit_type === 'per_piece' ? 'ширхэг' : fee.unit_type === 'per_kg' ? 'кг' : 'м³'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline w-4 h-4 mr-2 text-pink-600" />
                        Төлбөрийн байршил
                      </label>
                      <select
                        className="custom-input"
                        value={cargoForm.payment_location_id}
                        onChange={(e) => setCargoForm({...cargoForm, payment_location_id: e.target.value})}
                      >
                        <option value="">Сонгох...</option>
                        {paymentLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.location_name} ({getCurrencyCode(loc.currency_id)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Images Upload */}
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaImage className="inline w-4 h-4 mr-2 text-blue-600" />
                      Зураг оруулах
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="custom-button flex items-center cursor-pointer">
                        <FaUpload className="mr-2" />
                        {uploadingImage ? 'Хуулж байна...' : 'Зураг сонгох'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {cargoForm.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {cargoForm.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={`${window.location.origin}${img}`}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx, img)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Description */}
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaInfoCircle className="inline w-4 h-4 mr-2 text-gray-600" />
                      Нэмэлт тайлбар
                    </label>
                    <textarea
                      className="custom-input"
                      rows="3"
                      placeholder="Нэмэлт тайлбар..."
                      value={cargoForm.description}
                      onChange={(e) => setCargoForm({...cargoForm, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="custom-button-secondary"
                    disabled={loading}
                  >
                    Цуцлах
                  </button>
                  <button
                    type="submit"
                    className="custom-button-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="loading-spinner mr-2"></div>
                        Бүртгэж байна...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FaSave className="w-4 h-4 mr-2" />
                        Бүртгэх
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* STATUS CHANGE MODAL */}
      {showStatusModal && selectedCargo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaSyncAlt className="w-5 h-5 mr-3 text-orange-600" />
                Төлөв өөрчлөх
              </h3>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setNewSelectedStatus('');
                  setPaymentData({ method: 'cash', receiver_phone: '' });
                }}
                className="icon-button text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Одоогийн төлөв:</strong> {getStatusBadge(selectedCargo.status)}
                  </p>
                </div>
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Шинэ төлөв сонгох
                  </label>
                  <select
                    className="custom-input"
                    value={newSelectedStatus}
                    onChange={(e) => setNewSelectedStatus(e.target.value)}
                    required
                  >
                    {cargoStatuses.map((status) => (
                      <option key={status.code} value={status.code}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* DISTRIBUTED ТӨЛӨВТ ШИЛЖИХ ҮЕД */}
                {newSelectedStatus === 'distributed' && selectedCargo.status !== 'distributed' && (
                  <>
                    <div className="bg-green-50 border-l-4 border-green-400 p-4">
                      <div className="flex items-start">
                        <FaCheckCircle className="text-green-500 mr-3 mt-1" />
                        <div className="text-sm text-green-700">
                          <p className="font-semibold mb-1">✅ Төлбөр бүртгэгдэнэ</p>
                          <p>Ачааг "Тараагдсан" төлөвт шилжүүлэх үед төлбөрийн мэдээлэл автоматаар бүртгэгдэнэ.</p>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaMoneyBillWave className="inline mr-2 text-green-600" />
                        Төлбөрийн хэлбэр <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="custom-input"
                        value={paymentData.method}
                        onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                        required
                      >
                        <option value="cash">Бэлэн мөнгө</option>
                        <option value="transfer">Шилжүүлэг</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaPhone className="inline mr-2 text-blue-600" />
                        Хүлээн авагчийн утас (баталгаажуулах)
                      </label>
                      <input
                        type="tel"
                        className="custom-input"
                        placeholder={selectedCargo.receiver_phone || "Утасны дугаар оруулах..."}
                        value={paymentData.receiver_phone}
                        onChange={(e) => setPaymentData({...paymentData, receiver_phone: e.target.value})}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Анхны утас: {selectedCargo.receiver_phone || 'Бүртгээгүй'}
                      </p>
                    </div>
                    {/* ТӨЛБӨРИЙН ДЭЛГЭРЭНГҮЙ */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-3">Төлбөрийн дэлгэрэнгүй:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Ачааны үнэ:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(
                              (selectedCargo.is_manual_price ? selectedCargo.manual_price : selectedCargo.price) * selectedCargo.total_pieces,
                              selectedCargo.price_currency_code || selectedCargo.currency_code
                            )}
                          </span>
                        </div>
                        {selectedCargo.storage_fee_amount && selectedCargo.storage_fee_amount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Хадгалалтын хөлс ({selectedCargo.storage_days || 0}ө):</span>
                            <span className="font-bold text-orange-600">
                              {formatCurrency(selectedCargo.storage_fee_amount, selectedCargo.price_currency_code || selectedCargo.currency_code)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold text-gray-800">НИЙТ ДҮН:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {(() => {
                              const cargoPrice = parseFloat(
                                (selectedCargo.is_manual_price ? selectedCargo.manual_price : selectedCargo.price) * selectedCargo.total_pieces
                              ) || 0;
                              const storageFee = parseFloat(selectedCargo.storage_fee_amount) || 0;
                              const total = cargoPrice + storageFee;
                              return formatCurrency(total, selectedCargo.price_currency_code || selectedCargo.currency_code);
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setNewSelectedStatus('');
                  setPaymentData({ method: 'cash', receiver_phone: '' });
                }}
                className="custom-button-secondary"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={handleStatusChange}
                className="custom-button-success"
                disabled={newSelectedStatus === 'distributed' && !paymentData.method}
              >
                <div className="flex items-center">
                  <FaSyncAlt className="w-4 h-4 mr-2" />
                  {newSelectedStatus === 'distributed' ? 'Төлбөр бүртгэх' : 'Шинэчлэх'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* REVERSE DISTRIBUTION MODAL - SYSTEM ADMIN ONLY */}
      {showReverseModal && selectedCargo && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            {/* HEADER - CSS өнгө */}
            <div className="reverse-modal-header">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <FaUndo className="w-7 h-7 reverse-icon-pulse" />
                Тараалт буцаах
              </h3>
              <button
                onClick={() => {
                  setShowReverseModal(false);
                  setReverseReason('');
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            {/* BODY */}
            <div className="modal-body">
              <div className="space-y-4">
                {/* Анхааруулга */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex items-start">
                    <FaExclamationTriangle className="text-red-500 text-xl mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-red-800 font-bold mb-2">⚠️ Анхааруулга</h4>
                      <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                        <li>Төлбөрийн бүртгэл <strong>устгагдана</strong></li>
                        <li>Ачаа "Тараагдаагүй" төлөвт <strong>буцна</strong></li>
                        <li>Дахин тараах боломжтой болно</li>
                        <li>Энэ үйлдлийг <strong>буцаах боломжгүй</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Ачааны мэдээлэл */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <FaBox className="text-blue-600" />
                    Ачааны мэдээлэл
                  </h5>
                  <div className="text-sm space-y-1 text-blue-900">
                    <p><strong>Багц код:</strong> {selectedCargo.batch_number}</p>
                    <p><strong>Хүлээн авагч:</strong> {selectedCargo.receiver_name}</p>
                    <p><strong>Үнэ:</strong> {formatCurrency(
                      (selectedCargo.is_manual_price ? selectedCargo.manual_price : selectedCargo.price) * selectedCargo.total_pieces,
                      selectedCargo.price_currency_code || selectedCargo.currency_code
                    )}</p>
                  </div>
                </div>
                {/* Шалтгаан оруулах */}
                <div className="form-group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <FaInfoCircle className="inline mr-2 text-gray-600" />
                    Буцаах шалтгаан <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="custom-input"
                    rows="4"
                    placeholder="Яагаад тараалт буцааж байгаа шалтгаанаа тодорхой бичнэ үү..."
                    value={reverseReason}
                    onChange={(e) => setReverseReason(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FaHistory className="text-gray-400" />
                    Энэ мэдээлэл түүхэнд хадгалагдана
                  </p>
                </div>
              </div>
            </div>
            {/* FOOTER - CSS өнгө */}
            <div className="modal-footer bg-gray-50 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowReverseModal(false);
                  setReverseReason('');
                }}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 shadow-sm"
                disabled={reversingCargo}
              >
                <FaTimes className="w-5 h-5" />
                <span>Хаах</span>
              </button>
             
              <button
                type="button"
                onClick={handleReverseDistribution}
                className="reverse-action-button"
                disabled={reversingCargo || !reverseReason.trim()}
              >
                {reversingCargo ? (
                  <>
                    <div className="loading-spinner w-6 h-6 border-white"></div>
                    <span>Буцааж байна...</span>
                  </>
                ) : (
                  <>
                    <FaUndo className="w-6 h-6" />
                    <span>БУЦААХ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* DETAIL MODAL */}
      {showDetailModal && selectedCargo && (
        <div className="modal-overlay">
          <div className={`cargo-detail-modal ${isPrintMode ? 'print-mode' : ''}`}>
            <div className="modal-header print-header bg-gradient-to-r from-blue-400 to-blue-500 rounded-t-xl shadow-lg">
              <h3 className="text-xl font-bold flex items-center text-gray-800">
                <FaBox className="w-6 h-6 mr-3 text-gray-800" />
                Ачааны дэлгэрэнгүй
              </h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCargo(null);
                }}
                className="no-print text-gray-800 hover:text-gray-600 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="cargo-detail-body p-6 bg-gradient-to-b from-gray-50 to-white">
              {/* HEADER */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl mb-6 border border-indigo-200 shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3">
                      {selectedCargo.cargo_name || 'Ачааны мэдээлэл'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 font-medium">Багц код:</span>
                        <span className="font-semibold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                          {selectedCargo.batch_number || '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 font-medium">Тоо/Ширхэг:</span>
                        <span className="font-semibold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                          {selectedCargo.total_pieces || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-col items-end">
                    {getStatusBadge(selectedCargo.status)}
                    <div className="text-3xl font-bold text-green-600 mt-2 flex items-center">
                      {parseFloat((selectedCargo.is_manual_price ? selectedCargo.manual_price : selectedCargo.price) * selectedCargo.total_pieces).toLocaleString()}
                      <span className="text-sm ml-1">{getCurrencySymbol(selectedCargo)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* STORAGE FEE */}
              {selectedCargo.storage_fee_amount > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-lg shadow-md">
                  <h5 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                    <FaExclamationTriangle className="mr-2 text-yellow-500" />
                    Хадгалалтын хөлс нэмэгдсэн
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-yellow-700 font-medium">Хадгалагдсан өдрүүд</p>
                      <p className="text-2xl font-bold text-yellow-800">{selectedCargo.storage_days} өдөр</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-yellow-700 font-medium">Нэмэгдэх дүн</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {parseFloat(selectedCargo.storage_fee_amount || 0).toLocaleString()}
                        <span className="text-sm ml-1">{getCurrencySymbol(selectedCargo)}</span>
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="text-yellow-700 font-medium">Нийт дүн (үндсэн + хадгалалт)</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {parseFloat( ((selectedCargo.is_manual_price ? selectedCargo.manual_price : selectedCargo.price) * selectedCargo.total_pieces + selectedCargo.storage_fee_amount) || 0).toLocaleString()}
                        <span className="text-sm ml-1">{getCurrencySymbol(selectedCargo)}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2 italic">
                    Чингэлэг тараасны 7 хоногийн дараа хоног тутамд тооцогдоно
                  </p>
                </div>
              )}
              {/* IMAGES */}
              {selectedCargo.images && selectedCargo.images.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaImage className="text-purple-500" />
                    Ачааны зураг ({selectedCargo.images.length})
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedCargo.images.map((img, idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300">
                        <img
                          src={`${window.location.origin}${img}`}
                          alt={`Cargo ${idx + 1}`}
                          className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageModal(selectedCargo.images, idx);
                          }}
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <FaSearchPlus className="text-white text-2xl" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                          {idx + 1}/{selectedCargo.images.length}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* ИЛГЭЭГЧ БА ХҮЛЭЭН АВАГЧ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-md">
                  <h5 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                    <FaUsers className="text-purple-500" />
                    Илгээгч
                  </h5>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-purple-600 font-medium">Нэр:</span>
                      <span className="font-bold text-gray-900">{selectedCargo.sender_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-purple-100">
                      <span className="text-purple-600 font-medium">Утас:</span>
                      <span className="font-bold text-gray-900">{selectedCargo.sender_phone || '-'}</span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-purple-600 font-medium">Хаяг:</span>
                      <span className="font-bold text-gray-900 max-w-xs break-words text-right">
                        {selectedCargo.sender_address || '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-md">
                  <h5 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                    <FaUsers className="text-orange-500" />
                    Хүлээн авагч
                  </h5>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <span className="text-orange-600 font-medium">Нэр:</span>
                      <span className="font-bold text-gray-900">{selectedCargo.receiver_name}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-orange-100">
                      <span className="text-orange-600 font-medium">Утас:</span>
                      <span className="font-bold text-gray-900">{selectedCargo.receiver_phone || '-'}</span>
                    </div>
                    <div className="flex justify-between items-start py-2">
                      <span className="text-orange-600 font-medium">Хаяг:</span>
                      <span className="font-bold text-gray-900 max-w-xs break-words text-right">
                        {selectedCargo.receiver_address || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* ТЕХНИК МЭДЭЭЛЭЛ */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200 shadow-md mb-6">
                <h5 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <FaBox className="text-green-500" />
                  Техник мэдээлэл
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-600 text-xs mb-2">Төрөл</p>
                    <p className="font-bold text-lg">
                      {selectedCargo.cargo_type === 'weight' ? (
                        <span className="flex items-center justify-center gap-1 text-yellow-600">
                          <FaWeight className="w-4 h-4" />
                          <span>Жин</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1 text-blue-600">
                          <FaCube className="w-4 h-4" />
                          <span>Эзлэхүүн</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-600 text-xs mb-2">Жин</p>
                    <p className="font-bold text-lg text-gray-900">{selectedCargo.weight_kg || '-'} кг</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-600 text-xs mb-2">Эзлэхүүн</p>
                    <p className="font-bold text-lg text-gray-900">
                      {selectedCargo.volume_cbm
                        ? `${parseFloat(selectedCargo.volume_cbm).toFixed(4)} м³`
                        : '-'
                      }
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-gray-600 text-xs mb-2">Үнэ</p>
                    <p className="font-bold text-lg text-green-600 flex items-center justify-center">
                      {parseFloat( (selectedCargo.price || 0) * selectedCargo.total_pieces ).toLocaleString()}
                      <span className="text-sm ml-1">{getCurrencySymbol(selectedCargo)}</span>
                    </p>
                  </div>
                </div>
              </div>
              {/* ЧИНГЭЛЭГ, ОГНОО, НЭМЭЛТ ТӨЛБӨР */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-md">
                  <h5 className="text-md font-semibold text-blue-800 mb-4 flex items-center gap-2">
                    <FaTruck className="text-blue-500" />
                    Ачааны байршил
                  </h5>
                  <div className="space-y-3 text-sm">
                    <p><strong>Код:</strong> <span className="font-medium">{selectedCargo.container_code}</span></p>
                    <p><strong>Байршил:</strong> <span className="font-medium">{selectedCargo.container_road_name || '-'}</span></p>
                    <p><strong>Төлөв:</strong> <span className="font-medium">{selectedCargo.container_status || '-'}</span></p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-5 rounded-xl border border-yellow-200 shadow-md">
                  <h5 className="text-md font-semibold text-yellow-800 mb-4 flex items-center gap-2">
                    <FaCalendarAlt className="text-yellow-500" />
                    Огноо
                  </h5>
                  <div className="text-sm space-y-2">
                    <p><strong>Бүртгэсэн:</strong><br/>
                      <span className="font-medium">{formatDate(selectedCargo.registered_date)}</span>
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 p-5 rounded-xl border border-pink-200 shadow-md">
                  <h5 className="text-md font-semibold text-pink-800 mb-4 flex items-center gap-2">
                    <FaMoneyBillWave className="text-pink-500" />
                    Нэмэлт төлбөр
                  </h5>
                  <div className="text-sm space-y-2">
                    <p><strong>Хадгалах үнэ:</strong><br/>
                      <span className="font-medium">
                        {selectedCargo.storage_fee_id ? getStorageFeeName(selectedCargo.storage_fee_id) : '-'}
                      </span>
                    </p>
                    <p><strong>Төлбөрийн байршил:</strong><br/>
                      <span className="font-medium">
                        {selectedCargo.payment_location_id ? getPaymentLocationName(selectedCargo.payment_location_id) : '-'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              {/* ТӨЛӨВИЙН ӨӨРЧЛӨЛТИЙН ТҮҮХ - COMPACT TIMELINE */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <FaHistory className="text-blue-600 text-sm" />
                    Төлөвийн түүх
                  </h5>
                  {!loadingHistory && cargoStatusHistory.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {cargoStatusHistory.length} өөрчлөлт
                    </span>
                  )}
                </div>
               
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-6">
                    <div className="loading-spinner"></div>
                    <span className="ml-2 text-sm text-gray-500">Ачаалж байна...</span>
                  </div>
                ) : cargoStatusHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <FaInfoCircle className="inline mb-1" /> Түүх байхгүй
                  </div>
                ) : (
                  <div className="overflow-x-auto history-scroll pb-2">
                    <div className="flex gap-3 min-w-max">
                      {cargoStatusHistory.map((history, index) => (
                        <div
                          key={history.id}
                          className="history-card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 min-w-[220px] max-w-[220px] flex-shrink-0 hover:shadow-md transition-shadow"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {cargoStatusHistory.length - index}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {new Date(history.changed_at).toLocaleDateString('mn-MN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {/* Status Change */}
                          <div className="mb-2">
                            {history.old_status ? (
                              <div className="flex items-center gap-1 text-xs">
                                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-medium truncate">
                                  {getStatusLabel(history.old_status)}
                                </span>
                                <svg className="w-3 h-3 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-medium truncate">
                                  {getStatusLabel(history.new_status)}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded text-xs font-medium">
                                <FaCheckCircle className="text-[10px]" />
                                {getStatusLabel(history.new_status)}
                              </span>
                            )}
                          </div>
                          {/* Notes */}
                          {history.notes && (
                            <p className="text-[11px] text-gray-600 leading-tight mb-2 line-clamp-2">
                              {history.notes}
                            </p>
                          )}
                          {/* User */}
                          <div className="flex items-center gap-1 pt-2 border-t border-blue-200">
                            <FaUser className="text-blue-600 text-[10px]" />
                            <span className="text-xs text-blue-700 font-medium truncate">
                              {history.changed_by}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* ТАЙЛБАР */}
              {selectedCargo.description && (
                <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200 shadow-md">
                  <h5 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FaInfoCircle className="text-gray-500" />
                    Нэмэлт тайлбар
                  </h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg shadow-inner">
                    {selectedCargo.description}
                  </p>
                </div>
              )}
              {/* БАРКОД */}
              <div className="bg-white border-2 border-gray-300 rounded-xl p-6 shadow-lg">
                <h5 className="text-lg font-semibold text-gray-800 mb-5 text-center flex items-center justify-center gap-2">
                  <FaBarcode className="text-blue-600" />
                  Ачааны баркод
                </h5>
         
                {selectedCargo.cargo_codes && selectedCargo.cargo_codes.length > 0 ? (
                  <div className="overflow-x-auto flex flex-row gap-6 pb-4">
                    {selectedCargo.cargo_codes.map((code, index) => (
                      <div key={index} className="bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-lg p-5 text-center shadow-md hover:shadow-xl transition-shadow duration-300 min-w-[200px]">
                        <p className="text-xs font-semibold text-gray-600 mb-3">
                          Ширхэг {index + 1} / {selectedCargo.cargo_codes.length}
                        </p>
                        <div className="bg-white p-4 rounded-md mb-4 border shadow-sm flex justify-center items-center min-h-[120px]">
                          <svg id={`barcode-${index}`} className="max-w-full h-auto"></svg>
                        </div>
                        <p className="text-sm font-mono font-bold text-gray-900 tracking-wider bg-gray-100 px-2 py-1 rounded">
                          {code}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Баркод үүсгэх боломжгүй</p>
                )}
              </div>
            </div>
            <div className="modal-footer no-print bg-gray-50 border-t rounded-b-xl p-4 flex justify-between">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCargo(null);
                }}
                className="custom-button-secondary flex items-center"
              >
                <FaTimes className="mr-2" /> Хаах
              </button>
              <button
                onClick={() => window.print()}
                className="custom-button flex items-center"
              >
                <FaPrint className="mr-2" /> Хэвлэх
              </button>
            </div>
          </div>
        </div>
      )}
      {/* IMAGE MODAL - FULL SCREEN IMAGE VIEWER */}
      {showImageModal && modalImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <FaTimes className="w-8 h-8" />
          </button>
          {modalImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  previousImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-3"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={`${window.location.origin}${modalImages[selectedImageIndex]}`}
              alt={`Image ${selectedImageIndex + 1}`}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/800?text=Image+Not+Found' }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
              {selectedImageIndex + 1} / {modalImages.length}
            </div>
          </div>
          <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
            ← → товчоор солих
          </div>
        </div>
      )}
    </div>
  );
};
export default CargoManagement;