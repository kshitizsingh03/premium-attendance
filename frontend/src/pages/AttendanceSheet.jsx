import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getDaysInMonth, format, startOfMonth, addDays } from 'date-fns';
import { Search, Save } from 'lucide-react';

const AttendanceSheet = () => {
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [saving, setSaving] = useState(false);

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const year = parseInt(currentMonth.split('-')[0]);
    const monthIndex = parseInt(currentMonth.split('-')[1]) - 1;
    const daysInMonth = getDaysInMonth(new Date(year, monthIndex));
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = addDays(startOfMonth(new Date(year, monthIndex)), i);
        return { dateStr: format(d, 'yyyy-MM-dd'), dayNum: i + 1, isToday: format(d, 'yyyy-MM-dd') === todayStr };
    });

    useEffect(() => {
        const fetchData = async () => {
            const empRes = await axios.get('https://premium-attendance.onrender.com/api/employees');
            setEmployees(empRes.data);

            const attRes = await axios.get(`https://premium-attendance.onrender.com/api/attendance?month=${currentMonth}`);
            const attMap = {};
            attRes.data.forEach(record => {
                if (!attMap[record.employee_id]) attMap[record.employee_id] = {};
                attMap[record.employee_id][record.date] = {
                    status: record.status,
                    overtime_hours: record.overtime_hours
                };
            });
            setAttendance(attMap);
        };
        fetchData();
    }, [currentMonth]);

    const handleStatusChange = (empId, date, status) => {
        setAttendance(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [date]: { ...(prev[empId]?.[date] || { overtime_hours: 0 }), status }
            }
        }));
    };

    const handleOvertimeChange = (empId, date, hours) => {
        const val = parseFloat(hours) || 0;
        if (val < 0) return; // Prevent negative
        setAttendance(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [date]: { ...(prev[empId]?.[date] || { status: 'P' }), overtime_hours: val }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = [];
            Object.keys(attendance).forEach(empId => {
                Object.keys(attendance[empId]).forEach(date => {
                    const record = attendance[empId][date];
                    if (record.status) {
                        promises.push(axios.post('https://premium-attendance.onrender.com/api/attendance', {
                            employee_id: empId,
                            date,
                            status: record.status,
                            overtime_hours: record.overtime_hours
                        }));
                    }
                });
            });
            await Promise.all(promises);
            alert('Saved successfully!');
        } catch (e) {
            alert('Error saving data');
        } finally {
            setSaving(false);
        }
    };

    const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Attendance Sheet</h1>
                    <p className="text-slate-400 mt-2">Manage daily attendance and overtime.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <input 
                        type="month" 
                        className="glass-input"
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                    />
                    <button onClick={handleSave} disabled={saving} className="premium-btn premium-btn-gradient px-6 py-2 flex items-center space-x-2">
                        <Save className="w-5 h-5" />
                        <span>{saving ? 'Saving...' : 'Save All'}</span>
                    </button>
                </div>
            </header>

            <div className="glass-panel p-4 overflow-hidden flex flex-col">
                <div className="relative mb-4 shrink-0">
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

                <div className="overflow-x-auto custom-scrollbar pb-4 flex-1">
                    <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                            <tr className="border-b border-slate-700">
                                <th className="p-2 sticky left-0 bg-slate-900 z-20 min-w-[150px] shadow-[4px_0_10px_rgba(0,0,0,0.5)]">Employee</th>
                                {days.map(d => (
                                    <th key={d.dayNum} className={`p-2 text-center text-xs font-semibold ${d.isToday ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-t-lg' : 'text-slate-400'}`}>
                                        {d.dayNum}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map(emp => (
                                <tr key={emp.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                                    <td className="p-2 sticky left-0 bg-slate-900 z-10 font-medium shadow-[4px_0_10px_rgba(0,0,0,0.5)] flex flex-col justify-center min-h-[60px]">
                                        {emp.name}
                                        <div className="text-xs text-slate-500">{emp.shift} Shift</div>
                                    </td>
                                    {days.map(d => {
                                        const record = attendance[emp.id]?.[d.dateStr] || { status: '', overtime_hours: 0 };
                                        
                                        let statusColor = 'bg-slate-800 text-slate-300 border-slate-700';
                                        if (record.status === 'P') statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
                                        if (record.status === 'A') statusColor = 'bg-red-500/20 text-red-400 border-red-500/50';
                                        if (record.status === 'L') statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/50';

                                        return (
                                            <td key={d.dayNum} className={`p-1 min-w-[80px] ${d.isToday ? 'bg-blue-500/5 border-x border-blue-500/20' : ''}`}>
                                                <div className="flex flex-col space-y-1">
                                                    <select 
                                                        className={`text-xs p-1 rounded border outline-none cursor-pointer text-center appearance-none ${statusColor}`}
                                                        value={record.status}
                                                        onChange={(e) => handleStatusChange(emp.id, d.dateStr, e.target.value)}
                                                    >
                                                        <option value="">-</option>
                                                        <option value="P">P</option>
                                                        <option value="A">A</option>
                                                        <option value="L">L</option>
                                                    </select>
                                                    <input 
                                                        type="number" 
                                                        step="0.5" 
                                                        min="0"
                                                        placeholder="OT hrs"
                                                        className="text-xs p-1 rounded bg-slate-900 border border-slate-700 text-center focus:border-purple-500 focus:outline-none placeholder-slate-600 disabled:opacity-50"
                                                        value={record.overtime_hours || ''}
                                                        onChange={(e) => handleOvertimeChange(emp.id, d.dateStr, e.target.value)}
                                                        disabled={!record.status || record.status === 'A' || record.status === 'L'}
                                                    />
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendanceSheet;
