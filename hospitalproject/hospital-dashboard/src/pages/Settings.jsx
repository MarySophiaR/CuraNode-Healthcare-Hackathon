import { useState, useContext, useEffect } from 'react';
import AuthContext from '../context/AuthContext';
import API from '../services/api';
import { Save, User, Image as ImageIcon, Mail, Lock, ShieldCheck } from 'lucide-react';

const Settings = () => {
    const { user, setUser } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        hospitalName: '',
        email: '',
        heroImage: '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Sync form with user data when it arrives
    useEffect(() => {
        if (user) {
            setFormData({
                hospitalName: user.hospitalName || '',
                email: user.email || '',
                heroImage: user.heroImage || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            console.log('Submitting profile update...', formData);
            const { data } = await API.patch('/hospital/profile', formData);

            // Update context and local storage
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            console.error('Profile Update Error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await API.patch('/hospital/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowPasswordForm(false);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 font-medium">Manage your hospital profile and account security</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-[#6FA3B3]" />
                                Hospital Profile
                            </h2>
                        </div>

                        <div className="p-8 space-y-6">
                            {message.text && (
                                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 ring-1 ring-green-100' : 'bg-red-50 text-red-700 ring-1 ring-red-100'
                                    }`}>
                                    <ShieldCheck className="w-5 h-5" />
                                    {message.text}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Hospital Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <ShieldCheck className="h-5 w-5 text-gray-400 group-focus-within:text-[#6FA3B3] transition-colors" />
                                        </div>
                                        <input
                                            name="hospitalName"
                                            value={formData.hospitalName}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 h-12 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium"
                                            placeholder="Enter Hospital Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Admin Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#6FA3B3] transition-colors" />
                                        </div>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="block w-full pl-11 pr-4 h-12 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium"
                                            placeholder="admin@hospital.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Hero Image URL</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ImageIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#6FA3B3] transition-colors" />
                                    </div>
                                    <input
                                        name="heroImage"
                                        value={formData.heroImage}
                                        onChange={handleChange}
                                        className="block w-full pl-11 pr-4 h-12 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6FA3B3]/20 focus:border-[#6FA3B3]/30 transition-all font-medium"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1 ml-1 italic">
                                    Use a high-quality Unsplash or direct image URL for your dashboard hero section.
                                </p>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 bg-[#6FA3B3] hover:bg-[#4F8C9D] disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#EAF3F6] flex items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#EAF3F6] rounded-2xl flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-[#6FA3B3]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Security Credentials</h3>
                                    <p className="text-sm text-gray-500">Update your access password frequently</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPasswordForm(!showPasswordForm)}
                                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                            >
                                {showPasswordForm ? 'Cancel' : 'Change Password'}
                            </button>
                        </div>

                        {showPasswordForm && (
                            <form onSubmit={handlePasswordSubmit} className="p-8 pt-0 space-y-6 border-t border-gray-50 bg-gray-50/30">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="block w-full px-4 h-12 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="block w-full px-4 h-12 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="block w-full px-4 h-12 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-8 py-3 bg-[#6FA3B3] hover:bg-[#4F8C9D] disabled:bg-gray-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#EAF3F6] flex items-center gap-2"
                                    >
                                        <Save className="w-5 h-5" />
                                        {loading ? 'Updating...' : 'Update Password'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Preview</h3>
                        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-gray-100">
                            <img
                                src={formData.heroImage || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2070&auto=format&fit=crop'}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent flex flex-col justify-end p-4">
                                <h4 className="text-white font-black text-sm truncate uppercase tracking-tight">
                                    {formData.hospitalName || 'Enter Name'}
                                </h4>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium">Profile Score</span>
                                <span className="text-green-600 font-bold italic">Excellent</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#6FA3B3] w-[92%] rounded-full shadow-[0_0_8px_rgba(111,163,179,0.3)]" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#6FA3B3] rounded-3xl shadow-xl shadow-[#EAF3F6] p-6 text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h3 className="font-black text-lg mb-2">Need Help?</h3>
                            <p className="text-sm text-white/80 font-medium leading-relaxed mb-4">
                                Our support team is available 24/7 for technical assistance.
                            </p>
                            <button className="w-full py-2.5 bg-white text-[#6FA3B3] font-bold rounded-xl shadow-lg">
                                Contact Support
                            </button>
                        </div>
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
