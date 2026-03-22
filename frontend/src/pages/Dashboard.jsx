import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserCheck, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-panel p-6 hover:-translate-y-1 transition-transform cursor-default relative overflow-hidden group">
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-2xl ${color}`}></div>
        <div className="flex items-center space-x-4 relative z-10">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-400">{title}</p>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                    {value}
                </h3>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await axios.get('https://premium-attendance.onrender.com/api/dashboard/summary');
                setSummary(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSummary();
    }, []);

    if (!summary) return <div className="animate-pulse">Loading dashboard...</div>;

    return (
        <div className="space-y-8 animate-fade-in" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <header>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Dashboard</h1>
                <p className="text-slate-400 mt-2">Welcome back. Here's what's happening today ({summary.today}).</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Employees" 
                    value={summary.totalEmployees} 
                    icon={Users} 
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                />
                <StatCard 
                    title="Present Today" 
                    value={summary.presentToday} 
                    icon={UserCheck} 
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                />
                <StatCard 
                    title="Overtime Hours (Today)" 
                    value={summary.overtimeToday} 
                    icon={Clock} 
                    color="bg-gradient-to-br from-pink-500 to-pink-600"
                />
            </div>

            <div className="glass-panel p-6 mt-8">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex space-x-4">
                    <a href="/attendance" className="premium-btn bg-slate-800 border border-slate-700 px-6 py-2 text-sm hover:bg-slate-700">Mark Attendance</a>
                    <a href="/employees" className="premium-btn bg-slate-800 border border-slate-700 px-6 py-2 text-sm hover:bg-slate-700">Manage Employees</a>
                </div>
            </div>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
