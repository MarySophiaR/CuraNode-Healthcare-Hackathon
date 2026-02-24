import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import Branding from '../components/Branding';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#EAF3F6]">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-sm p-10 border border-gray-100">
                <div className="mb-10">
                    <Branding size="lg" showSubtitle centered />
                </div>

                <div className="flex items-center gap-2 text-[#6FA3B3] font-bold mb-6 justify-center">
                    <LogIn className="w-5 h-5" />
                    <h2 className="text-xl">Login to CuraNode</h2>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 text-center font-bold ring-1 ring-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full h-12 px-5 rounded-xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900"
                            placeholder="user@curanode.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-500 mb-2 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full h-12 px-5 rounded-xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium text-gray-900"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full h-12 bg-[#6FA3B3] hover:bg-[#4F8C9D] text-white font-black rounded-xl transition-all shadow-lg shadow-[#EAF3F6] transform active:scale-[0.98]"
                    >
                        Login
                    </button>

                    <div className="text-center mt-8">
                        <p className="text-sm text-gray-400 font-bold">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-[#6FA3B3] hover:text-[#4F8C9D] decoration-2 transition-all">
                                Register
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
