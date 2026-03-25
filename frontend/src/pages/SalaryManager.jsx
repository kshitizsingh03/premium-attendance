import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
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
                const res = await api.get(`/api/salary?month=${currentMonth}`);
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

    const handleUpdateRate = async (id, field, value) => {
        try {
            const emp = salaries.find(s => s.id === id);
            const updatedData = { ...emp, [field]: parseFloat(value) || 0 };
            await api.put(`/api/employees/${id}`, updatedData);
            
            // Update local state to reflect changes and recalculate total
            setSalaries(prev => prev.map(s => {
                if (s.id === id) {
                    const newBase = field === 'base_salary' ? parseFloat(value) || 0 : s.base_salary;
                    const newRate = field === 'overtime_rate' ? parseFloat(value) || 0 : s.overtime_rate;
                    const newOTBonus = s.total_overtime_hours * newRate;
                    return { 
                        ...s, 
                        [field]: parseFloat(value) || 0,
                        overtime_bonus: newOTBonus,
                        total_salary: newBase + newOTBonus
                    };
                }
                return s;
            }));
        } catch (err) {
            console.error('Error updating rate:', err);
        }
    };

    const totalPayout = filteredSalaries.reduce((acc, s) => acc + s.total_salary, 0);

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Salary Management</h1>
                    <p className="text-slate-400 mt-2">Manage base salaries and calculate monthly payouts with overtime.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <input 
                        type="month" 
                        className="glass-input"
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 col-span-1 md:col-span-3 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 border-l-4 border-l-purple-500 shadow-xl shadow-purple-500/10">
                    <div>
                        <p className="text-slate-400 mb-1">Total Estimated Payout ({currentMonth})</p>
                        <h2 className="text-4xl font-bold text-white flex items-center">
                            <IndianRupee className="w-8 h-8 mr-1 text-purple-400" />
                            {totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-slate-500 text-sm">Showing {filteredSalaries.length} Employees</p>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="relative w-full md:w-1/3">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="glass-input w-full pl-10"
                            placeholder="Search by employee name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-lg"></div>)}
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="p-4">Employee</th>
                                    <th className="p-4">Attendance</th>
                                    <th className="p-4">Base Salary (₹)</th>
                                    <th className="p-4">OT Rate (₹/hr)</th>
                                    <th className="p-4">OT Details</th>
                                    <th className="p-4 text-right">Total Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSalaries.map(s => (
                                    <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-slate-200">{s.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">P: {s.present_days}</span>
                                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">A: {s.absent_days}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-500 outline-none w-24 text-slate-300 transition-all px-1"
                                                defaultValue={s.base_salary}
                                                onBlur={(e) => handleUpdateRate(s.id, 'base_salary', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input 
                                                type="number" 
                                                className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-purple-500 outline-none w-20 text-slate-300 transition-all px-1"
                                                defaultValue={s.overtime_rate}
                                                onBlur={(e) => handleUpdateRate(s.id, 'overtime_rate', e.target.value)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-amber-400 text-sm font-semibold">{s.total_overtime_hours} hrs</span>
                                                <span className="text-slate-500 text-[10px] font-bold">+ ₹{s.overtime_bonus.toLocaleString()} bonus</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-black text-white text-lg group-hover:text-purple-400 transition-colors">
                                            ₹{s.total_salary.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredSalaries.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center p-10 text-slate-500 italic">No matching employees found for "{searchTerm}"</td>
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
