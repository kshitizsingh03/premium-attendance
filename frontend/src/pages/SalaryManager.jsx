import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Search, IndianRupee, Download } from 'lucide-react';

const SalaryManager = () => {
    const [salaries, setSalaries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalaries = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`https://premium-attendance.onrender.com/api/salary?month=${currentMonth}`);
                setSalaries(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSalaries();
    }, [currentMonth]);

    const filteredSalaries = salaries.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const totalPayout = filteredSalaries.reduce((acc, s) => acc + s.total_salary, 0);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Salary Management</h1>
                    <p className="text-slate-400 mt-2">Real-time calculation of base salary and overtime bonus.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <input 
                        type="month" 
                        className="glass-input"
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                    />
                    <button className="premium-btn bg-slate-800 border border-slate-700 px-4 py-2 flex items-center space-x-2 text-slate-300 hover:text-white hover:border-slate-500">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 col-span-1 md:col-span-3 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 border-l-4 border-l-purple-500">
                    <div>
                        <p className="text-slate-400 mb-1">Total Expected Payout ({currentMonth})</p>
                        <h2 className="text-4xl font-bold text-white flex items-center">
                            <IndianRupee className="w-8 h-8 mr-1 text-purple-400" />
                            {totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="glass-input w-full md:w-1/3 pl-10"
                        placeholder="Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="animate-pulse flex space-x-4 p-4">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-slate-700 rounded"></div>
                                <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                    <th className="p-3">Employee</th>
                                    <th className="p-3">Present Days</th>
                                    <th className="p-3">Base Salary</th>
                                    <th className="p-3">OT Hours</th>
                                    <th className="p-3">OT Bonus</th>
                                    <th className="p-3 text-right">Total Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSalaries.map(s => (
                                    <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-3 font-medium">{s.name}</td>
                                        <td className="p-3">
                                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">{s.present_days}</span>
                                        </td>
                                        <td className="p-3">₹{s.base_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-amber-400">{s.total_overtime_hours} hrs</td>
                                        <td className="p-3 text-purple-400">+ ₹{s.overtime_bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-right font-bold text-white">₹{s.total_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {filteredSalaries.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center p-6 text-slate-400">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalaryManager;
