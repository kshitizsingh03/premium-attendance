import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, api } from '../context/AuthContext';
import { Lock, User, UserPlus } from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegister) {
                await api.post('/api/auth/register', { username, password });
            }
            await login(username, password);
            navigate('/select-shift');
        } catch (err) {
            console.error('Login/Register error:', err);
            setError(err.response?.data?.error || err.message || 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/10">
                {/* Decorative blobs */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl opacity-30"></div>

                <div className="relative z-10">
                    <div className="mb-8 text-center">
                        {isRegister ? <UserPlus className="w-12 h-12 text-purple-400 mx-auto mb-4" /> : <User className="w-12 h-12 text-blue-400 mx-auto mb-4" />}
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            {isRegister ? 'Register' : 'Admin Portal'}
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">{isRegister ? 'Create a new admin account' : 'Sign in to manage your team'}</p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="glass-input w-full pl-10 h-12"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    className="glass-input w-full pl-10 h-12"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="premium-btn premium-btn-gradient w-full py-3 font-semibold text-lg transition-all active:scale-[0.98]">
                            {isRegister ? 'Create Account' : 'Login Now'}
                        </button>
                        
                        <div className="text-center pt-2">
                            <button 
                                type="button" 
                                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                                className="text-sm text-slate-400 hover:text-white transition-colors underline-offset-4 hover:underline"
                            >
                                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
