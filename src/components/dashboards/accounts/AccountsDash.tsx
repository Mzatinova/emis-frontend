import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { StatCard, Badge, PageHeader, Button, Table, Toast } from '@/components/shared/UI';
import { Receipt, Check, Users, TrendingUp, Eye } from 'lucide-react';
import AccountsFees from './AccountsFees';
import AccountsApproval from './AccountsApproval';
import AccountsRegistered from './AccountsRegistered';

const AccountsDash: React.FC<{ active: string }> = ({ active }) => {
  const { students } = useEMIS();
  const { getPendingInvoices, verifyPaymentPhysical, invoices, registrations, feeStructures } = useRegistration();
  const [toast, setToast] = useState('');

  const pendingInvoices = getPendingInvoices();
  const approvedRegistrations = registrations.filter(r => r.registrationStatus === 'approved');
  const totalRevenue = invoices.filter(i => i.status === 'approved').reduce((sum, i) => sum + i.amount, 0);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown';
  };

  const handlePhysicalVerify = (invoiceId: string) => {
    verifyPaymentPhysical(invoiceId, 'currentUser!.id');
    setToast('Physical payment verified');
  };

  // DASHBOARD VIEW (stays here)
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Accounts Dashboard" subtitle="Manage student registrations and fee structure" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Pending Registrations" value={pendingInvoices.length} icon={Receipt} color="bg-amber-600" />
          <StatCard label="Approved Registrations" value={approvedRegistrations.length} icon={Check} color="bg-emerald-600" />
          <StatCard label="Total Students Registered" value={registrations.length} icon={Users} color="bg-blue-600" />
          <StatCard label="Total Revenue" value={`K${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-purple-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Pending Registrations</h3>
              <Button variant="primary" onClick={() => window.location.href = '#invoices'}>View All</Button>
            </div>
            <Table headers={['Student', 'Level', 'Amount', 'Receipt', 'Physical', 'Action']} rowCount={Math.min(pendingInvoices.length, 5)}>
              {pendingInvoices.slice(0, 5).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{getStudentName(inv.studentId)}</td>
                  <td className="px-4 py-3 text-center">Level {inv.level}</td>
                  <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    {inv.receiptImage ? <Badge status="success">Uploaded</Badge> : <Badge status="warning">No Receipt</Badge>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inv.physicalVerified ? <Badge status="success">Verified</Badge> :
                      <button onClick={() => handlePhysicalVerify(inv.id)} className="text-blue-600 hover:text-blue-800 text-xs">Mark Verified</button>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { }} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Fee Structure Summary</h3>
              <Button variant="primary" onClick={() => window.location.href = '#fees'}>Manage Fees</Button>
            </div>
            <div className="space-y-2">
              {feeStructures.slice(0, 5).map(fee => (
                <div key={fee.id} className="flex justify-between items-center p-2 border-b border-slate-100">
                  <div><span className="font-medium text-sm">{fee.programName}</span><span className="text-xs text-slate-500 ml-2">Level {fee.level}</span></div>
                  <span className="font-bold text-emerald-600">K{fee.amount.toLocaleString()}</span>
                </div>
              ))}
              {feeStructures.length === 0 && <p className="text-center text-slate-400 py-4">No fee structures configured</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EXTRACTED - just import and return
  if (active === 'invoices') {
    return <AccountsApproval />;
  }

  if (active === 'fees') {
    return <AccountsFees />;
  }

  if (active === 'registered') {
    return <AccountsRegistered />;
  }

  return null;
};

export default AccountsDash;
