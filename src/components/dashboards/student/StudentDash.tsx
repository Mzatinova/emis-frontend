import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { Badge, Button, Toast } from '@/components/shared/UI'; // Removed PageHeader
import {
  Download,
  GraduationCap,
  CreditCard,
  CheckCircle,
  Clock,
  Award,
  BookOpen
} from 'lucide-react';
import StudentRegistration from './StudentRegistration';
import StudentResults from './StudentResults';
import StudentHistory from './StudentHistory';
import StudentInvoices from './StudentInvoices';

const StudentDash: React.FC<{ active: string }> = ({ active }) => {
  const { currentUser, results, sessions } = useEMIS();

  const { getStudentRegistrations, fetchInvoices, invoices } = useRegistration();
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const myInvoices = invoices.filter(inv => String(inv.studentId) === String(currentUser?.id));
  const myRegistrations = getStudentRegistrations(currentUser?.id || '') || [];

  const myResults = results.filter(r => String(r.studentId) === String(currentUser?.id) && r.status === 'approved');

  const isRegistered = myRegistrations.some(r => r.registrationStatus === 'approved');
  const hasPendingInvoice = myInvoices.some(i => i.status === 'pending' || i.status === 'paid');
  const hasApprovedRegistration = myRegistrations.some(r => r.registrationStatus === 'approved');

  // Get latest results (last 3)
  const latestResults = [...myResults].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  // Overall pass/fail status for current level
  const allPassed = myResults.length === 3 && myResults.every(r => r.grade !== 'F' && r.marks !== null);
  const hasFail = myResults.some(r => r.grade === 'F');

  let overallStatus = '';
  let overallStatusColor = '';
  let StatusIcon = Award;

  if (myResults.length === 0) {
    overallStatus = 'No Results Available';
    overallStatusColor = 'text-slate-500';
    StatusIcon = Clock;
  } else if (allPassed) {
    overallStatus = 'PASS AND PROCEED';
    overallStatusColor = 'text-emerald-600';
    StatusIcon = CheckCircle;
  } else if (hasFail) {
    overallStatus = 'FAILED - REPEAT';
    overallStatusColor = 'text-red-600';
  }

  // ========== DASHBOARD VIEW ==========
  if (active === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto pb-8 space-y-6">
        {toast && <Toast message={toast} onClose={() => setToast('')} />}

        {/* Unified Hero / Welcome Card */}
        <div className="bg-gradient-to-br from-indigo-800 via-blue-700 to-blue-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          {/* Decorative background shapes for depth */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-white/10 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/10">
                  Student Portal
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight">
                Welcome back, {currentUser?.name?.split(' ')[0]} 👋
              </h1>

              {/* Vital Stats Badges */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="flex items-center gap-2 bg-black/20 px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/10">
                  <span className="text-blue-200">ID:</span>
                  <span className="font-mono font-medium tracking-wider">{(currentUser as any)?.regNumber}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/10">
                  <BookOpen className="w-4 h-4 text-blue-200" />
                  <span className="font-medium">{(currentUser as any)?.program}</span>
                </div>
                <div className="flex items-center gap-2 bg-black/20 px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/10">

                  <span className="font-medium">{(currentUser as any)?.level}</span>
                </div>
              </div>
            </div>

            {/* Quick Context Icon */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner min-w-[160px]">
              <GraduationCap className="w-12 h-12 text-blue-100 mb-3" strokeWidth={1.5} />
              <span className="text-sm font-medium text-blue-100 text-center">Academic Year: {sessions.find(s => s.active)?.year || 'None'}<br />Active</span>
            </div>
          </div>
        </div>

        {/* Grid Layout for Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Registration Status Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              Registration Status
            </h3>

            <div className="flex-grow flex flex-col items-center justify-center text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              {myInvoices.some(inv => inv.status === 'approved') ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-5 shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-emerald-700">Approved</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">Your registration has been fully approved for this semester.</p>
                </>
              ) : myInvoices.some(inv => inv.status === 'pending' || inv.status === 'paid') ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-5 shadow-sm">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-blue-700">Pending Approval</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">Your registration is currently being reviewed by the Accounts department.</p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-full mb-5 shadow-sm">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-amber-700">Not Registered</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">You need to complete your registration to access your academic results.</p>
                </>
              )}
            </div>
          </div>

          {/* Academic Status Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              Academic Status
            </h3>

            <div className="flex-grow flex flex-col items-center justify-center text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              {myResults.length === 0 ? (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 text-slate-400 rounded-full mb-5">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-600">Awaiting Results</h4>
                  <p className="text-sm text-slate-500 mt-2 max-w-xs">Your results have not been published or are pending approval.</p>
                </>
              ) : (
                <>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 shadow-sm ${allPassed ? 'bg-emerald-100 text-emerald-600' : hasFail ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <StatusIcon className="w-8 h-8" />
                  </div>
                  <h4 className={`text-2xl font-bold tracking-tight ${overallStatusColor}`}>
                    {overallStatus}
                  </h4>
                  <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-sm text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    {myResults.length} of 3 courses completed
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ========== REGISTRATION VIEW ==========
  if (active === 'registration') {
    return <StudentRegistration toast={toast} setToast={setToast} />;
  }

  // ========== INVOICES VIEW ==========
  if (active === 'invoices') {
    return <StudentInvoices />;
  }

  // ========== RESULTS VIEW ==========
  if (active === 'results') {
    return <StudentResults />;
  }

  // ========== HISTORY VIEW ==========
  if (active === 'history') {
    return <StudentHistory />;
  }

  return null;
};

export default StudentDash;
