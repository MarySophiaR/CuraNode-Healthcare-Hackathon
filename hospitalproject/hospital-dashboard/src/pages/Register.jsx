import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { UserPlus, ArrowRight, Loader2, Hospital, User } from 'lucide-react';
import Branding from '../components/Branding';

const Register = () => {
    const [role, setRole] = useState('hospital'); // Default to hospital
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const payload = role === 'hospital' ? {
            hospitalName: formData.name,
            email: formData.email,
            password: formData.password,
            location: {
                type: 'Point',
                coordinates: [72.8777, 19.0760] // Default Mumbai coordinates
            }
        } : {
            name: formData.name,
            email: formData.email,
            password: formData.password
        };

        const result = await register(payload, role);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EAF3F6] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
                    <div className="mb-10 text-center">
                        <Branding size="lg" showSubtitle centered />
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-2 text-[#6FA3B3] font-black mb-4 h-8">
                            <UserPlus className="w-6 h-6" />
                            <h2 className="text-2xl tracking-tight">Create Account</h2>
                        </div>

                        {/* Role Selector */}
                        <div className="flex p-1 bg-gray-100 rounded-xl w-full max-w-xs mt-2">
                            <button
                                onClick={() => setRole('hospital')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black transition-all ${role === 'hospital' ? 'bg-white text-[#6FA3B3] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Hospital className="w-4 h-4" />
                                Hospital
                            </button>
                            <button
                                onClick={() => setRole('user')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-black transition-all ${role === 'user' ? 'bg-white text-[#6FA3B3] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <User className="w-4 h-4" />
                                User
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold ring-1 ring-red-100 text-center">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">
                                    {role === 'hospital' ? 'Hospital Name' : 'Full Name'}
                                </label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="block w-full px-5 h-12 bg-gray-100/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder={role === 'hospital' ? "e.g. City General Hospital" : "e.g. John Doe"}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="block w-full px-5 h-12 bg-gray-100/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder={role === 'hospital' ? "admin@hospital.com" : "john@example.com"}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full px-5 h-12 bg-gray-100/50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 h-14 bg-[#6FA3B3] hover:bg-[#4F8C9D] disabled:bg-gray-400 text-white text-lg font-black rounded-xl shadow-lg shadow-[#EAF3F6] transition-all transform active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Register {role === 'hospital' ? 'Hospital' : 'User'}
                                        <ArrowRight className="w-5 h-5 ml-1" />
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-4">
                            <p className="text-gray-400 font-bold">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[#6FA3B3] hover:text-[#4F8C9D] decoration-2 transition-all">
                                    Sign In here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="mt-8 text-center text-gray-400 text-sm font-bold">
                    &copy; 2026 CuraNode Emergency Systems. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Register;
