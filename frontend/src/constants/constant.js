import axios from 'axios';

const api = axios.create({
    baseURL: "https://scriptsaga-production.up.railway.app/api/v1",
    withCredentials: true, 
    headers: {
        'Content-Type': 'application/json'
    }
})

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