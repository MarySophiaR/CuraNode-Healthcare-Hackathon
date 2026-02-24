import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-softGray">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
                <h2 className="text-2xl font-bold text-center mb-6 text-primary flex items-center justify-center gap-2">
                    <UserPlus /> Create Account
                </h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-darkText">Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-darkText">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-darkText">Password</label>
                        <input
                            type="password"
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary transition">
                        Register
                    </button>
                    <p className="text-center text-sm text-darkText mt-4">
                        Already have an account? <a href="/login" className="text-primary">Login</a>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Register;
