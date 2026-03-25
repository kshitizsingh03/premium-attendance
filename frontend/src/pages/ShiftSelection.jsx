import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

const ShiftSelection = () => {
    const navigate = useNavigate();

    const handleSelect = (shift) => {
        localStorage.setItem('selected_shift', shift);
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-2xl p-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50"></div>

                <div className="relative z-10 text-center">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-8">
                        Select Working Shift
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                            onClick={() => handleSelect('Day')}
                            className="glass-panel p-8 flex flex-col items-center space-y-4 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group"
                        >
                            <Sun className="w-16 h-16 text-yellow-400 group-hover:scale-110 transition-transform" />
                            <div className="text-2xl font-semibold text-slate-200">Day Shift</div>
                            <div className="text-sm text-slate-400">8:00 AM - 5:00 PM</div>
                        </button>

                        <button 
                            onClick={() => handleSelect('Night')}
                            className="glass-panel p-8 flex flex-col items-center space-y-4 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
                        >
                            <Moon className="w-16 h-16 text-purple-400 group-hover:scale-110 transition-transform" />
                            <div className="text-2xl font-semibold text-slate-200">Night Shift</div>
                            <div className="text-sm text-slate-400">8:00 PM - 5:00 AM</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftSelection;
