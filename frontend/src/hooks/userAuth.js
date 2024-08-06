// import { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// import Cookies from 'js-cookie';
// import api from '@/constants/constant';

// export const userAuth = () => {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [user, setUser] = useState(null);
//     // const navigate = useNavigate();

//     useEffect(() => {
//         const token = Cookies.get('token');
//         if (token) {
//             setIsAuthenticated(true);
//         } else {
//             setIsAuthenticated(false);
//         }
//     }, []);

//     const login = async (data) => {
//         try {
//             const response = await api.post('/user/login', data);
//             Cookies.set('token', response.data.token);
//             setIsAuthenticated(true);
//             setUser(response.data.user);
//         } catch (error) {
//             console.error('Login error:', error);
//         }
//     };

//     const registerUser = async (data) => {
//         try {
//             const response = await api.post('/user/register', data);
//             Cookies.set('token', response.data.token);
//             setIsAuthenticated(true);
//             setUser(response.data.user);
//         } catch (error) {
//             console.error('Registration error:', error);
//         }
//     };

//     const logout = async () => {
//         try {
//             await api.post('/user/logout');
//             Cookies.remove('token');
//             setIsAuthenticated(false);
//             setUser(null);
//             // navigate('/login');
//         } catch (error) {
//             console.error('Logout error:', error);
//         }
//     };

//     return { isAuthenticated, user, login, registerUser, logout };
// };
