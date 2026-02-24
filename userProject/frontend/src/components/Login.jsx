import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-softGray">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
                <h2 className="text-2xl font-bold text-center mb-6 text-primary flex items-center justify-center gap-2">
                    <LogIn /> Login to CuraNode
                </h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-darkText">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-darkText">Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary transition">
                        Login
                    </button>
                    <p className="text-center text-sm text-darkText mt-4">
                        Don't have an account? <a href="/register" className="text-primary">Register</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
