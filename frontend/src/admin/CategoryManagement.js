//frontend/src/admin/CategoryManagement.js
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaRoad, FaDirections, 
  FaBox, FaDollarSign, FaSave, FaTimes, FaTags, FaWarehouse,
  FaMoneyBillWave, FaMapMarkerAlt, FaGlobe
} from 'react-icons/fa';
import axiosInstance from '../axios';
import '../styles/admin.css';
import '../styles/custom.css';

const CategoryManagement = () => {
  const [activeTab, setActiveTab] = useState('directions');
  const [loading, setLoading] = useState(false);
  
  const [directions, setDirections] = useState([]);
  const [roadInfo, setRoadInfo] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [storageFees, setStorageFees] = useState([]);
  const [currencies, setCurrencies] = useState([]); 
  const [paymentLocations, setPaymentLocations] = useState([]); 
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [editingItem, setEditingItem] = useState(null);
  
  const [directionForm, setDirectionForm] = useState({
    direction_name: '',
    direction_code: '',
    from_location: '',
    to_location: '',
    description: ''
  });
  
  const [roadForm, setRoadForm] = useState({
    road_name: '',
    location: '',
    description: ''
  });
  
  const [typeForm, setTypeForm] = useState({
    type_name: '',
    type_code: '',
    description: '',
    price_per_kg: '',
    price_per_cbm: '',
    currency_id: '' 
  });
  
  const [statusForm, setStatusForm] = useState({
    status_code: '',
    status_name: '',
    description: ''
  });

  const [storageForm, setStorageForm] = useState({
    fee_name: '',
    price_per_day: '',
    unit_type: 'per_piece',
    currency_id: '', 
    description: ''
  });

  const [currencyForm, setCurrencyForm] = useState({
    currency_code: '',
    currency_name: '',
    symbol: '',
    is_default: false,
    description: ''
  });

  const [paymentLocationForm, setPaymentLocationForm] = useState({
  location_name: '',
  location_code: '',
  currency_id: '',
  description: ''
});
  
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    fetchCurrencies();
  }, []);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      switch(activeTab) {
        case 'directions':
          const dirRes = await axiosInstance.get('/api/directions');
          setDirections(dirRes.data.data);
          break;
        case 'road':
          const roadRes = await axiosInstance.get('/api/road-info');
          setRoadInfo(roadRes.data.data);
          break;
        case 'types':
          const typeRes = await axiosInstance.get('/api/container-types');
          setContainerTypes(typeRes.data.data);
          break;
        case 'statuses':
          const statusRes = await axiosInstance.get('/api/container-statuses');
          setStatuses(statusRes.data.data);
          break;
        case 'storage':
          const storageRes = await axiosInstance.get('/api/storage-fees');
          setStorageFees(storageRes.data.data);
          break;
        case 'currencies': 
          await fetchCurrencies();
          break;
        case 'payment_locations': 
          const locRes = await axiosInstance.get('/api/payment-locations');
          setPaymentLocations(locRes.data.data);
          break;
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await axiosInstance.get('/api/payment-currencies');
      setCurrencies(res.data.data);
    } catch (error) {
      console.error('Fetch currencies error:', error);
    }
  };
  
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (item) {
      switch(type) {
        case 'direction':
          setDirectionForm({
            direction_name: item.direction_name || '',
            direction_code: item.direction_code || '',
            from_location: item.from_location,
            to_location: item.to_location,
            description: item.description || ''
          });
          break;
        case 'road':
          setRoadForm({
            road_name: item.road_name,
            location: item.location || '',
            description: item.description || ''
          });
          break;
        case 'type':
          setTypeForm({
            type_name: item.type_name,
            type_code: item.type_code,
            description: item.description || '',
            price_per_kg: item.price_per_kg,
            price_per_cbm: item.price_per_cbm,
            currency_id: item.currency_id || '' 
          });
          break;
        case 'status':
          setStatusForm({
            status_code: item.status_code,
            status_name: item.status_name,
            description: item.description || ''
          });
          break;
        case 'storage':
          setStorageForm({
            fee_name: item.fee_name,
            price_per_day: item.price_per_day,
            unit_type: item.unit_type,
            currency_id: item.currency_id || '', 
            description: item.description || ''
          });
          break;
        case 'currency': 
          setCurrencyForm({
            currency_code: item.currency_code,
            currency_name: item.currency_name,
            symbol: item.symbol,
            is_default: item.is_default,
            description: item.description || ''
          });
          break;
        case 'payment_location':
          setPaymentLocationForm({
            location_name: item.location_name,
            location_code: item.location_code || '',
            currency_id: item.currency_id,
            description: item.description || ''
          });
          break;
      }
    } else {
      setDirectionForm({ direction_name: '', direction_code: '', from_location: '', to_location: '', description: '' });
      setRoadForm({ road_name: '', location: '', description: '' });
      setTypeForm({ type_name: '', type_code: '', description: '', price_per_kg: '', price_per_cbm: '', currency_id: '' });
      setStatusForm({ status_code: '', status_name: '', description: '' });
      setStorageForm({ fee_name: '', price_per_day: '', unit_type: 'per_piece', currency_id: '', description: '' });
      setCurrencyForm({ currency_code: '', currency_name: '', symbol: '', is_default: false, description: '' });
      setPaymentLocationForm({ location_name: '', location_code: '', currency_id: '', description: '' });
    }
    
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setModalType('');
  };
  
  const saveDirection = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/directions/${editingItem.id}`, directionForm);
        alert('Чиглэл амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/directions', directionForm);
        alert('Чиглэл амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };
  
  const saveRoad = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/road-info/${editingItem.id}`, roadForm);
        alert('Замын мэдээлэл амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/road-info', roadForm);
        alert('Замын мэдээлэл амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };
  
  const saveType = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/container-types/${editingItem.id}`, typeForm);
        alert('Төрөл амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/container-types', typeForm);
        alert('Төрөл амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };
  
  const saveStatus = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/container-statuses/${editingItem.id}`, statusForm);
        alert('Төлөв амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/container-statuses', statusForm);
        alert('Төлөв амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };

  const saveStorageFee = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/storage-fees/${editingItem.id}`, storageForm);
        alert('Хадгалалтын үнэ амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/storage-fees', storageForm);
        alert('Хадгалалтын үнэ амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
      fetchCurrencies(); 
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };

  const saveCurrency = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/payment-currencies/${editingItem.id}`, currencyForm);
        alert('Валют амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/payment-currencies', currencyForm);
        alert('Валют амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
      fetchCurrencies();
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };

  const savePaymentLocation = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axiosInstance.put(`/api/payment-locations/${editingItem.id}`, paymentLocationForm);
        alert('Байршил амжилттай шинэчлэгдлээ');
      } else {
        await axiosInstance.post('/api/payment-locations', paymentLocationForm);
        alert('Байршил амжилттай нэмэгдлээ');
      }
      closeModal();
      fetchData();
    } catch (error) {
      alert('Алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };
  
  const deleteItem = async (type, id) => {
    if (!window.confirm('Устгахдаа итгэлтэй байна уу?')) return;
    
    try {
      switch(type) {
        case 'direction':
          await axiosInstance.delete(`/api/directions/${id}`);
          break;
        case 'road':
          await axiosInstance.delete(`/api/road-info/${id}`);
          break;
        case 'type':
          await axiosInstance.delete(`/api/container-types/${id}`);
          break;
        case 'status':
          await axiosInstance.delete(`/api/container-statuses/${id}`);
          break;
        case 'storage':
          await axiosInstance.delete(`/api/storage-fees/${id}`);
          break;
        case 'currency': 
          await axiosInstance.delete(`/api/payment-currencies/${id}`);
          fetchCurrencies();
          break;
        case 'payment_location': 
          await axiosInstance.delete(`/api/payment-locations/${id}`);
          break;
      }
      alert('Амжилттай устгагдлаа');
      fetchData();
    } catch (error) {
      alert('Устгахад алдаа гарлаа: ' + error.response?.data?.msg);
    }
  };

  const getUnitTypeLabel = (unitType) => {
    const map = {
      'per_piece': 'Ширхэг',
      'per_kg': 'Кг',
      'per_cbm': 'М³'
    };
    return map[unitType] || unitType;
  };

  const getCurrencyLabel = (currencyId) => {
    const currency = currencies.find(c => c.id == currencyId);
    return currency ? `${currency.currency_code} ${currency.currency_name}` : '-';
  };
  
  return (
    <div className="category-management p-4 md:p-6">
      <div className="page-header mb-6">
        <h1 className="text-2xl font-bold">Ангилал удирдлага</h1>
        <p className="text-gray-600">Чиглэл, замын мэдээлэл, төрөл, төлөв, хадгалалтын үнэ, валют, төлбөрийн байршил удирдлага</p>
      </div>
      
      <div className="tabs-container mb-6">
        <div className="overflow-x-auto">
          <div className="flex space-x-1 border-b whitespace-nowrap">
            <button
              className={`tab-button ${activeTab === 'directions' ? 'active' : ''}`}
              onClick={() => setActiveTab('directions')}
            >
              <FaDirections className="mr-2" />
              Чиглэл
            </button>
            <button
              className={`tab-button ${activeTab === 'road' ? 'active' : ''}`}
              onClick={() => setActiveTab('road')}
            >
              <FaRoad className="mr-2" />
              Замын мэдээлэл
            </button>
            <button
              className={`tab-button ${activeTab === 'types' ? 'active' : ''}`}
              onClick={() => setActiveTab('types')}
            >
              <FaBox className="mr-2" />
              Чингэлэгийн төрөл
            </button>
            <button
              className={`tab-button ${activeTab === 'statuses' ? 'active' : ''}`}
              onClick={() => setActiveTab('statuses')}
            >
              <FaTags className="mr-2" />
              Төлөв
            </button>
            <button
              className={`tab-button ${activeTab === 'storage' ? 'active' : ''}`}
              onClick={() => setActiveTab('storage')}
            >
              <FaWarehouse className="mr-2" />
              Хадгалах үнэ
            </button>
            <button
              className={`tab-button ${activeTab === 'currencies' ? 'active' : ''}`}
              onClick={() => setActiveTab('currencies')}
            >
              <FaMoneyBillWave className="mr-2" />
              Төлбөрийн нэгж
            </button>
            <button
              className={`tab-button ${activeTab === 'payment_locations' ? 'active' : ''}`}
              onClick={() => setActiveTab('payment_locations')}
            >
              <FaMapMarkerAlt className="mr-2" />
              Төлбөрийн байршил
            </button>
          </div>
        </div>
      </div>
      
      <div className="tab-content bg-white rounded-lg shadow p-4 md:p-6">
        {activeTab === 'directions' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Чиглэлийн жагсаалт</h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('direction')}
              >
                <FaPlus className="mr-2" /> Чиглэл нэмэх
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Чиглэлийн нэр</th>
                    <th>Хаанаас</th>
                    <th>Хаашаа</th>
                    <th>Код</th>
                    <th>Огноо</th>
                    <th>Тайлбар</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {directions.map(item => (
                    <tr key={item.id}>
                      <td className="whitespace-normal break-words">{item.direction_name || '-'}</td>
                      <td className="whitespace-normal break-words">{item.from_location}</td>
                      <td className="whitespace-normal break-words">{item.to_location}</td>
                      <td><span className="badge badge-primary">{item.direction_code || '-'}</span></td>
                      <td className="whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('direction', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('direction', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {activeTab === 'road' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Замын мэдээллийн жагсаалт</h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('road')}
              >
                <FaPlus className="mr-2" /> Замын мэдээлэл нэмэх
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Замын нэр</th>
                    <th>Байршил</th>
                    <th>Огноо</th>
                    <th>Тайлбар</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {roadInfo.map(item => (
                    <tr key={item.id}>
                      <td className="whitespace-normal break-words">{item.road_name}</td>
                      <td className="whitespace-normal break-words">{item.location || '-'}</td>
                      <td className="whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('road', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('road', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {activeTab === 'types' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Чингэлэгийн төрлүүд</h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('type')}
              >
                <FaPlus className="mr-2" /> Төрөл нэмэх
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Төрлийн нэр</th>
                    <th>Код</th>
                    <th>1кг үнэ</th>
                    <th>1куб үнэ</th>
                    <th>Валют</th>
                    <th>Тайлбар</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {containerTypes.map(item => (
                    <tr key={item.id}>
                      <td className="whitespace-normal break-words">{item.type_name}</td>
                      <td><span className="badge badge-success">{item.type_code}</span></td>
                      <td className="whitespace-nowrap">{Number(item.price_per_kg).toLocaleString()}</td>
                      <td className="whitespace-nowrap">{Number(item.price_per_cbm).toLocaleString()}</td>
                      <td><span className="badge badge-info">{getCurrencyLabel(item.currency_id)}</span></td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('type', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('type', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'statuses' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Төлөвийн жагсаалт</h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('status')}
              >
                <FaPlus className="mr-2" /> Төлөв нэмэх
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Төлөвийн код</th>
                    <th>Төлөвийн нэр</th>
                    <th>Тайлбар</th>
                    <th>Огноо</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {statuses.map(item => (
                    <tr key={item.id}>
                      <td><span className="badge badge-primary">{item.status_code}</span></td>
                      <td className="whitespace-normal break-words">{item.status_name}</td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('status', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('status', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'storage' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold">Хадгалалтын үнийн жагсаалт</h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('storage')}
              >
                <FaPlus className="mr-2" /> Хадгалах үнэ нэмэх
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Үнийн нэр</th>
                    <th>Өдрийн үнэ</th>
                    <th>Валют</th>
                    <th>Тооцох нэгж</th>
                    <th>Тайлбар</th>
                    <th>Огноо</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {storageFees.map(item => (
                    <tr key={item.id}>
                      <td className="whitespace-normal break-words font-medium">{item.fee_name}</td>
                      <td className="whitespace-nowrap">
                        <span className="text-green-600 font-semibold">
                          {Number(item.price_per_day).toLocaleString()}
                        </span>
                      </td>
                      <td><span className="badge badge-info">{getCurrencyLabel(item.currency_id)}</span></td>
                      <td>
                        <span className="badge badge-info">
                          {getUnitTypeLabel(item.unit_type)}
                        </span>
                      </td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('storage', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('storage', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'currencies' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FaGlobe className="mr-2 text-blue-600" />
                Төлбөрийн нэгж (Валют)
              </h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('currency')}
              >
                <FaPlus className="mr-2" /> Валют нэмэх
              </button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Анхаар:</strong> Энд зөвхөн мөнгөний нэгж (валют) сонгоно. Ханшийн тооцоолол хийхгүй. 
                Аль улсаас ачаа ачуулж байгаагаас хамааран төлбөр тооцох нэгжийг сонгоно уу.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Валютын код</th>
                    <th>Валютын нэр</th>
                    <th>Тэмдэг</th>
                    <th>Үндсэн валют</th>
                    <th>Тайлбар</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {currencies.map(item => (
                    <tr key={item.id}>
                      <td><span className="badge badge-primary font-mono">{item.currency_code}</span></td>
                      <td className="whitespace-normal break-words font-medium">{item.currency_name}</td>
                      <td className="text-2xl">{item.symbol}</td>
                      <td>
                        {item.is_default ? (
                          <span className="badge badge-success">Үндсэн</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('currency', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('currency', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'payment_locations' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FaMapMarkerAlt className="mr-2 text-orange-600" />
                Төлбөрийн байршил
              </h2>
              <button 
                className="custom-button w-full sm:w-auto"
                onClick={() => openModal('payment_location')}
              >
                <FaPlus className="mr-2" /> Байршил нэмэх
              </button>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg mb-4 border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>Тайлбар:</strong> Төлбөр хүлээн авах газар, байршил болон тухайн байршилд ямар валютаар төлбөр хийхийг тодорхойлно уу.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Байршлын нэр</th>
                    <th>Код</th>
                    <th>Төлбөрийн нэгж</th>
                    <th>Тайлбар</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentLocations.map(item => (
                    <tr key={item.id}>
                      <td className="whitespace-normal break-words font-medium">{item.location_name}</td>
                      <td><span className="badge badge-primary">{item.location_code || '-'}</span></td>
                      <td>
                        <span className="badge badge-success">
                          {item.currency_code} {item.currency_name}
                        </span>
                      </td>
                      <td className="whitespace-normal break-words">{item.description || '-'}</td>
                      <td className="whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button 
                            className="icon-button text-blue-600"
                            onClick={() => openModal('payment_location', item)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="icon-button text-red-600"
                            onClick={() => deleteItem('payment_location', item.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      
      {showModal && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-6 max-h-[90vh] overflow-y-auto">
            {modalType === 'direction' && (
              <form onSubmit={saveDirection}>
                <div className="modal-header flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{editingItem ? 'Чиглэл засах' : 'Чиглэл нэмэх'}</h3>
                  <button type="button" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="modal-body space-y-4">
                  <div className="form-group">
                    <label>Чиглэлийн нэр</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={directionForm.direction_name}
                      onChange={(e) => setDirectionForm({...directionForm, direction_name: e.target.value})}
                      placeholder="Сөүл-Улаанбаатар гэх мэт"
                    />
                  </div>
                  <div className="form-group">
                    <label>Чиглэлийн код</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={directionForm.direction_code}
                      onChange={(e) => setDirectionForm({...directionForm, direction_code: e.target.value})}
                      required
                      placeholder="Гараас оруул (жишээ: su, us)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Хаанаас</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={directionForm.from_location}
                      onChange={(e) => setDirectionForm({...directionForm, from_location: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Хаашаа</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={directionForm.to_location}
                      onChange={(e) => setDirectionForm({...directionForm, to_location: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Тайлбар</label>
                    <textarea
                      className="custom-input w-full"
                      value={directionForm.description}
                      onChange={(e) => setDirectionForm({...directionForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                    Цуцлах
                  </button>
                  <button type="submit" className="custom-button w-full sm:w-auto">
                    <FaSave className="mr-2" /> Хадгалах
                  </button>
                </div>
              </form>
            )}
            
            {modalType === 'road' && (
              <form onSubmit={saveRoad}>
                <div className="modal-header flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{editingItem ? 'Замын мэдээлэл засах' : 'Замын мэдээлэл нэмэх'}</h3>
                  <button type="button" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="modal-body space-y-4">
                  <div className="form-group">
                    <label>Замын нэр</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={roadForm.road_name}
                      onChange={(e) => setRoadForm({...roadForm, road_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Байршил</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={roadForm.location}
                      onChange={(e) => setRoadForm({...roadForm, location: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Тайлбар</label>
                    <textarea
                      className="custom-input w-full"
                      value={roadForm.description}
                      onChange={(e) => setRoadForm({...roadForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                    Цуцлах
                  </button>
                  <button type="submit" className="custom-button w-full sm:w-auto">
                    <FaSave className="mr-2" /> Хадгалах
                  </button>
                </div>
              </form>
            )}
            
            {modalType === 'type' && (
              <form onSubmit={saveType}>
                <div className="modal-header flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{editingItem ? 'Төрөл засах' : 'Төрөл нэмэх'}</h3>
                  <button type="button" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="modal-body space-y-4">
                  <div className="form-group">
                    <label>Төрлийн нэр</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={typeForm.type_name}
                      onChange={(e) => setTypeForm({...typeForm, type_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Төрлийн код</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={typeForm.type_code}
                      onChange={(e) => setTypeForm({...typeForm, type_code: e.target.value})}
                      required
                      placeholder="exp, s, e гэх мэт"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="flex items-center">
                      <FaMoneyBillWave className="mr-2 text-green-600" />
                      Төлбөрийн нэгж
                    </label>
                    <select
                      className="custom-input w-full"
                      value={typeForm.currency_id}
                      onChange={(e) => setTypeForm({...typeForm, currency_id: e.target.value})}
                    >
                      <option value="">Валют сонгох...</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.currency_code} {curr.currency_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Энэ төрлийн чингэлэгт үнийг аль валютаар тооцохыг сонгоно уу
                    </p>
                  </div>

                  <div className="form-group">
                    <label>1 кг ачааны үнэ</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={typeForm.price_per_kg}
                      onChange={(e) => setTypeForm({...typeForm, price_per_kg: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>1 куб ачааны үнэ</label>
                    <input
                      type="number"
                      className="custom-input w-full"
                      value={typeForm.price_per_cbm}
                      onChange={(e) => setTypeForm({...typeForm, price_per_cbm: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Тайлбар</label>
                    <textarea
                      className="custom-input w-full"
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({...typeForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                    Цуцлах
                  </button>
                  <button type="submit" className="custom-button w-full sm:w-auto">
                    <FaSave className="mr-2" /> Хадгалах
                  </button>
                </div>
              </form>
            )}

            {modalType === 'status' && (
              <form onSubmit={saveStatus}>
                <div className="modal-header flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{editingItem ? 'Төлөв засах' : 'Төлөв нэмэх'}</h3>
                  <button type="button" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="modal-body space-y-4">
                  <div className="form-group">
                    <label>Төлөвийн код</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={statusForm.status_code}
                      onChange={(e) => setStatusForm({...statusForm, status_code: e.target.value})}
                      required
                      placeholder="open_registration гэх мэт"
                    />
                  </div>
                  <div className="form-group">
                    <label>Төлөвийн нэр</label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={statusForm.status_name}
                      onChange={(e) => setStatusForm({...statusForm, status_name: e.target.value})}
                      required
                      placeholder="Нээлттэй бүртгэл гэх мэт"
                    />
                  </div>
                  <div className="form-group">
                    <label>Тайлбар</label>
                    <textarea
                      className="custom-input w-full"
                      value={statusForm.description}
                      onChange={(e) => setStatusForm({...statusForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>
                </div>
                <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                    Цуцлах
                  </button>
                  <button type="submit" className="custom-button w-full sm:w-auto">
                    <FaSave className="mr-2" /> Хадгалах
                  </button>
                </div>
              </form>
            )}

            {modalType === 'storage' && (
              <form onSubmit={saveStorageFee}>
                <div className="modal-header flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <FaWarehouse className="mr-2 text-blue-600" />
                    {editingItem ? 'Хадгалах үнэ засах' : 'Хадгалах үнэ нэмэх'}
                  </h3>
                  <button type="button" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="modal-body space-y-4">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Анхааруулга:</strong> Чингэлэг тараасны 7 хоногийн дараа хадгалалтын хөлс тооцогдоно
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="flex items-center">
                      <FaDollarSign className="mr-2 text-gray-600" />
                      Үнийн нэр <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={storageForm.fee_name}
                      onChange={(e) => setStorageForm({...storageForm, fee_name: e.target.value})}
                      required
                      placeholder="Жишээ: Стандарт хадгалалт, Хүнд ачаа хадгалалт"
                    />
                  </div>

                  <div className="form-group">
                    <label className="flex items-center">
                      <FaMoneyBillWave className="mr-2 text-green-600" />
                      Төлбөрийн нэгж
                    </label>
                    <select
                      className="custom-input w-full"
                      value={storageForm.currency_id}
                      onChange={(e) => setStorageForm({...storageForm, currency_id: e.target.value})}
                    >
                      <option value="">Валют сонгох...</option>
                      {currencies.map((curr) => (
                        <option key={curr.id} value={curr.id}>
                          {curr.currency_code} {curr.currency_name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Хадгалалтын хөлсийг аль валютаар тооцохыг сонгоно уу
                    </p>
                  </div>

                  <div className="form-group">
                    <label>
                      Тооцох нэгж <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="custom-input w-full"
                      value={storageForm.unit_type}
                      onChange={(e) => setStorageForm({...storageForm, unit_type: e.target.value})}
                      required
                    >
                      <option value="per_piece">Ширхэгээр тооцох</option>
                      <option value="per_kg">Кг-аар тооцох</option>
                      <option value="per_cbm">М³-ээр тооцох</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {storageForm.unit_type === 'per_piece' && '• Ачааны ширхэг тоогоор тооцно'}
                      {storageForm.unit_type === 'per_kg' && '• Ачааны жингээр тооцно (кг)'}
                      {storageForm.unit_type === 'per_cbm' && '• Ачааны эзлэхүүнээр тооцно (м³)'}
                    </p>
                  </div>

                  <div className="form-group">
                    <label>
                      Өдрийн үнэ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="custom-input w-full"
                      value={storageForm.price_per_day}
                      onChange={(e) => setStorageForm({...storageForm, price_per_day: e.target.value})}
                      required
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Нэг {storageForm.unit_type === 'per_piece' ? 'ширхэг' : storageForm.unit_type === 'per_kg' ? 'кг' : 'м³'}-ийн нэг өдрийн үнэ
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Тайлбар</label>
                    <textarea
                      className="custom-input w-full"
                      value={storageForm.description}
                      onChange={(e) => setStorageForm({...storageForm, description: e.target.value})}
                      rows="3"
                      placeholder="Хадгалалтын нөхцөл, онцлог гэх мэт..."
                    />
                  </div>

                  {storageForm.price_per_day && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-sm font-semibold text-green-800 mb-2">Тооцооны жишээ:</p>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• 10 хоног хадгалсан: {(parseFloat(storageForm.price_per_day) * 3).toLocaleString()} (3 өдрийн хөлс)</li>
                        <li>• 30 хоног хадгалсан: {(parseFloat(storageForm.price_per_day) * 23).toLocaleString()} (23 өдрийн хөлс)</li>
                        <li className="text-xs text-green-600 mt-2">* Эхний 7 хоног үнэгүй</li>
                      </ul>
                    </div>
                  )}
                </div>
                <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                    <FaTimes className="mr-2" /> Цуцлах
                  </button>
                  <button type="submit" className="custom-button w-full sm:w-auto">
                    <FaSave className="mr-2" /> Хадгалах
                  </button>
                </div>
              </form>
            )}

            {modalType === 'currency' && (
              <form onSubmit={saveCurrency}>
                <div className="modal-header flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <FaGlobe className="mr-2 text-blue-600" />
                    {editingItem ? 'Валют засах' : 'Валют нэмэх'}
                  </h3>
                  <button type="button" onClick={closeModal}>
                    <FaTimes />
                  </button>
                </div>
                <div className="modal-body space-y-4">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Анхаар:</strong> Зөвхөн мөнгөний нэгж сонгоно. Ханшийн тооцоолол хийхгүй.
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Валютын код <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      maxLength="3"
                      className="custom-input w-full"
                      value={currencyForm.currency_code}
                      onChange={(e) => setCurrencyForm({...currencyForm, currency_code: e.target.value})}
                      required
                      placeholder="USD, KRW, MNT"
                    />
                  </div>

                  <div className="form-group">
                    <label>Валютын нэр <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="custom-input w-full"
                      value={currencyForm.currency_name}
                      onChange={(e) => setCurrencyForm({...currencyForm, currency_name: e.target.value})}
                      required
                      placeholder="Америк доллар, Солонгосын вон"
                    />
                  </div>

                  <div className="form-group">
                    <label>Тэмдэг <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="custom-input w-full text-2xl"
                      value={currencyForm.symbol}
                      onChange={(e) => setCurrencyForm({...currencyForm, symbol: e.target.value})}
                      required
                      placeholder="$, ₩, ₮, ¥"
                    />
                  </div>

                  <div className="form-group">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={currencyForm.is_default}
                        onChange={(e) => setCurrencyForm({...currencyForm, is_default: e.target.checked})}
                      />
                      <span>Үндсэн валют болгох</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Системд нэг үндсэн валют байх ёстой
                    </p>
                  </div>

                  <div className="form-group">
                    <label>Тайлбар</label>
                    <textarea
                      className="custom-input w-full"
                      value={currencyForm.description}
                      onChange={(e) => setCurrencyForm({...currencyForm, description: e.target.value})}
                      rows="3"
                      placeholder="Хаана ашиглах, юунд зориулсан гэх мэт..."
                    />
                  </div>
                </div>
                <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                    <FaTimes className="mr-2" /> Цуцлах
                  </button>
                  <button type="submit" className="custom-button w-full sm:w-auto">
                    <FaSave className="mr-2" /> Хадгалах
                  </button>
                </div>
              </form>
            )}

            {modalType === 'payment_location' && (
                <form onSubmit={savePaymentLocation}>
                  <div className="modal-header flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-orange-600" />
                      {editingItem ? 'Байршил засах' : 'Байршил нэмэх'}
                    </h3>
                    <button type="button" onClick={closeModal}>
                      <FaTimes />
                    </button>
                  </div>
                  <div className="modal-body space-y-4">
                    <div className="bg-orange-50 p-3 rounded border border-orange-200 mb-4">
                      <p className="text-sm text-orange-800">
                        <strong>Тайлбар:</strong> Төлбөр хүлээн авах газар, байршил тодорхойлно уу
                      </p>
                    </div>

                    <div className="form-group">
                      <label>Байршлын нэр <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        className="custom-input w-full"
                        value={paymentLocationForm.location_name}
                        onChange={(e) => setPaymentLocationForm({...paymentLocationForm, location_name: e.target.value})}
                        required
                        placeholder="Сөүл агуулах, Улаанбаатар агуулах"
                      />
                    </div>

                    <div className="form-group">
                      <label>Байршлын код</label>
                      <input
                        type="text"
                        className="custom-input w-full"
                        value={paymentLocationForm.location_code}
                        onChange={(e) => setPaymentLocationForm({...paymentLocationForm, location_code: e.target.value})}
                        placeholder="SEL, UB гэх мэт"
                      />
                    </div>

                    <div className="form-group">
                      <label>Төлбөрийн нэгж <span className="text-red-500">*</span></label>
                      <select
                        className="custom-input w-full"
                        value={paymentLocationForm.currency_id}
                        onChange={(e) => setPaymentLocationForm({...paymentLocationForm, currency_id: e.target.value})}
                        required
                      >
                        <option value="">Валют сонгох...</option>
                        {currencies.map((curr) => (
                          <option key={curr.id} value={curr.id}>
                            {curr.currency_code} {curr.currency_name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Энэ байршилд аль валютаар төлбөр хийхийг сонгоно уу
                      </p>
                    </div>

                    <div className="form-group">
                      <label>Тайлбар</label>
                      <textarea
                        className="custom-input w-full"
                        value={paymentLocationForm.description}
                        onChange={(e) => setPaymentLocationForm({...paymentLocationForm, description: e.target.value})}
                        rows="3"
                        placeholder="Нэмэлт тайлбар..."
                      />
                    </div>
                  </div>
                  <div className="modal-footer flex flex-col sm:flex-row justify-end gap-2 mt-6">
                    <button type="button" className="custom-button-secondary w-full sm:w-auto" onClick={closeModal}>
                      <FaTimes className="mr-2" /> Цуцлах
                    </button>
                    <button type="submit" className="custom-button w-full sm:w-auto">
                      <FaSave className="mr-2" /> Хадгалах
                    </button>
                  </div>
                </form>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;