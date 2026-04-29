import axios from 'axios';

const API_BASE_URL = 'http://localhost:8004/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// User APIs
export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getByUsername: (username) => api.get(`/users/username/${username}`),
  create: (user) => api.post('/users', user),
  update: (id, user) => api.put(`/users/${id}`, user),
  recharge: (id, amount) => api.post(`/users/${id}/recharge?amount=${amount}`),
  toggleBlacklist: (id) => api.post(`/users/${id}/toggle-blacklist`),
  getTotalBalance: (id) => api.get(`/users/${id}/total-balance`),
};

// Car APIs
export const carApi = {
  getAll: () => api.get('/cars'),
  getAvailable: () => api.get('/cars/available'),
  getByType: (type) => api.get(`/cars/type/${type}`),
  getById: (id) => api.get(`/cars/${id}`),
  getByPlateNumber: (plateNumber) => api.get(`/cars/plate/${plateNumber}`),
  create: (car) => api.post('/cars', car),
  update: (id, car) => api.put(`/cars/${id}`, car),
  updateStatus: (id, status) => api.put(`/cars/${id}/status?status=${status}`),
  delete: (id) => api.delete(`/cars/${id}`),
  getCount: () => api.get('/cars/stats/count'),
  getAvailableCount: () => api.get('/cars/stats/available-count'),
};

// Rental APIs
export const rentalApi = {
  getAll: () => api.get('/rentals'),
  reserve: (data) => api.post('/rentals/reserve', data),
  pickup: (data) => api.post('/rentals/pickup', data),
  returnCar: (data) => api.post('/rentals/return', data),
  settle: (orderId) => api.post(`/rentals/${orderId}/settle`),
  getById: (orderId) => api.get(`/rentals/${orderId}`),
  getByUser: (userId) => api.get(`/rentals/user/${userId}`),
};

// Violation APIs
export const violationApi = {
  import: (data) => api.post('/violations/import', data),
  getByUser: (userId) => api.get(`/violations/user/${userId}`),
  getByOrder: (orderId) => api.get(`/violations/order/${orderId}`),
  getPending: () => api.get('/violations/pending'),
};

// Deposit APIs
export const depositApi = {
  release: (orderId) => api.post(`/deposits/${orderId}/release`),
  forceRelease: (orderId) => api.post(`/deposits/${orderId}/force-release`),
};

export default api;
