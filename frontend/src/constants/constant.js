import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:6900/api/v1",
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Student progress tracking APIs
api.getStudentProgressReport = (userId, period) => {
    return api.get(`/metrics/${userId}/report${period ? `?period=${period}` : ''}`);
};

api.getClassAverages = (classId) => {
    return api.get(`/metrics/class/${classId}/average`);
};

api.compareStudentWithClass = (userId) => {
    return api.get(`/metrics/${userId}/compare`);
};

export default api