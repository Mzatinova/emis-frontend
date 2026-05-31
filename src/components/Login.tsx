import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { GraduationCap, Lock, Mail, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useEMIS();
    const [tab, setTab] = useState<'staff' | 'student'>('staff');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!identifier || !password) { setError('Please fill in all fields'); return; }
        setLoading(true);
        const result = await login(identifier, password, tab);
        setLoading(false);
        if (!result) setError('Invalid credentials or inactive account');
    };

    const fillDemo = (type: 'tech' | 'admin' | 'inst' | 'acc' | 'stu') => {
        if (type === 'stu') { setTab('student'); setIdentifier('TC/2025/001'); setPassword('student123'); return; }
        setTab('staff');
        if (type === 'tech') { setIdentifier('tech@emis.edu'); setPassword('tech123'); }
        if (type === 'admin') { setIdentifier('admin@emis.edu'); setPassword('admin123'); }
        if (type === 'inst') { setIdentifier('instructor@emis.edu'); setPassword('inst123'); }
        if (type === 'acc') { setIdentifier('accounts@emis.edu'); setPassword('acc123'); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background blurs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            {/* Desktop: 2-column layout (hidden on mobile) */}
            <div className="hidden lg:grid lg:grid-cols-2 gap-8 max-w-6xl w-full relative">
                {/* Desktop Branding */}
                <div className="text-white space-y-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 backdrop-blur p-3 rounded-2xl border border-white/20">
                            <GraduationCap className="w-10 h-10 text-emerald-300" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">EMIS</h1>
                            <p className="text-indigo-200 text-sm">Examination Management Information System</p>
                        </div>
                    </div>
                    <h2 className="text-5xl font-bold leading-tight">
                        Streamline<br />
                        <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                            Academic Excellence
                        </span>
                    </h2>
                </div>

                {/* Desktop Form */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
                    <h3 className="text-2xl font-bold text-center text-emerald-600 mb-2">Sign in to your account</h3>
                    <p className="text-slate-500 text-center mb-6">Choose your account type to continue</p>

                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setTab('staff')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'staff' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            Staff
                        </button>
                        <button
                            onClick={() => setTab('student')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'student' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            Student
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">
                                {tab === 'staff' ? 'Email Address' : 'Registration Number'}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder={tab === 'staff' ? 'you@institution.edu' : 'TC/2025/001'}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
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
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-60"
                        >
                            {loading ? 'Please wait...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 font-medium">Quick access (demo):</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => fillDemo('tech')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Technician</button>
                            <button onClick={() => fillDemo('admin')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Administrator</button>
                            <button onClick={() => fillDemo('inst')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Instructor</button>
                            <button onClick={() => fillDemo('acc')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Accounts</button>
                            <button onClick={() => fillDemo('stu')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition col-span-2">Student</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: YOUR EXISTING MOBILE VIEW (unchanged) */}
            <div className="lg:hidden w-full max-w-md mx-auto">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-3">
                        <div className="bg-white/10 backdrop-blur p-3 rounded-2xl border border-white/20 inline-flex">
                            <GraduationCap className="w-10 h-10 text-emerald-300" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white">EMIS</h1>
                    <p className="text-indigo-200 text-sm">Examination Management Information System</p>
                    <h2 className="text-xl font-bold leading-tight text-white mt-3">
                        Streamline <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Academic Excellence</span>
                    </h2>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-6">
                    <h3 className="text-xl font-bold text-center text-emerald-600 mb-1">Sign in to your account</h3>
                    <p className="text-slate-500 text-center text-sm mb-5">Choose your account type to continue</p>

                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
                        <button
                            onClick={() => setTab('staff')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'staff' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            Staff
                        </button>
                        <button
                            onClick={() => setTab('student')}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'student' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                        >
                            Student
                        </button>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">
                                {tab === 'staff' ? 'Email Address' : 'Registration Number'}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    placeholder={tab === 'staff' ? 'you@institution.edu' : 'TC/2025/001'}
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition text-sm"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-60"
                        >
                            {loading ? 'Please wait...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 font-medium text-center">Quick access (demo):</p>
                        <div className="flex flex-col items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fillDemo('tech')}
                                className="text-center text-xs px-4 py-2 bg-slate-100 active:bg-emerald-100 rounded transition"
                            >
                                Technician
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemo('admin')}
                                className="text-center text-xs px-4 py-2 bg-slate-100 active:bg-emerald-100 rounded transition"
                            >
                                Administrator
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemo('inst')}
                                className="text-center text-xs px-4 py-2 bg-slate-100 active:bg-emerald-100 rounded transition"
                            >
                                Instructor
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemo('acc')}
                                className="text-center text-xs px-4 py-2 bg-slate-100 active:bg-emerald-100 rounded transition"
                            >
                                Accounts
                            </button>
                            <button
                                type="button"
                                onClick={() => fillDemo('stu')}
                                className="text-center text-xs px-4 py-2 bg-slate-100 active:bg-emerald-100 rounded transition"
                            >
                                Student
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

// import React, { useState } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { GraduationCap, Lock, Mail, AlertCircle } from 'lucide-react';

// const Login: React.FC = () => {
//     const { login } = useEMIS();
//     const [tab, setTab] = useState<'staff' | 'student'>('staff');
//     const [identifier, setIdentifier] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const [loading, setLoading] = useState(false);

//     const submit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         if (!identifier || !password) { setError('Please fill in all fields'); return; }
//         setLoading(true);
//         const result = await login(identifier, password, tab);
//         setLoading(false);
//         if (!result) setError('Invalid credentials or inactive account');
//     };

//     const fillDemo = (type: 'tech' | 'admin' | 'inst' | 'acc' | 'stu') => {
//         if (type === 'stu') { setTab('student'); setIdentifier('TC/2025/001'); setPassword('student123'); return; }
//         setTab('staff');
//         if (type === 'tech') { setIdentifier('tech@emis.edu'); setPassword('tech123'); }
//         if (type === 'admin') { setIdentifier('admin@emis.edu'); setPassword('admin123'); }
//         if (type === 'inst') { setIdentifier('instructor@emis.edu'); setPassword('inst123'); }
//         if (type === 'acc') { setIdentifier('accounts@emis.edu'); setPassword('acc123'); }
//     };

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
//             <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
//             <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

//             <div className="relative grid lg:grid-cols-2 gap-8 max-w-6xl w-full">
//                 {/* Branding */}
//                 <div className="text-white space-y-8 hidden lg:flex flex-col justify-center">
//                     <div className="flex items-center gap-3">
//                         <div className="bg-white/10 backdrop-blur p-3 rounded-2xl border border-white/20">
//                             <GraduationCap className="w-10 h-10 text-emerald-300" />
//                         </div>
//                         <div>
//                             <h1 className="text-3xl font-bold">EMIS</h1>
//                             <p className="text-indigo-200 text-sm">Examination Management Information System</p>
//                         </div>
//                     </div>
//                     <h2 className="text-5xl font-bold leading-tight">
//                         Streamline<br />
//                         <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
//                             Academic Excellence
//                         </span>
//                     </h2>
//                 </div>

//                 {/* Form */}
//                 <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
//                     <div className="lg:hidden flex items-center gap-3 mb-6">
//                         <div className="bg-emerald-600 p-2 rounded-xl">
//                             <GraduationCap className="w-6 h-6 text-white" />
//                         </div>
//                         <h1 className="text-xl font-bold text-slate-900">EMIS</h1>
//                     </div>

//                     <h3 className="text-2xl font-bold text-center text-emerald-600 mb-2">Sign in to your account</h3>
//                     <p className="text-slate-500 text-center mb-6">Choose your account type to continue</p>



//                     <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
//                         <button
//                             onClick={() => setTab('staff')}
//                             className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'staff' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
//                         >
//                             Staff
//                         </button>
//                         <button
//                             onClick={() => setTab('student')}
//                             className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${tab === 'student' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
//                         >
//                             Student
//                         </button>
//                     </div>

//                     <form onSubmit={submit} className="space-y-4">
//                         <div>
//                             <label className="text-sm font-medium text-slate-700 mb-1 block">
//                                 {tab === 'staff' ? 'Email Address' : 'Registration Number'}
//                             </label>
//                             <div className="relative">
//                                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
//                                 <input
//                                     type="text"
//                                     required
//                                     value={identifier}
//                                     onChange={e => setIdentifier(e.target.value)}
//                                     placeholder={tab === 'staff' ? 'you@institution.edu' : 'TC/2025/001'}
//                                     className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
//                                 />
//                             </div>
//                         </div>

//                         <div>
//                             <label className="text-sm font-medium text-slate-700 mb-1 block">Password</label>
//                             <div className="relative">
//                                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
//                                 <input
//                                     type="password"
//                                     required
//                                     minLength={6}
//                                     value={password}
//                                     onChange={e => setPassword(e.target.value)}
//                                     placeholder="••••••••"
//                                     className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
//                                 />
//                             </div>
//                         </div>

//                         {error && (
//                             <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
//                                 <AlertCircle className="w-4 h-4" />
//                                 {error}
//                             </div>
//                         )}

//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-60"
//                         >
//                             {loading ? 'Please wait...' : 'Sign In'}
//                         </button>
//                     </form>

//                     <div className="mt-6 pt-6 border-t border-slate-200">
//                         <p className="text-xs text-slate-500 mb-2 font-medium">Quick access (demo):</p>
//                         <div className="grid grid-cols-3 gap-2">
//                             <button onClick={() => fillDemo('tech')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Technician</button>
//                             <button onClick={() => fillDemo('admin')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Administrator</button>
//                             <button onClick={() => fillDemo('inst')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Instructor</button>
//                             <button onClick={() => fillDemo('acc')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition">Accounts</button>
//                             <button onClick={() => fillDemo('stu')} className="text-xs px-2 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded transition col-span-2">Student</button>
//                         </div>
//                     </div>


//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Login;
