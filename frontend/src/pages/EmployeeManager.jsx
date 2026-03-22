import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, Search, Edit2, Trash2, X } from 'lucide-react';

const EmployeeManager = () => {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', role: '', shift: 'Day', base_salary: 0, overtime_rate: 0 });

    const fetchEmployees = async () => {
        const res = await axios.get('http://localhost:5000/api/employees');
        setEmployees(res.data);
    };

    useEffect(() => { fetchEmployees(); }, []);

    const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.role.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSave = async (e) => {
        e.preventDefault();
        if (formData.id) {
            await axios.put(`http://localhost:5000/api/employees/${formData.id}`, formData);
        } else {
            await axios.post('http://localhost:5000/api/employees', formData);
        }
        setShowModal(false);
        fetchEmployees();
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this employee?')) {
            await axios.delete(`http://localhost:5000/api/employees/${id}`);
            fetchEmployees();
        }
    };

    const openEdit = (emp) => {
        setFormData(emp);
        setShowModal(true);
    };

    const openNew = () => {
        setFormData({ id: null, name: '', role: '', shift: 'Day', base_salary: 0, overtime_rate: 0 });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Employees</h1>
                    <p className="text-slate-400 mt-2">Manage your workforce here.</p>
                </div>
                <button onClick={openNew} className="premium-btn premium-btn-gradient px-4 py-2 flex items-center space-x-2">
                    <UserPlus className="w-5 h-5" />
                    <span>Add Employee</span>
                </button>
            </header>

            <div className="glass-panel p-6">
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        className="glass-input w-full pl-10 md:w-1/3"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                <th className="p-3">Name</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Shift</th>
                                <th className="p-3">Base Salary (₹)</th>
                                <th className="p-3">OT Rate (₹/hr)</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="p-3 font-medium">{emp.name}</td>
                                    <td className="p-3">{emp.role}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${emp.shift === 'Day' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            {emp.shift}
                                        </span>
                                    </td>
                                    <td className="p-3">₹{emp.base_salary.toLocaleString()}</td>
                                    <td className="p-3">₹{emp.overtime_rate.toLocaleString()}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <button onClick={() => openEdit(emp)} className="text-blue-400 hover:text-blue-300 transition-colors p-1"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(emp.id)} className="text-red-400 hover:text-red-300 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center p-6 text-slate-400">No employees found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel w-full max-w-md p-6 relative">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold mb-6">{formData.id ? 'Edit Employee' : 'New Employee'}</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Name</label>
                                <input required type="text" className="glass-input w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Role</label>
                                <input type="text" className="glass-input w-full" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Shift</label>
                                <select className="glass-input w-full" value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})}>
                                    <option value="Day">Day Shift (8 AM - 5 PM)</option>
                                    <option value="Night">Night Shift (8 PM - 5 AM)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Base Salary (₹)</label>
                                    <input type="number" step="0.01" min="0" className="glass-input w-full" value={formData.base_salary} onChange={e => setFormData({...formData, base_salary: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Overtime Rate/hr</label>
                                    <input type="number" step="0.01" min="0" className="glass-input w-full" value={formData.overtime_rate} onChange={e => setFormData({...formData, overtime_rate: parseFloat(e.target.value)})} />
                                </div>
                            </div>
                            <button type="submit" className="premium-btn bg-blue-600 hover:bg-blue-500 w-full py-2 mt-4 text-white">Save</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeManager;
