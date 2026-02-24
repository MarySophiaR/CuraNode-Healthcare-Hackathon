import { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const { data } = await API.get('/auth/me');
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to fetch user', error);
            logout(); // If fetch fails, clear token
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                fetchUser(); // Refresh data on mount
            } catch (e) {
                console.error("Error parsing stored user", e);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (user) {
            const token = localStorage.getItem('token');
            const socket = io('http://localhost:5001', {
                auth: { token }
            });

            socket.on('connect', () => {
                console.log('Auth Context Socket connected');
                // No need to emit 'registerHospital', backend uses JWT to join room automatically
            });

            socket.on('hospitalUpdate', (data) => {
                if (user.role === 'hospital' && data.hospitalId === user._id) {
                    console.log('Received hospital update', data);
                    setUser((prev) => {
                        const updated = { ...prev, ...data };
                        localStorage.setItem('user', JSON.stringify(updated));
                        return updated;
                    });
                }
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [user?._id, user?.role]); // Only re-run if user ID or role changes

    const login = async (email, password) => {
        try {
            const { data } = await API.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);

            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (regData, role = 'hospital') => {
        try {
            const endpoint = role === 'user' ? '/auth/register-user' : '/auth/register';
            const { data } = await API.post(endpoint, regData);
            localStorage.setItem('token', data.token);

            // Fetch full profile immediately after registration to get defaults
            const response = await API.get('/auth/me', {
                headers: { Authorization: `Bearer ${data.token}` }
            });

            localStorage.setItem('user', JSON.stringify(response.data));
            setUser(response.data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, loading, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
