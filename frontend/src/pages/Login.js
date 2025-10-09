import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axiosInstance from '../axios'; // withCredentials: true

const Login = () => {
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await axiosInstance.post('/login', data);
      
      if (res.data.role === 'system_admin') {
        // Admin бол dashboard руу чиглүүлэх – шинэчилсэн: /admin/dashboard руу шилжүүл
        navigate('/admin/dashboard');
      } else {
        // Бусад хэрэглэгч бол user dashboard
        alert('User dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Жимгүн Карго" 
              className="h-24 w-24 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div 
              className="text-4xl text-blue-600 hidden"
              style={{ display: 'none' }}
            >
              🚛
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Жимгүн Карго Админ
            {/* Карго админ панел */}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Админ панелд нэвтрэх
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Хэрэглэгчийн нэр
              </label>
              <input
                {...register('username', { required: true })}
                id="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Хэрэглэгчийн нэр"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Нууц үг
              </label>
              <input
                {...register('password', { required: true })}
                id="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Нууц үг"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Нэвтэрч байна...
                </div>
              ) : (
                'Нэвтрэх'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;