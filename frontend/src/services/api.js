import axios from 'axios';

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`
});

// Add token to requests if it exists
API.interceptors.request.use((config) => {
  try {
    // Ensure window and localStorage are available (e.g., not in SSR)
    if (typeof window === 'undefined' || !window.localStorage) {
      return config;
    }

    const token = window.localStorage.getItem('token');

    // Basic validation: token should be a non-empty string
    if (typeof token === 'string' && token.trim() !== '') {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // Swallow localStorage errors to avoid breaking requests
    // Optionally log the error here if a logging mechanism exists
  }
  return config;
});

// Auth APIs
export const login = (credentials) => API.post('/auth/login', credentials);
export const register = (userData) => API.post('/auth/register', userData);

// Patient APIs
export const getPatients = () => API.get('/patients');
export const getPatient = (id) => API.get(`/patients/${id}`);
export const createPatient = (data) => API.post('/patients', data);
export const updatePatient = (id, data) => API.patch(`/patients/${id}`, data);
export const deletePatient = (id) => API.delete(`/patients/${id}`);
export const getStats = () => API.get('/patients/stats/overview');

// Queue / Waiting screen
export const getQueuePosition = (icNumber) => API.get(`/patients/queue?icNumber=${encodeURIComponent(icNumber)}`);

// Vitals submission (nurse)
export const submitVitals = (patientId, vitals) => API.post(`/patients/${patientId}/vitals`, vitals);

// Triage confirmation (nurse)
export const confirmTriage = (patientId, data) => API.post(`/patients/${patientId}/triage-confirm`, data);

// Treatment completion (clinician)
export const completeTreatment = (patientId, data) => API.post(`/patients/${patientId}/treatment`, data);

// AI Triage prediction
export const predictAI = (patientId, vitals) => API.post('/ai/predict', { patientId, vitals });

export default API;
