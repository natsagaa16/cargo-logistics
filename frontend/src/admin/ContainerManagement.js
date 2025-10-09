//frontend/src/admin/ContainerManagement.js
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaSearch, FaFilter, FaEye, FaEdit, FaTrash,
  FaShippingFast, FaBoxOpen, FaTruck, FaCalendarAlt,
  FaUsers, FaBox, FaBarcode, FaMapMarkerAlt, FaSyncAlt,
  FaTimes, FaExclamationTriangle, FaTag, FaFileAlt,
  FaInfoCircle, FaClipboardList, FaCube, FaMoneyBillWave,
  FaCheckCircle, FaWarehouse, FaPhone, FaImage, FaClock,
  FaChartLine, FaHistory, FaUser, FaArrowLeft, FaArrowRight
} from 'react-icons/fa';
import JsBarcode from 'jsbarcode';
import axiosInstance from '../axios';
import '../styles/admin.css';
import '../styles/custom.css';

const ContainerManagement = () => {
  const [containers, setContainers] = useState([]);
  const [directions, setDirections] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [roadInfo, setRoadInfo] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDirection, setSelectedDirection] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCargoDetailModal, setShowCargoDetailModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [containerDetail, setContainerDetail] = useState(null);
  const [changeHistory, setChangeHistory] = useState([]);
  const [newSelectedStatus, setNewSelectedStatus] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, pageSize: 10 });
  const [formErrors, setFormErrors] = useState({});
  
  const [cargoPage, setCargoPage] = useState(1);
  const [cargoPerPage] = useState(15);
  const [jumpToPage, setJumpToPage] = useState('');

  const [newContainer, setNewContainer] = useState({
    name: '',
    direction_id: '',
    container_type_id: '',
    road_info_id: '',
    departure_date: '',
    registration_date: new Date().toISOString().split('T')[0],
    arrival_date: '',
    description: ''
  });

  useEffect(() => {
    fetchContainers();
    fetchDirections();
    fetchContainerTypes();
    fetchRoadInfo();
    fetchStatuses();
  }, [searchTerm, selectedStatus, selectedType, selectedDirection, pagination.currentPage]);

  useEffect(() => {
    if (showDetailModal) {
      setCargoPage(1);
      setJumpToPage('');
    }
  }, [showDetailModal]);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.currentPage);
      params.append('page_size', pagination.pageSize);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType !== 'all') params.append('type_id', selectedType);
      if (selectedDirection !== 'all') params.append('direction_id', selectedDirection);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await axiosInstance.get(`/api/containers-new?${params}`);
      if (response.data.success) {
        setContainers(response.data.data || []);
        setPagination({
          ...pagination,
          totalPages: response.data.total_pages || 1,
          totalItems: response.data.total_items || 0
        });
      }
    } catch (error) {
      console.error('Container fetch error:', error);
      setContainers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDirections = async () => {
    try {
      const response = await axiosInstance.get('/api/directions');
      if (response.data.success) {
        setDirections(response.data.data || []);
      }
    } catch (error) {
      console.error('Directions fetch error:', error);
    }
  };

  const fetchContainerTypes = async () => {
    try {
      const response = await axiosInstance.get('/api/container-types');
      if (response.data.success) {
        setContainerTypes(response.data.data || []);
      }
    } catch (error) {
      console.error('Container types fetch error:', error);
    }
  };

  const fetchRoadInfo = async () => {
    try {
      const response = await axiosInstance.get('/api/road-info');
      if (response.data.success) {
        setRoadInfo(response.data.data || []);
      }
    } catch (error) {
      console.error('Road info fetch error:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await axiosInstance.get('/api/container-statuses');
      if (response.data.success) {
        setStatuses(response.data.data || []);
      }
    } catch (error) {
      console.error('Statuses fetch error:', error);
    }
  };

  const fetchChangeHistory = async (containerId) => {
    try {
      const response = await axiosInstance.get(`/api/containers-new/${containerId}/history`);
      if (response.data.success) {
        setChangeHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Change history fetch error:', error);
      setChangeHistory([]);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newContainer.direction_id) {
      errors.direction_id = 'Чиглэл заавал сонгоно уу';
    }
    if (!newContainer.container_type_id) {
      errors.container_type_id = 'Төрөл заавал сонгоно уу';
    }
    if (!newContainer.registration_date) {
      errors.registration_date = 'Бүртгэлийн огноо заавал оруулна уу';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddContainer = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const requestData = {
        direction_id: parseInt(newContainer.direction_id),
        container_type_id: parseInt(newContainer.container_type_id),
        road_info_id: newContainer.road_info_id ? parseInt(newContainer.road_info_id) : null,
        departure_date: newContainer.departure_date || null,
        registration_date: newContainer.registration_date,
        arrival_date: newContainer.arrival_date || null,
        name: newContainer.name.trim() || null,
        description: newContainer.description.trim() || null
      };
      
      const response = await axiosInstance.post('/api/containers-new', requestData);
      
      if (response.data.success) {
        alert(`Чингэлэг амжилттай үүслээ!\nКод: ${response.data.container_code}`);
        setShowAddModal(false);
        resetForm();
        fetchContainers();
      }
    } catch (error) {
      console.error('Add container error:', error);
      alert(error.response?.data?.msg || 'Чингэлэг үүсгэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleEditContainer = async (e) => {
    e.preventDefault();
    if (!selectedContainer) return;
    
    setLoading(true);
    try {
      let road_info_id = null;
      if (selectedContainer.road_info_id && selectedContainer.road_info_id !== '' && selectedContainer.road_info_id !== 'null') {
        const parsed = parseInt(selectedContainer.road_info_id);
        road_info_id = isNaN(parsed) ? null : parsed;
      }
      
      let departure_date = null;
      if (selectedContainer.departure_date && selectedContainer.departure_date !== '') {
        departure_date = selectedContainer.departure_date.split('T')[0];
      }
      
      let arrival_date = null;
      if (selectedContainer.arrival_date && selectedContainer.arrival_date !== '') {
        arrival_date = selectedContainer.arrival_date.split('T')[0];
      }
      
      const requestData = {
        name: selectedContainer.name?.trim() || null,
        road_info_id,
        departure_date,
        arrival_date,
        description: selectedContainer.description?.trim() || null
      };
      
      const response = await axiosInstance.put(`/api/containers-new/${selectedContainer.id}`, requestData);
      
      if (response.data.success) {
        setShowEditModal(false);
        setSelectedContainer(null);
        fetchContainers();
        alert('Чингэлэг амжилттай шинэчлэгдлээ');
      }
    } catch (error) {
      console.error('Edit container error:', error);
      alert(error.response?.data?.msg || 'Чингэлэг шинэчлэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContainer = async (id) => {
    if (!window.confirm('Та итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.')) return;
    
    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/containers-new/${id}`);
      if (response.data.success) {
        fetchContainers();
        alert('Чингэлэг амжилттай устгагдлаа');
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
    
    if (newSelectedStatus === 'open_distribution') {
      if (!window.confirm(`"${selectedContainer.container_code}" чингэлгийг тараалтад оруулахдаа итгэлтэй байна уу?\n\nДоторх бүх ачааны төлөв "Тараагдаагүй" болж, 7 хоногийн дараа хадгалалтын хөлс тооцогдож эхэлнэ.`)) {
        return;
      }
      
      setLoading(true);
      try {
        const response = await axiosInstance.patch(`/api/containers-new/${selectedContainer.id}/start-distribution`);
        if (response.data.success) {
          const { updated_cargo_count, total_cargo_count } = response.data;
          alert(
            `Амжилттай!\n\n` +
            `Чингэлэг тараалтад орлоо.\n` +
            `Нийт ${total_cargo_count} багц ачаанаас ${updated_cargo_count} ширхэг "Тараагдаагүй" төлөвт шилжлээ.`
          );
          setShowStatusModal(false);
          setNewSelectedStatus('');
          fetchContainers();
        }
      } catch (error) {
        console.error('Start distribution error:', error);
        alert(error.response?.data?.msg || 'Тараалт эхлүүлэхэд алдаа гарлаа');
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const response = await axiosInstance.patch(`/api/containers-new/${selectedContainer.id}/status`, {
          status: newSelectedStatus
        });
        if (response.data.success) {
          setShowStatusModal(false);
          setNewSelectedStatus('');
          fetchContainers();
          alert('Төлөв амжилттай шинэчлэгдлээ');
        }
      } catch (error) {
        console.error('Status update error:', error);
        alert('Төлөв шинэчлөхөд алдаа гарлаа');
      }
    }
  };

  const openEditModal = (container) => {
    setSelectedContainer({...container});
    setShowEditModal(true);
  };

  const openStatusModal = (container) => {
    setSelectedContainer(container);
    setNewSelectedStatus(container.status);
    setShowStatusModal(true);
  };

  const openDetailModal = async (container) => {
  setLoading(true);
  try {
    const response = await axiosInstance.get(`/api/containers-new/${container.id}/detail`);
    if (response.data.success) {
      const data = response.data;
      
      // ЗАСВАР: Багцаар групплэж, давхардсан үнийг арилгах
      const groupedBatches = groupCargosByBatch(data.cargos);
      
      // Дахин тооцоолох - багц бүрээр 1 удаа
      const totalCargoPrice = groupedBatches.reduce((sum, batch) => {
        const basePrice = batch.is_manual_price ? 
          parseFloat(batch.manual_price || 0) : 
          parseFloat(batch.price || 0);
        return sum + basePrice;
      }, 0);
      
      const totalStorageFee = groupedBatches.reduce((sum, batch) => 
        sum + parseFloat(batch.storage_fee_amount || 0), 0
      );
      
      // Statistics шинэчлэх
      data.statistics = {
        ...data.statistics,
        total_cargo_price: totalCargoPrice,
        total_storage_fee: totalStorageFee,
        grand_total: totalCargoPrice + totalStorageFee
      };
      
      setContainerDetail(data);
      setSelectedContainer(container);
      await fetchChangeHistory(container.id);
      setShowDetailModal(true);
    }
  } catch (error) {
    console.error('Fetch detail error:', error);
    alert('Дэлгэрэнгүй мэдээлэл авахад алдаа гарлаа');
  } finally {
    setLoading(false);
  }
};

  const openCargoDetailModal = async (cargo) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/cargo-new/${cargo.id}`);
      if (response.data.success) {
        const cargoData = response.data.data;
        
        if (cargoData.images) {
          try {
            cargoData.images = JSON.parse(cargoData.images);
          } catch (e) {
            cargoData.images = [];
          }
        } else {
          cargoData.images = [];
        }
        
        cargoData.cargo_codes = response.data.batch_cargos?.map(b => b.cargo_code) || [cargoData.cargo_code];
        
        setSelectedCargo(cargoData);
        setShowCargoDetailModal(true);
        
        setTimeout(() => {
          if (cargoData.cargo_codes) {
            cargoData.cargo_codes.forEach((code, index) => {
              const barcodeElement = document.getElementById(`cargo-barcode-${index}`);
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
        }, 100);
      }
    } catch (error) {
      console.error('Cargo detail error:', error);
      alert('Ачааны дэлгэрэнгүй авахад алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewContainer({
      name: '',
      direction_id: '',
      container_type_id: '',
      road_info_id: '',
      departure_date: '',
      registration_date: new Date().toISOString().split('T')[0],
      arrival_date: '',
      description: ''
    });
    setFormErrors({});
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'open_registration': { class: 'badge-success', icon: FaBoxOpen, text: 'Нээлттэй бүртгэл' },
      'open_distribution': { class: 'badge-warning', icon: FaWarehouse, text: 'Нээлттэй тараалт' },
      'closed_full': { class: 'badge-danger', icon: FaBoxOpen, text: 'Дүүрсэн' },
      'closed_shipped': { class: 'badge-primary', icon: FaTruck, text: 'Замд гарсан' },
      'distributing': { class: 'badge-info', icon: FaShippingFast, text: 'Тараалт явагдаж байна' },
      'completed': { class: 'badge-secondary', icon: FaCheckCircle, text: 'Дууссан' }
    };
    const statusInfo = statusMap[status] || { class: 'badge-primary', icon: FaBoxOpen, text: status };
    const IconComponent = statusInfo.icon;
    
    return (
      <span className={`badge ${statusInfo.class} flex items-center space-x-1`}>
        <IconComponent className="w-3 h-3" />
        <span>{statusInfo.text}</span>
      </span>
    );
  };

  const getCargoStatusBadge = (status) => {
    const statusMap = {
      'registered': { class: 'badge-success', text: 'Бүртгэгдсэн' },
      'pending_distribution': { class: 'badge-warning', text: 'Тараагдаагүй' },
      'distributed': { class: 'badge-info', text: 'Тараагдсан' },
      'on_hold': { class: 'badge-danger', text: 'Саатсан' },
      'customs_processing': { class: 'badge-primary', text: 'Гааль дээр' }
    };
    const info = statusMap[status] || { class: 'badge-primary', text: status };
    return <span className={`badge ${info.class}`}>{info.text}</span>;
  };

  const truncateToCharacters = (text, maxLength = 24) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const formatCurrency = (amount, currencyCode = 'KRW') => {
    return `${parseFloat(amount || 0).toLocaleString()}${currencyCode}`;
  };

  const formatDate = (dateStr) => {
    return dateStr ? new Date(dateStr).toLocaleDateString('mn-MN', { 
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    }) : '-';
  };

  const groupCargosByBatch = (cargos) => {
    const batches = {};
    cargos.forEach(cargo => {
      const batchKey = cargo.batch_number || cargo.cargo_code;
      if (!batches[batchKey]) {
        batches[batchKey] = {
          ...cargo,
          cargoList: [cargo]
        };
      } else {
        batches[batchKey].cargoList.push(cargo);
      }
    });
    return Object.values(batches);
  };

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    const totalCargoPages = Math.ceil(groupCargosByBatch(containerDetail?.cargos || []).length / cargoPerPage);
    
    if (pageNum >= 1 && pageNum <= totalCargoPages) {
      setCargoPage(pageNum);
      setJumpToPage('');
    } else {
      alert(`1-${totalCargoPages} хүртэлх дугаар оруулна уу`);
    }
  };

  const getPaginatedCargos = () => {
    const groupedCargos = groupCargosByBatch(containerDetail?.cargos || []);
    const startIndex = (cargoPage - 1) * cargoPerPage;
    const endIndex = startIndex + cargoPerPage;
    return groupedCargos.slice(startIndex, endIndex);
  };

  const totalCargoPages = Math.ceil(groupCargosByBatch(containerDetail?.cargos || []).length / cargoPerPage);

  return (
    <div className="container-management min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Чингэлэг удирдлага</h1>
            <p className="text-sm text-gray-600">Чингэлэгийн бүртгэл, хяналт, удирдлага</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="custom-button flex items-center space-x-2 px-4 py-2"
          >
            <FaPlus className="w-4 h-4" />
            <span>Чингэлэг нэмэх</span>
          </button>
        </div>
      </div>

      {/* FILTERS - хуучнаар үлдээе */}
      <div className="filters-section mb-6 bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Чингэлэгийн код, нэр хайх..."
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
              <option value="open_registration">Нээлттэй бүртгэл</option>
              <option value="open_distribution">Нээлттэй тараалт</option>
              <option value="closed_full">Дүүрсэн</option>
              <option value="closed_shipped">Замд гарсан</option>
              <option value="distributing">Тараалт явагдаж байна</option>
              <option value="completed">Дууссан</option>
            </select>
          </div>

          <div className="relative">
            <select
              className="filter-input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Бүх төрөл</option>
              {containerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              className="filter-input"
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
            >
              <option value="all">Бүх чиглэл</option>
              {directions.map((dir) => (
                <option key={dir.id} value={dir.id}>
                  {dir.direction_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE - хуучнаар үлдээе */}
      <div className="table-container bg-white rounded-lg shadow overflow-hidden">
        <div className="table-header px-4 py-3 border-b">
          <h2 className="table-title">Чингэлэгийн жагсаалт</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="px-4 py-3">Код</th>
                <th className="px-4 py-3">Нэр</th>
                <th className="px-4 py-3">Чиглэл</th>
                <th className="px-4 py-3">Төрөл</th>
                <th className="px-4 py-3">Төлөв</th>
                <th className="px-4 py-3">Байршил</th>
                <th className="hidden sm:table-cell px-4 py-3">Хөдөлөх огноо</th>
                <th className="hidden md:table-cell px-4 py-3">Ачааны тоо</th>
                <th className="hidden md:table-cell px-4 py-3">Тараагдах огноо</th>
                <th className="px-4 py-3">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-8">
                    <div className="loading-spinner mx-auto"></div>
                    <p className="mt-2 text-gray-500">Ачааллаж байна...</p>
                  </td>
                </tr>
              ) : containers.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-gray-500">
                    Чингэлэг олдсонгүй
                  </td>
                </tr>
              ) : (
                containers.map((container) => (
                  <tr key={container.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <FaBarcode className="text-gray-400" />
                        <span>{container.container_code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium" title={container.name}>
                          {truncateToCharacters(container.name, 18)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{container.direction_name || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info">{container.type_name || '-'}</span>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(container.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 text-sm">
                        <FaMapMarkerAlt className="text-gray-400 w-3 h-3" />
                        <span>{container.road_name || 'Тодорхойгүй'}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm">
                      {container.departure_date ? (
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                          <span>{new Date(container.departure_date).toLocaleDateString('mn-MN')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <FaUsers className="w-3 h-3 text-gray-400" />
                        <span>{container.current_count || 0}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm">
                      {container.arrival_date ? (
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                          <span>{new Date(container.arrival_date).toLocaleDateString('mn-MN')}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button 
                          className="icon-button text-blue-600 hover:text-blue-800"
                          title="Дэлгэрэнгүй"
                          onClick={() => openDetailModal(container)}
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="icon-button text-green-600 hover:text-green-800"
                          title="Засах"
                          onClick={() => openEditModal(container)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="icon-button text-orange-600 hover:text-orange-800"
                          title="Төлөв өөрчлөх"
                          onClick={() => openStatusModal(container)}
                        >
                          <FaSyncAlt />
                        </button>
                        <button 
                          className="icon-button text-red-600 hover:text-red-800"
                          title="Устгах"
                          onClick={() => handleDeleteContainer(container.id)}
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
            Нийт {pagination.totalItems || containers.length} чингэлэг
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

{/* ========== ADD MODAL ========== */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaPlus className="w-5 h-5 mr-3 text-blue-600" />
                Шинэ чингэлэг нэмэх
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
            
            <div className="modal-body">
              <form onSubmit={handleAddContainer}>
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaTag className="inline w-4 h-4 mr-2 text-purple-600" />
                      Чингэлэгийн нэр
                    </label>
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Чингэлэгийн нэр оруулах..."
                      value={newContainer.name}
                      onChange={(e) => setNewContainer({...newContainer, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaTruck className="inline w-4 h-4 mr-2 text-blue-600" />
                      Чиглэл <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`custom-input ${formErrors.direction_id ? 'border-red-300 bg-red-50' : ''}`}
                      value={newContainer.direction_id}
                      onChange={(e) => {
                        setNewContainer({...newContainer, direction_id: e.target.value});
                        setFormErrors({...formErrors, direction_id: ''});
                      }}
                    >
                      <option value="">Чиглэл сонгох...</option>
                      {directions.map((dir) => (
                        <option key={dir.id} value={dir.id}>
                          {dir.direction_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.direction_id && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FaExclamationTriangle className="w-3 h-3 mr-1" />
                        {formErrors.direction_id}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaBox className="inline w-4 h-4 mr-2 text-green-600" />
                      Төрөл <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`custom-input ${formErrors.container_type_id ? 'border-red-300 bg-red-50' : ''}`}
                      value={newContainer.container_type_id}
                      onChange={(e) => {
                        setNewContainer({...newContainer, container_type_id: e.target.value});
                        setFormErrors({...formErrors, container_type_id: ''});
                      }}
                    >
                      <option value="">Төрөл сонгох...</option>
                      {containerTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.type_name} - {Number(type.price_per_kg).toLocaleString()}
                          {type.currency_code || '₩'}/кг, {Number(type.price_per_cbm).toLocaleString()}
                          {type.currency_code || '₩'}/м³
                        </option>
                      ))}
                    </select>
                    {formErrors.container_type_id && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <FaExclamationTriangle className="w-3 h-3 mr-1" />
                        {formErrors.container_type_id}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline w-4 h-4 mr-2 text-orange-600" />
                      Байршил
                    </label>
                    <select
                      className="custom-input"
                      value={newContainer.road_info_id}
                      onChange={(e) => setNewContainer({...newContainer, road_info_id: e.target.value})}
                    >
                      <option value="">Байршил сонгох...</option>
                      {roadInfo.map((road) => (
                        <option key={road.id} value={road.id}>
                          {road.road_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaCalendarAlt className="inline w-4 h-4 mr-2 text-purple-600" />
                        Бүртгэлийн огноо <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        className={`custom-input ${formErrors.registration_date ? 'border-red-300 bg-red-50' : ''}`}
                        value={newContainer.registration_date}
                        onChange={(e) => {
                          setNewContainer({...newContainer, registration_date: e.target.value});
                          setFormErrors({...formErrors, registration_date: ''});
                        }}
                      />
                      {formErrors.registration_date && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <FaExclamationTriangle className="w-3 h-3 mr-1" />
                          {formErrors.registration_date}
                        </p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaShippingFast className="inline w-4 h-4 mr-2 text-blue-600" />
                        Хөдөлөх огноо
                      </label>
                      <input
                        type="date"
                        className="custom-input"
                        value={newContainer.departure_date}
                        onChange={(e) => setNewContainer({...newContainer, departure_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaBoxOpen className="inline w-4 h-4 mr-2 text-green-600" />
                      Тараагдах огноо
                    </label>
                    <input
                      type="date"
                      className="custom-input"
                      value={newContainer.arrival_date}
                      onChange={(e) => setNewContainer({...newContainer, arrival_date: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaFileAlt className="inline w-4 h-4 mr-2 text-gray-600" />
                      Нэмэлт тайлбар
                    </label>
                    <textarea
                      className="custom-input"
                      rows="3"
                      placeholder="Нэмэлт тайлбар бичих..."
                      value={newContainer.description}
                      onChange={(e) => setNewContainer({...newContainer, description: e.target.value})}
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
                        Үүсгэж байна...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FaPlus className="w-4 h-4 mr-2" />
                        Үүсгэх
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========== EDIT MODAL ========== */}
      {showEditModal && selectedContainer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800 flex items-center">
                <FaEdit className="w-5 h-5 mr-3 text-green-600" />
                Чингэлэг засах
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedContainer(null);
                }}
                className="icon-button text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleEditContainer}>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="form-group mb-0">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Чиглэл</label>
                      <input
                        type="text"
                        className="custom-input bg-gray-100 cursor-not-allowed"
                        value={selectedContainer.direction_name || '-'}
                        disabled
                      />
                    </div>

                    <div className="form-group mb-0">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Төрөл</label>
                      <input
                        type="text"
                        className="custom-input bg-gray-100 cursor-not-allowed"
                        value={(() => {
                          const type = containerTypes.find(t => t.id == selectedContainer.container_type_id);
                          if (!type) return '';
                          return `${type.type_name} - ${Number(type.price_per_kg).toLocaleString()}${type.currency_code || '₩'}/кг, ${Number(type.price_per_cbm).toLocaleString()}${type.currency_code || '₩'}/м³`;
                        })()}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaTag className="inline w-4 h-4 mr-2 text-purple-600" />
                      Чингэлэгийн нэр
                    </label>
                    <input
                      type="text"
                      className="custom-input"
                      placeholder="Чингэлэгийн нэр оруулах..."
                      value={selectedContainer.name || ''}
                      onChange={(e) => setSelectedContainer({...selectedContainer, name: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline w-4 h-4 mr-2 text-orange-600" />
                      Байршил
                    </label>
                    <select
                      className="custom-input"
                      value={selectedContainer.road_info_id || ''}
                      onChange={(e) => setSelectedContainer({...selectedContainer, road_info_id: e.target.value})}
                    >
                      <option value="">Байршил сонгох...</option>
                      {roadInfo.map((road) => (
                        <option key={road.id} value={road.id}>
                          {road.road_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaShippingFast className="inline w-4 h-4 mr-2 text-blue-600" />
                        Хөдөлөх огноо
                      </label>
                      <input
                        type="date"
                        className="custom-input"
                        value={selectedContainer.departure_date ? 
                          (typeof selectedContainer.departure_date === 'string' && selectedContainer.departure_date.includes('T') ? 
                            selectedContainer.departure_date.split('T')[0] : 
                            selectedContainer.departure_date) : ''}
                        onChange={(e) => setSelectedContainer({...selectedContainer, departure_date: e.target.value})}
                      />
                    </div>

                    <div className="form-group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <FaBoxOpen className="inline w-4 h-4 mr-2 text-green-600" />
                        Тараагдах огноо
                      </label>
                      <input
                        type="date"
                        className="custom-input"
                        value={selectedContainer.arrival_date ? 
                          (typeof selectedContainer.arrival_date === 'string' && selectedContainer.arrival_date.includes('T') ? 
                            selectedContainer.arrival_date.split('T')[0] : 
                            selectedContainer.arrival_date) : ''}
                        onChange={(e) => setSelectedContainer({...selectedContainer, arrival_date: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <FaFileAlt className="inline w-4 h-4 mr-2 text-gray-600" />
                      Нэмэлт тайлбар
                    </label>
                    <textarea
                      className="custom-input"
                      rows="3"
                      placeholder="Нэмэлт тайлбар бичих..."
                      value={selectedContainer.description || ''}
                      onChange={(e) => setSelectedContainer({...selectedContainer, description: e.target.value})}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedContainer(null);
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
                        Шинэчилж байна...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <FaEdit className="w-4 h-4 mr-2" />
                        Шинэчлэх
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========== STATUS MODAL ========== */}
      {showStatusModal && selectedContainer && (
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
                    <strong>Одоогийн төлөв:</strong> {getStatusBadge(selectedContainer.status)}
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
                    <option value="open_registration">Нээлттэй бүртгэл</option>
                    <option value="open_distribution">Нээлттэй тараалт (Тараалт эхлүүлэх)</option>
                    <option value="closed_full">Дүүрсэн</option>
                    <option value="closed_shipped">Замд гарсан</option>
                    <option value="distributing">Тараалт явагдаж байна</option>
                    <option value="completed">Дууссан</option>
                  </select>
                </div>

                {newSelectedStatus === 'open_distribution' && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-yellow-500 mr-3 mt-1" />
                      <div className="text-sm text-yellow-700">
                        <p className="font-semibold mb-1">⚠️ Анхаар!</p>
                        <p>Тараалт эхлүүлэх үед:</p>
                        <ul className="list-disc ml-5 mt-2 space-y-1">
                          <li>Доторх бүх ачаа "Тараагдаагүй" төлөвт шилжинэ</li>
                          <li>7 хоногийн дараа хадгалалтын хөлс тооцогдож эхэлнэ</li>
                          <li>Энэ үйлдлийг буцаах боломжгүй</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setNewSelectedStatus('');
                }}
                className="custom-button-secondary"
              >
                Цуцлах
              </button>
              <button
                type="button"
                onClick={handleStatusChange}
                className="custom-button-success"
              >
                <div className="flex items-center">
                  <FaSyncAlt className="w-4 h-4 mr-2" />
                  {newSelectedStatus === 'open_distribution' ? 'Тараалт эхлүүлэх' : 'Шинэчлэх'}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DETAIL MODAL WITH CHANGE HISTORY & PAGINATION ========== */}
      {showDetailModal && selectedContainer && containerDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDetailModal(false);
              setSelectedContainer(null);
              setContainerDetail(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl" 
            style={{ width: '95vw', maxWidth: '1400px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            {/* HEADER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FaCube className="text-white text-2xl" />
                  <h3 className="text-2xl font-bold text-white">
                    {containerDetail.container.container_code}
                  </h3>
                  <div className="ml-3">{getStatusBadge(containerDetail.container.status)}</div>
                </div>
                <p className="text-blue-100 text-sm">
                  {containerDetail.container.name || 'Нэргүй чингэлэг'} • {containerDetail.container.direction_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedContainer(null);
                  setContainerDetail(null);
                }}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {/* STATISTICS CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaBox className="text-3xl text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ачааны тоо</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {containerDetail.statistics.total_cargo_count}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaMoneyBillWave className="text-3xl text-green-500" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ачааны төлбөр</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(containerDetail.statistics.total_cargo_price, containerDetail.statistics.currency_code)}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaWarehouse className="text-3xl text-orange-500" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Хадгалалтын хөлс</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(containerDetail.statistics.total_storage_fee, containerDetail.statistics.currency_code)}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <FaChartLine className="text-3xl text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Нийт төлбөр</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(containerDetail.statistics.grand_total, containerDetail.statistics.currency_code)}
                  </p>
                </div>
              </div>

              {/* CONTAINER INFO */}
              <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* LEFT: Container Info */}
                <div>
                  <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-blue-500" />
                    Чингэлэгийн мэдээлэл
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Чиглэл</p>
                      <p className="font-semibold text-gray-800">{containerDetail.container.direction_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Төрөл</p>
                      <p className="font-semibold text-gray-800">{containerDetail.container.type_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Байршил</p>
                      <p className="font-semibold text-gray-800">{containerDetail.container.road_name || 'Тодорхойгүй'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Хөдөлөх огноо</p>
                      <p className="font-semibold text-gray-800">
                        {containerDetail.container.departure_date ? 
                          new Date(containerDetail.container.departure_date).toLocaleDateString('mn-MN') : '-'}
                      </p>
                    </div>
                    {containerDetail.container.distribution_start_date && (
                      <div className="col-span-2">
                        <p className="text-orange-500 text-xs mb-1 flex items-center gap-1">
                          <FaClock className="w-3 h-3" />
                          Тараалт эхэлсэн
                        </p>
                        <p className="font-semibold text-orange-700">
                          {formatDate(containerDetail.container.distribution_start_date)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              {/* CHANGE HISTORY */}
              <div>
                <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaHistory className="text-purple-500" />
                  Өөрчлөлтийн түүх
                </h4>
                  <div className="max-h-48 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {changeHistory.length > 0 ? (
                      <div className="space-y-2">
                        {changeHistory.map((change) => (
                          <div key={change.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                            <FaUser className="text-gray-400 mt-0.5 flex-shrink-0 w-3 h-3" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-semibold text-gray-800 truncate">{change.changed_by}</span>
                                <span className="text-gray-500 text-[10px] whitespace-nowrap">
                                  {new Date(change.changed_at).toLocaleDateString('mn-MN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-gray-600 flex items-center gap-1 flex-wrap">
                                {change.old_status ? (
                                  <>
                                    <span className="text-[10px]">{getStatusBadge(change.old_status)}</span>
                                    <FaArrowRight className="w-2 h-2 text-gray-400" />
                                    <span className="text-[10px]">{getStatusBadge(change.new_status)}</span>
                                  </>
                                ) : (
                                  <span className="text-[10px]">{getStatusBadge(change.new_status)}</span>
                                )}
                              </div>
                              {change.notes && (
                                <p className="text-[10px] text-gray-500 mt-0.5 italic truncate">{change.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs text-center py-4">Түүх байхгүй</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              {/* CARGO LIST WITH PAGINATION */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center">
                  <h4 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <FaClipboardList className="text-blue-500" />
                    Ачааны жагсаалт ({groupCargosByBatch(containerDetail.cargos).length} багц)
                  </h4>
                  
                  {totalCargoPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Хуудас руу үсрэх:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalCargoPages}
                        value={jumpToPage}
                        onChange={(e) => setJumpToPage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleJumpToPage();
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder={cargoPage.toString()}
                      />
                      <button
                        onClick={handleJumpToPage}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                      >
                        Үсрэх
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <div className="min-w-[1200px]">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Багц код</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Илгээгч</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Хүлээн авагч</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Тоо</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Үнэ</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Хадгалалт</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Нийт</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Төлөв</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Үйлдэл</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getPaginatedCargos().map((batch, idx) => {
                          const basePrice = batch.is_manual_price ? 
                            parseFloat(batch.manual_price || 0) : 
                            parseFloat(batch.price || 0);
                          const storageFee = parseFloat(batch.storage_fee_amount || 0);
                          const totalWithStorage = basePrice + storageFee;

                          return (
                            <tr key={idx} className="hover:bg-blue-50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <FaBarcode className="text-gray-400 flex-shrink-0" />
                                  <span className="text-sm font-mono font-medium text-gray-800 whitespace-nowrap">
                                    {batch.batch_number || batch.cargo_code}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <p className="font-medium text-gray-900 whitespace-nowrap">{batch.sender_name}</p>
                                  {batch.sender_phone && (
                                    <p className="text-gray-500 text-xs flex items-center gap-1 whitespace-nowrap">
                                      <FaPhone className="w-2.5 h-2.5" />
                                      {batch.sender_phone}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <p className="font-medium text-gray-900 whitespace-nowrap">{batch.receiver_name}</p>
                                  {batch.receiver_phone && (
                                    <p className="text-gray-500 text-xs flex items-center gap-1 whitespace-nowrap">
                                      <FaPhone className="w-2.5 h-2.5" />
                                      {batch.receiver_phone}
                                    </p>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 whitespace-nowrap">
                                  {batch.total_pieces} ш
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold text-green-600 whitespace-nowrap">
                                  {formatCurrency(basePrice, containerDetail.statistics.currency_code)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {storageFee > 0 ? (
                                  <div className="text-sm">
                                    <span className="font-bold text-orange-600 whitespace-nowrap">
                                      {formatCurrency(storageFee, containerDetail.statistics.currency_code)}
                                    </span>
                                    <p className="text-xs text-gray-500 whitespace-nowrap">({batch.storage_days}ө)</p>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
                                  {formatCurrency(totalWithStorage, containerDetail.statistics.currency_code)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex justify-center">
                                  {getCargoStatusBadge(batch.status)}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => openCargoDetailModal(batch)}
                                  className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  title="Дэлгэрэнгүй"
                                >
                                  <FaEye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100 border-t-2 border-gray-300">
                        <tr className="font-bold">
                          <td colSpan="4" className="px-4 py-4 text-right text-sm text-gray-700">
                            НИЙТ ДҮН:
                          </td>
                          <td className="px-4 py-4 text-right text-sm">
                            <span className="text-green-600 whitespace-nowrap">
                              {formatCurrency(containerDetail.statistics.total_cargo_price, containerDetail.statistics.currency_code)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm">
                            <span className="text-orange-600 whitespace-nowrap">
                              {formatCurrency(containerDetail.statistics.total_storage_fee, containerDetail.statistics.currency_code)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right text-sm">
                            <span className="text-blue-600 text-base whitespace-nowrap">
                              {formatCurrency(containerDetail.statistics.grand_total, containerDetail.statistics.currency_code)}
                            </span>
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {totalCargoPages > 1 && (
                  <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {(cargoPage - 1) * cargoPerPage + 1} - {Math.min(cargoPage * cargoPerPage, groupCargosByBatch(containerDetail.cargos).length)} / {groupCargosByBatch(containerDetail.cargos).length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCargoPage(Math.max(1, cargoPage - 1))}
                        disabled={cargoPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaArrowLeft className="w-3 h-3" />
                      </button>
                      <span className="text-sm text-gray-600">
                        {cargoPage} / {totalCargoPages}
                      </span>
                      <button
                        onClick={() => setCargoPage(Math.min(totalCargoPages, cargoPage + 1))}
                        disabled={cargoPage === totalCargoPages}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="lg:hidden bg-blue-50 border-t border-blue-200 px-4 py-2 text-center">
                  <p className="text-xs text-blue-600 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Хажуу тийш гүйлгэж харна уу
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 bg-gray-100 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedContainer(null);
                  setContainerDetail(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 font-medium"
              >
                <FaTimes className="w-4 h-4" />
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== CARGO DETAIL MODAL ========== */}
      {showCargoDetailModal && selectedCargo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCargoDetailModal(false);
              setSelectedCargo(null);
            }
          }}
        >
          <div className="cargo-detail-modal">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-t-xl flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FaBox className="text-white text-2xl" />
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCargo.batch_number || selectedCargo.cargo_code}
                  </h3>
                </div>
                <p className="text-purple-100 text-sm">
                  {selectedCargo.cargo_name || 'Ачааны дэлгэрэнгүй мэдээлэл'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCargoDetailModal(false);
                  setSelectedCargo(null);
                }}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            <div className="cargo-detail-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaUsers className="mr-2 text-purple-500" />
                    Илгээгч
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Нэр:</span>
                      <span className="font-medium">{selectedCargo.sender_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Утас:</span>
                      <span className="font-medium">{selectedCargo.sender_phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Хаяг:</span>
                      <span className="font-medium text-right">{selectedCargo.sender_address || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaUsers className="mr-2 text-orange-500" />
                    Хүлээн авагч
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Нэр:</span>
                      <span className="font-medium">{selectedCargo.receiver_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Утас:</span>
                      <span className="font-medium">{selectedCargo.receiver_phone || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Хаяг:</span>
                      <span className="font-medium text-right">{selectedCargo.receiver_address || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaInfoCircle className="mr-2 text-blue-500" />
                  Ачааны мэдээлэл
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Төрөл</p>
                    <p className="font-medium mt-1">
                      {selectedCargo.cargo_type === 'weight' ? 'Жин' : 'Эзлэхүүн'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Жин/Эзлэхүүн</p>
                    <p className="font-medium mt-1">
                      {selectedCargo.cargo_type === 'weight' 
                        ? `${selectedCargo.weight_kg} кг`
                        : `${parseFloat(selectedCargo.volume_cbm || 0).toFixed(4)} м³`
                      }
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Тоо/Ширхэг</p>
                    <p className="font-medium mt-1">{selectedCargo.total_pieces}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-xs">Төлөв</p>
                    <div className="mt-1 flex justify-center">
                      {getCargoStatusBadge(selectedCargo.status)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-green-500" />
                  Төлбөрийн мэдээлэл
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-sm text-gray-600">Ачааны үнэ:</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(
                        selectedCargo.is_manual_price ? selectedCargo.manual_price : selectedCargo.price,
                        selectedCargo.price_currency_code || 'KRW'
                      )}
                    </span>
                  </div>
                  {selectedCargo.storage_fee_amount > 0 && (
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-sm text-gray-600">
                        Хадгалалтын хөлс ({selectedCargo.storage_days} өдөр):
                      </span>
                      <span className="text-lg font-semibold text-orange-600">
                        {formatCurrency(selectedCargo.storage_fee_amount, selectedCargo.price_currency_code || 'KRW')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-gray-800">Нийт дүн:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedCargo.total_with_storage, selectedCargo.price_currency_code || 'KRW')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedCargo.images && selectedCargo.images.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaImage className="mr-2 text-blue-500" />
                    Зургууд ({selectedCargo.images.length})
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedCargo.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={`${window.location.origin}${img}`}
                        alt={`Cargo ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedCargo.cargo_codes && selectedCargo.cargo_codes.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <FaBarcode className="mr-2 text-blue-500" />
                    Баркод ({selectedCargo.cargo_codes.length} ширхэг)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedCargo.cargo_codes.map((code, index) => (
                      <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        <p className="text-xs text-gray-500 mb-2">Ширхэг {index + 1}</p>
                        <div className="bg-white p-3 rounded mb-2 flex justify-center items-center min-h-[100px]">
                          <svg id={`cargo-barcode-${index}`}></svg>
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-800">{code}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-100 p-4 rounded-b-xl flex justify-end border-t">
              <button
                onClick={() => {
                  setShowCargoDetailModal(false);
                  setSelectedCargo(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContainerManagement;