import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { StatCard, Badge, PageHeader, Button, Table, Toast, Modal } from '@/components/shared/UI';
import { Receipt, Check, Users, TrendingUp, Eye } from 'lucide-react';
import AccountsFees from './AccountsFees';
import AccountsApproval from './AccountsApproval';
import AccountsRegistered from './AccountsRegistered';

// const AccountsDash: React.FC<{ active: string }> = ({ active }) => {
const AccountsDash: React.FC<{ active: string; setActive?: (tab: string) => void }> = ({ active, setActive }) => {

  const { students, currentUser, apiRequest } = useEMIS();
  const { 
    verifyPaymentPhysical, 
    invoices, 
 
    fetchInvoices
  } = useRegistration();
  const [toast, setToast] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);

  
  
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

  // Calculate stats using invoices (matching AccountsApproval logic)
  const pendingInvoicesList = invoices.filter(i => i.status === 'pending' || i.status === 'paid'); // Receipt uploaded, awaiting approval
  const approvedRegistrations = invoices.filter(i => i.status === 'approved').length;
  const totalRegisteredStudents = invoices.length;
  const totalRevenue = invoices.filter(i => i.status === 'approved').reduce((sum, i) => sum + i.amount, 0);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => String(s.id) === String(studentId));
    return student?.name || 'Unknown';
  };

  const handlePhysicalVerify = async (invoiceId: string) => {
    await verifyPaymentPhysical(invoiceId, currentUser!.id);
    await fetchInvoices();
    setToast('Payment verified');
  };

  // DASHBOARD VIEW
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Accounts Dashboard" subtitle="Manage student registrations and fee structure" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard 
            label="All registration attempts" 
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
            label="Pending Registration Approval" 
            value={pendingInvoicesList.length} 
            icon={Receipt} 
            color="bg-amber-600" 
          />
       
        
          <StatCard 
            label="Total Revenue" 
            value={`K${totalRevenue.toLocaleString()}`} 
            icon={TrendingUp} 
            color="bg-purple-600" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Pending Registrations</h3>
              {/* <Button variant="primary" onClick={() => window.location.href = '#invoices'}>View All</Button> */}
              <Button variant="primary" onClick={() => setActive && setActive('registered')}>View All</Button>
            </div>
            <Table headers={['Student', 'Level', 'Amount', 'Receipt', 'Payment Verified', 'Action']} rowCount={Math.min(pendingInvoicesList.length, 5)}>
              {pendingInvoicesList.slice(0, 5).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{getStudentName(inv.studentId)}</td>
                  <td className="px-4 py-3 text-center">Level {inv.level}</td>
                  <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    {inv.receiptImage ? <Badge status="success">Uploaded</Badge> : <Badge status="warning">No Receipt</Badge>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {inv.physicalVerified ? 
                      <Badge status="success">Verified ✓</Badge> :
                      <button onClick={() => handlePhysicalVerify(inv.id)} className="text-blue-600 hover:text-blue-800 text-xs">
                        Verify Payment
                      </button>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <button 
                      onClick={() => setSelectedInvoice(inv)} 
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                    >
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
             <Button variant="primary" onClick={() => setActive && setActive('fees')}>Manage Fees</Button>
            </div>
            <div className="space-y-2">
              {feeStructuresList.slice(0, 5).map(fee => (
  <div key={fee.id} className="flex justify-between items-center p-2 border-b border-slate-100">
    <div>
      <span className="font-medium text-sm">{fee.program_name}</span>
      <span className="text-xs text-slate-500 ml-2">Level {fee.level}</span>
    </div>
    <span className="font-bold text-emerald-600">K{fee.full_level_amount?.toLocaleString()}</span>
  </div>
))}
{(!feeStructuresList || feeStructuresList.length === 0) && 
  <p className="text-center text-slate-400 py-4">No fee structures configured</p>
}
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
        <Modal open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title="Payment Receipt" size="lg">
          {selectedInvoice && (
            <div>
              {selectedInvoice.receiptImage && (
                <img src={selectedInvoice.receiptImage} alt="Receipt" className="max-h-96 mx-auto rounded-lg border" />
              )}
              <div className="mt-4 text-center text-sm text-slate-500">
                Student: {getStudentName(selectedInvoice.studentId)}
              </div>
            </div>
          )}
        </Modal>
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

  // if (active === 'registered') {
  //   return <AccountsRegistered />;
  // }

  return null;
};

export default AccountsDash;