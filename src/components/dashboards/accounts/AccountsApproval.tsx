import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Badge, Table, Button, Modal, Field, Input, Toast } from '@/components/shared/UI';
import { Eye, Check, X } from 'lucide-react';

const AccountsApproval: React.FC = () => {
    const { currentUser, students } = useEMIS();
    const { invoices, approveInvoice, rejectInvoice, verifyPaymentPhysical, fetchInvoices } = useRegistration();
    const [toast, setToast] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const getStudentName = (studentId: string) => {
        const student = students.find(s => String(s.id) === String(studentId));
        return student?.name || 'Unknown';
    };

    const handleApprove = (invoice: any) => {
        approveInvoice(invoice.id, currentUser!.id);
        setToast('Registration approved');
    };

    const handleReject = (invoice: any) => {
        if (!rejectionReason) {
            setToast('Please provide a rejection reason');
            return;
        }
        rejectInvoice(invoice.id, rejectionReason);
        setShowRejectModal(false);
        setRejectionReason('');
        setToast('Registration rejected');
    };

    const handleVerifyPayment = (invoiceId: string) => {
        verifyPaymentPhysical(invoiceId, currentUser!.id);
        setToast('Payment verified');
    };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader title="Registration Approval" subtitle="Review student registrations" />

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Payment Verified', 'Status', 'Actions']} rowCount={invoices.length}>
                    {invoices.map(inv => (
                        <tr key={inv.id}>
                            <td className="px-4 py-3 font-medium text-sm">{getStudentName(inv.studentId)}</td>
                            <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
                            <td className="px-4 py-3 text-sm">{inv.programName}</td>
                            <td className="px-4 py-3 text-center">Level {inv.level}</td>
                            <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                                {inv.physicalVerified ? (
                                    <Badge status="success">Verified ✓</Badge>
                                ) : (
                                    <button 
                                        onClick={() => handleVerifyPayment(inv.id)} 
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                        Verify Payment
                                    </button>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                {inv.status === 'pending' && <Badge status="warning">Pending</Badge>}
                                {inv.status === 'paid' && <Badge status="info">Receipt Uploaded</Badge>}
                                {inv.status === 'approved' && <Badge status="success">Approved</Badge>}
                                {inv.status === 'rejected' && <Badge status="error">Rejected</Badge>}
                            </td>
                            <td className="px-4 py-3">
                                {inv.status === 'paid' && (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedInvoice(inv)}
                                            className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(inv)}
                                            className="p-1.5 hover:bg-slate-100 rounded text-emerald-600"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setShowRejectModal(true)}
                                            className="p-1.5 hover:bg-slate-100 rounded text-red-600"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </Table>
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

            {/* Reject Modal */}
            <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Registration">
                <div className="space-y-4">
                    <Field label="Rejection Reason" required>
                        <Input 
                            value={rejectionReason} 
                            onChange={e => setRejectionReason(e.target.value)} 
                            placeholder="Enter reason for rejection..." 
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                        <Button variant="danger" onClick={() => handleReject(selectedInvoice)}>Confirm Rejection</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AccountsApproval;

// import React, { useState } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Badge, Table, Button, Modal, Field, Input, Toast } from '@/components/shared/UI';
// import { Eye, Check, X } from 'lucide-react';

// const AccountsApproval: React.FC = () => {
//     const { currentUser, students } = useEMIS();
//     const { invoices, approveInvoice, rejectInvoice, verifyPaymentPhysical } = useRegistration();
//     // You need to do this from inside the component
// // Add this debug code temporarily:

// setTimeout(() => {
//     console.log('Students IDs:', students.map(s => ({ id: s.id, name: s.name })));
//     console.log('Invoices studentIds:', invoices.map(i => ({ studentId: i.studentId, studentReg: i.studentReg })));
// }, 3000);
//     const [toast, setToast] = useState('');
//     const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//     const [invoiceModal, setInvoiceModal] = useState(false);
//     const [rejectionReason, setRejectionReason] = useState('');
//     const [showRejectModal, setShowRejectModal] = useState(false);

//  const getStudentName = (studentId: string) => {
//     const student = students.find(s => String(s.id) === String(studentId));
//     return student?.name || 'Unknown';
// };

//     const handleViewInvoice = (invoice: any) => {
//         setSelectedInvoice(invoice);
//         setInvoiceModal(true);
//     };

//     const handleApproveInvoice = () => {
//         if (!selectedInvoice) return;
//         approveInvoice(selectedInvoice.id, currentUser!.id);
//         setInvoiceModal(false);
//         setSelectedInvoice(null);
//         setToast('Registration approved. Student can now access results.');
//     };

//     const handleRejectInvoice = () => {
//         if (!selectedInvoice || !rejectionReason) {
//             setToast('Please provide a rejection reason');
//             return;
//         }
//         rejectInvoice(selectedInvoice.id, rejectionReason);
//         setShowRejectModal(false);
//         setInvoiceModal(false);
//         setSelectedInvoice(null);
//         setRejectionReason('');
//         setToast('Registration rejected');
//     };

//     const handlePhysicalVerify = (invoiceId: string) => {
//         verifyPaymentPhysical(invoiceId, currentUser!.id);
//         setToast('Physical payment verified');
//     };

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader title="Registration Approval" subtitle="Review and approve student registrations" />

//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                 <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Receipt', 'Physical', 'Status', 'Actions']} rowCount={invoices.length}>
//                   {invoices.map(inv => {
//     return (
//         <tr key={inv.id}>
//             <td className="px-4 py-3 font-medium text-sm">{getStudentName(inv.studentId)}</td>
//                                 <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
//                                 <td className="px-4 py-3 text-sm">{inv.programName}</td>
//                                 <td className="px-4 py-3 text-center">Level {inv.level}</td>
//                                 <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
//                                 <td className="px-4 py-3 text-center">
//                                     {inv.receiptImage ? (
//                                         <button onClick={() => handleViewInvoice(inv)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
//                                             <Eye className="w-3 h-3" /> View
//                                         </button>
//                                     ) : (
//                                         <Badge status="warning">No Receipt</Badge>
//                                     )}
//                                 </td>
//                                 <td className="px-4 py-3 text-center">
//                                     {inv.physicalVerified ? (
//                                         <Badge status="success">Verified</Badge>
//                                     ) : (
//                                         <button onClick={() => handlePhysicalVerify(inv.id)} className="text-blue-600 hover:text-blue-800 text-xs">
//                                             Mark Verified
//                                         </button>
//                                     )}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                     {inv.status === 'pending' && <Badge status="warning">Pending</Badge>}
//                                     {inv.status === 'paid' && <Badge status="info">Paid</Badge>}
//                                     {inv.status === 'approved' && <Badge status="success">Approved</Badge>}
//                                     {inv.status === 'rejected' && <Badge status="error">Rejected</Badge>}
//                                 </td>
//                                 <td className="px-4 py-3">
//                                     {(inv.status === 'paid' || (inv.receiptImage && inv.status !== 'approved')) && (
//                                         <button onClick={() => handleViewInvoice(inv)} className="p-1.5 hover:bg-slate-100 rounded text-emerald-600">
//                                             <Check className="w-4 h-4" />
//                                         </button>
//                                     )}
//                                 </td>
//                             </tr>
//                         );
//                     })}
//                 </Table>
//             </div>

//             <Modal open={invoiceModal} onClose={() => setInvoiceModal(false)} title="Registration Details" size="lg">
//                 {selectedInvoice && (
//                     <div className="space-y-4">
//                         <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
//                             <div>
//                                 <p className="text-xs text-slate-500">Student Name</p>
//                                 <p className="font-medium">{getStudentName(selectedInvoice.studentId)}</p>
//                             </div>
//                             <div>
//                                 <p className="text-xs text-slate-500">Registration Number</p>
//                                 <p className="font-mono text-sm">{selectedInvoice.studentReg}</p>
//                             </div>
//                             <div>
//                                 <p className="text-xs text-slate-500">Program</p>
//                                 <p className="font-medium">{selectedInvoice.programName}</p>
//                             </div>
//                             <div>
//                                 <p className="text-xs text-slate-500">Level</p>
//                                 <p className="font-medium">Level {selectedInvoice.level}</p>
//                             </div>
//                             <div>
//                                 <p className="text-xs text-slate-500">Amount Paid</p>
//                                 <p className="font-bold text-lg text-emerald-600">K{selectedInvoice.amount.toLocaleString()}</p>
//                             </div>
//                             <div>
//                                 <p className="text-xs text-slate-500">Type</p>
//                                 <Badge status={selectedInvoice.type === 'repeater' ? 'warning' : 'success'}>
//                                     {selectedInvoice.type === 'repeater' ? 'Repeater' : 'Full Level'}
//                                 </Badge>
//                             </div>
//                         </div>

//                         {selectedInvoice.failedCourses && selectedInvoice.failedCourses.length > 0 && (
//                             <div className="bg-amber-50 p-3 rounded-lg">
//                                 <p className="text-sm font-medium text-amber-800">Failed Courses (Repeater)</p>
//                                 <div className="flex gap-2 mt-1">
//                                     {selectedInvoice.failedCourses.map((course: string) => (
//                                         <span key={course} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">{course}</span>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}

//                         {selectedInvoice.receiptImage && (
//                             <div>
//                                 <p className="text-sm font-medium text-slate-700 mb-2">Payment Receipt</p>
//                                 <img src={selectedInvoice.receiptImage} alt="Receipt" className="max-h-64 rounded-lg border border-slate-200" />
//                             </div>
//                         )}

//                         <div className="flex justify-between gap-2 pt-4 border-t border-slate-200">
//                             <Button variant="danger" onClick={() => setShowRejectModal(true)}>
//                                 <X className="w-4 h-4 mr-1" /> Reject Registration
//                             </Button>
//                             <Button variant="success" onClick={handleApproveInvoice}>
//                                 <Check className="w-4 h-4 mr-1" /> Approve Registration
//                             </Button>
//                         </div>
//                     </div>
//                 )}

//                 <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Registration">
//                     <div className="space-y-4">
//                         <Field label="Rejection Reason" required>
//                             <Input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Enter reason for rejection..." />
//                         </Field>
//                         <div className="flex justify-end gap-2">
//                             <Button type="button" variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
//                             <Button variant="danger" onClick={handleRejectInvoice}>Confirm Rejection</Button>
//                         </div>
//                     </div>
//                 </Modal>
//             </Modal>
//         </div>
//     );
// };

// export default AccountsApproval;