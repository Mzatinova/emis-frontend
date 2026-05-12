import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { GraduationCap, Lock, Mail, ShieldCheck, BookOpen, FileCheck2, Database, AlertCircle } from 'lucide-react';

const StaffLogin: React.FC = () => {
    const { login } = useEMIS();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        const result = await login(email, password, 'staff');
        setLoading(false);
        if (!result) setError('Invalid credentials or inactive account');
    };

    const fillDemo = (type: string) => {
        if (type === 'tech') { setEmail('tech@emis.edu'); setPassword('admin123'); }
        if (type === 'admin') { setEmail('admin@emis.edu'); setPassword('admin123'); }
        if (type === 'inst') { setEmail('instructor@emis.edu'); setPassword('admin123'); }
        if (type === 'acc') { setEmail('accounts@emis.edu'); setPassword('admin123'); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative grid lg:grid-cols-2 gap-8 max-w-6xl w-full">
                {/* Branding */}
                <div className="text-white space-y-8 hidden lg:flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur p-3 rounded-2xl border border-white/20">
                            <GraduationCap className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">EMIS</h1>
                            <p className="text-indigo-200 text-sm">Examination Management Information System</p>
                        </div>
                    </div>
                    <h2 className="text-5xl font-bold leading-tight">
                        Streamline<br />
                        <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
                            Academic Excellence
                        </span>
                    </h2>
                    <p className="text-lg text-indigo-100 leading-relaxed max-w-lg">
                        Secure, cloud-based platform for managing examinations, results, and academic records, your data persists permanently across all devices.
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-lg">
                        {[
                            { icon: ShieldCheck, label: 'Encrypted Auth' },
                            { icon: Database, label: 'Cloud Database' },
                            { icon: FileCheck2, label: 'Approval Workflows' },
                            { icon: BookOpen, label: 'Auto Grading Engine' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur">
                                <f.icon className="w-5 h-5 text-teal-300" />
                                <span className="text-sm font-medium">{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Staff Form */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
                    <div className="lg:hidden flex items-center gap-3 mb-6">
                        <div className="bg-indigo-600 p-2 rounded-xl">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">EMIS</h1>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Staff Sign In</h3>
                    <p className="text-slate-500 mb-6">Sign in with your institutional email</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@institution.edu"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-60"
                        >
                            {loading ? 'Please wait...' : 'Sign In Securely'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 font-medium">Quick access (demo):</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => fillDemo('tech')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded">Technician</button>
                            <button onClick={() => fillDemo('admin')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded">Administrator</button>
                            <button onClick={() => fillDemo('inst')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded">Instructor</button>
                            <button onClick={() => fillDemo('acc')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded">Accounts</button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                        <Database className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                            All data is stored in a secure cloud database. Your credentials are encrypted and your session persists across devices.
                        </span>
                    </div>

                    <div className="mt-4 text-center">
                        <a href="/login/student" className="text-sm text-indigo-600 hover:text-indigo-700">
                            Student Login →
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;