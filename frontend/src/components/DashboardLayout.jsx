import React, { useContext } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, CalendarDays, IndianRupee, LogOut } from 'lucide-react';

const DashboardLayout = () => {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/attendance', icon: CalendarDays, label: 'Attendance' },
        { path: '/salary', icon: IndianRupee, label: 'Salary Mgt' },
        { path: '/employees', icon: Users, label: 'Employees' },
    ];

    const currentShift = localStorage.getItem('selected_shift') || 'Day';

    return (
        <div className="min-h-screen flex bg-premium-dark text-slate-200">
            {/* Sidebar */}
            <aside className="w-64 glass-panel m-4 flex flex-col justify-between shadow-2xl shadow-indigo-500/10">
                <div>
                    <div className="p-6 border-b border-slate-700/50">
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            Premium Atnd
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">Admin: {user?.username}</p>
                        <div className="mt-3 flex items-center space-x-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Current Shift:</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${currentShift === 'Day' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {currentShift}
                            </span>
                        </div>
                    </div>
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => {
                            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link 
                                    key={item.path} 
                                    to={item.path}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
                <div className="p-4 space-y-2">
                    <Link to="/select-shift" className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                        <CalendarDays className="w-5 h-5" />
                        <span>Switch Shift</span>
                    </Link>
                    <button onClick={logout} className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
