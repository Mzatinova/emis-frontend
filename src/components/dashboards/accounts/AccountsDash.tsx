import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { StatCard, Badge, PageHeader, Button, Table, Toast, Modal } from '@/components/shared/UI';
import { Receipt, Check, Users, TrendingUp, Eye, Clock } from 'lucide-react';
import AccountsFees from './AccountsFees';
import AccountsApproval from './AccountsApproval';
import AccountsRegistered from './AccountsRegistered';

const AccountsDash: React.FC<{ active: string; setActive?: (tab: string) => void }> = ({ active, setActive }) => {

  const { students, currentUser, apiRequest, sessions } = useEMIS();
  const { 
    
    invoices, 
    fetchInvoices
  } = useRegistration();
  const [toast, setToast] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);

  const currentSession = sessions.find(s => s.active === true);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      const response = await apiRequest('/fee-structures');
      if (response.data) {
        setFeeStructuresList(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
    }
  };

  // Filter invoices by current session only
  const currentSessionInvoices = currentSession 
    ? invoices.filter(i => String(i.academic_session_id) === String(currentSession.id))
    : [];

  // Calculate stats using current session invoices only
  const pendingInvoicesList = currentSessionInvoices.filter(i => i.status === 'pending' || i.status === 'paid');
  const approvedRegistrations = currentSessionInvoices.filter(i => i.status === 'approved').length;
  const totalRegisteredStudents = currentSessionInvoices.length;
  const totalRevenue = currentSessionInvoices.filter(i => i.status === 'approved').reduce((sum, i) => sum + i.amount, 0);

  // Filter fee structures by current session only
  const currentSessionFees = currentSession
    ? feeStructuresList.filter(fee => fee.academic_session_id && String(fee.academic_session_id) === String(currentSession.id))
    : [];

  const getStudentName = (studentId: string) => {
    const student = students.find(s => String(s.id) === String(studentId));
    return student?.name || 'Unknown';
  };

  // const handlePhysicalVerify = async (invoiceId: string) => {
  //   await verifyPaymentPhysical(invoiceId, currentUser!.id);
  //   await fetchInvoices();
  //   setToast('Payment verified');
  // };

  // DASHBOARD VIEW
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Accounts Dashboard" subtitle="Manage student registrations and fee structure" />

        {!currentSession && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">No Active Academic Session</p>
                <p className="text-sm text-amber-600">Please activate a session to start registration.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Total Registered (Current Session)" 
            value={totalRegisteredStudents} 
            icon={Users} 
            color="bg-blue-600" 
          />
          <StatCard 
            label="Approved Registrations" 
            value={approvedRegistrations} 
            icon={Check} 
            color="bg-emerald-600" 
          />
          <StatCard 
            label="Pending Approval" 
            value={pendingInvoicesList.length} 
            icon={Receipt} 
            color="bg-amber-600" 
          />
          <StatCard 
            label="Total Revenue (Current Session)" 
            value={`K${totalRevenue.toLocaleString()}`} 
            icon={TrendingUp} 
            color="bg-purple-600" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Pending Registrations ({currentSession?.year})</h3>
              <Button variant="primary" onClick={() => setActive && setActive('registered')}>View All</Button>
            </div>
            <Table headers={['Student', 'Level', 'Amount','Payment Verified']} rowCount={Math.min(pendingInvoicesList.length, 5)}>
              {pendingInvoicesList.slice(0, 5).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{getStudentName(inv.studentId)}</td>
                  <td className="px-4 py-3 text-center">Level {inv.level}</td>
                  <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                
                  <td className="px-4 py-3 text-center">
                 {inv.status === 'approved' ? (
    <Badge status="success">Verified ✓</Badge>
) : (
    <Badge status="warning">Pending Payment</Badge>
)}
                  </td>
                  
                </tr>
              ))}
            </Table>
            {pendingInvoicesList.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No pending registrations for current session
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Fee Structure ({currentSession?.year})</h3>
              <Button variant="primary" onClick={() => setActive && setActive('fees')}>Manage Fees</Button>
            </div>
            <div className="space-y-2">
              {currentSessionFees.slice(0, 5).map(fee => (
                <div key={fee.id} className="flex justify-between items-center p-2 border-b border-slate-100">
                  <div>
                    <span className="font-medium text-sm">{fee.program_name}</span>
                    <span className="text-xs text-slate-500 ml-2">Level {fee.level}</span>
                  </div>
                  <span className="font-bold text-emerald-600">K{fee.full_level_amount?.toLocaleString()}</span>
                </div>
              ))}
              {currentSessionFees.length === 0 && (
                <p className="text-center text-slate-400 py-4">No fee structures set for current session</p>
              )}
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
     
      </div>
    );
  }

  // EXTRACTED COMPONENTS
  if (active === 'invoices') {
    return <AccountsApproval />;
  }

  if (active === 'fees') {
    return <AccountsFees />;
  }

  if (active === 'registered') {
    return <AccountsRegistered initialFilter="pending" />;
  }

  return null;
};

export default AccountsDash;