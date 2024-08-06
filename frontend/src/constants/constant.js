import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:6900/api/v1",
    withCredentials: true, 
})

export default api