import { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import AuthContext from '../context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
    BarChart, Bar
} from 'recharts';
import {
    Activity, Clock, AlertTriangle, CheckCircle, XCircle,
    TrendingUp, PieChart as PieIcon
} from 'lucide-react';
import { io } from 'socket.io-client';

const Analytics = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const { data } = await API.get('/hospital/stats');
            setStats(data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();

        const socket = io('http://localhost:5000');
        socket.on('connect', () => {
            if (user?._id) socket.emit('registerHospital', user._id);
        });

        // Refresh stats on any relevant event
        socket.on('hospitalUpdate', fetchStats);
        socket.on('emergencyRequest', fetchStats);
        // Also listen for our own dispatch completion events if they broadcast differently
        // taking simple approach: fetch on events

        return () => socket.disconnect();
    }, [user?._id]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444']; // Green, Yellow, Orange, Red

    const pieData = [
        { name: 'Low', value: stats.severityBreakdown.low },
        { name: 'Medium', value: stats.severityBreakdown.medium },
        { name: 'High', value: stats.severityBreakdown.high },
        { name: 'Critical', value: stats.severityBreakdown.critical },
    ].filter(d => d.value > 0);

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-[#6FA3B3]" />
                Hospital Analytics
            </h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-500">Total Cases</div>
                        <Activity className="w-4 h-4 text-[#6FA3B3]" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.totalEmergencies}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-500">Accepted</div>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.accepted}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-500">Rejected</div>
                        <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-500">Avg Response</div>
                        <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stats.averageResponseTime} <span className="text-xs font-normal text-gray-500">min</span></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-gray-500">Critical</div>
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{stats.criticalCount}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Emergency Timeline - Line Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" />
                        24h Activity
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.emergencyTimeline}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#6FA3B3"
                                    strokeWidth={3}
                                    dot={{ fill: '#6FA3B3', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Severity Breakdown - Pie Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <PieIcon className="w-5 h-5 text-gray-400" />
                        Severity Distribution
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Ambulance Utilization - Progress */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Ambulance Utilization</h3>
                        <p className="text-sm text-gray-500">Current fleet deployment percentage</p>
                    </div>
                    <div className="text-3xl font-bold text-[#6FA3B3]">{stats.ambulanceUtilizationPercent}%</div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                        className="bg-[#6FA3B3] h-4 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${stats.ambulanceUtilizationPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
