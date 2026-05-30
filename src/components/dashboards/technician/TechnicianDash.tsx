import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { StatCard, PageHeader, Toast } from '@/components/shared/UI';
import { Users, ScrollText, GraduationCap, BookOpen, Activity } from 'lucide-react';
import TechnicianStaff from './TechnicianStaff';
import TechnicianStudent from './TechnicianStudent';
import TechnicianAudit from './TechnicianAudit';

const TechnicianDash: React.FC<{ active: string }> = ({ active }) => {
  const { users, students, courses, audits } = useEMIS();
  const [toast, setToast] = useState('');

  // DASHBOARD VIEW
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Technician Dashboard" subtitle="System super admin overview" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Staff" value={users.length} icon={Users} color="bg-purple-600" sub="Including technician" />
          <StatCard label="Total Students" value={students.length} icon={GraduationCap} color="bg-blue-600" />

          <StatCard label="Audit Entries" value={audits.length} icon={ScrollText} color="bg-amber-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" />Recent Activity</h3>
            <div className="space-y-3">
              {audits.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{a.action}</p>
                    <p className="text-xs text-slate-500 truncate">{a.details}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Users by Role</h3>
            <div className="space-y-3">
              {(['administrator', 'instructor', 'accounts', 'student'] as const).map(r => {
                const count = r === 'student' ? students.length : users.filter(u => u.role === r).length;
                return (
                  <div key={r} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-slate-700 capitalize">{r}</span>
                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STAFF USER MANAGEMENT VIEW
  if (active === 'users') {
    return <TechnicianStaff toast={toast} setToast={setToast} />;
  }

  // STUDENT MANAGEMENT VIEW
  if (active === 'students') {
    return <TechnicianStudent toast={toast} setToast={setToast} />;
  }

  // AUDIT VIEW
  if (active === 'audit') {
    return <TechnicianAudit />;
  }

  return null;
};

export default TechnicianDash;
