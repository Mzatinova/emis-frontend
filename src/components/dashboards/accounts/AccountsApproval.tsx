import React, { useState, useEffect, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Badge, Table, Button, Modal, Field, Input, Toast } from '@/components/shared/UI';
import { Eye, Check, X, CheckSquare, Square } from 'lucide-react';

const AccountsApproval: React.FC = () => {
    const { currentUser, students, sessions  } = useEMIS();
    const { invoices, approveInvoice, rejectInvoice, verifyPaymentPhysical, fetchInvoices } = useRegistration();
    const [toast, setToast] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const currentSession = sessions.find(s => s.active === true);

    useEffect(() => {
        fetchInvoices();
    }, []);

//     const filteredInvoices = useMemo(() => {
//     if (!searchTerm) return invoices;
//     const term = searchTerm.toLowerCase();
//     return invoices.filter(inv => 
//         getStudentName(inv.studentId).toLowerCase().includes(term) ||
//         inv.studentReg.toLowerCase().includes(term)
//     );
// }, [invoices, searchTerm]);

// const filteredInvoices = useMemo(() => {
//     if (!searchTerm) return invoices;
//     const term = searchTerm.toLowerCase();
//     return invoices.filter(inv => {
//         const student = students.find(s => String(s.id) === String(inv.studentId));
//         const studentName = student?.name?.toLowerCase() || '';
//         return studentName.includes(term) || inv.studentReg.toLowerCase().includes(term);
//     });
// }, [invoices, searchTerm, students]);

const currentSessionInvoices = useMemo(() => {
    if (!currentSession) return [];
    return invoices.filter(inv => String(inv.academic_session_id) === String(currentSession.id));
}, [invoices, currentSession]);

const filteredInvoices = useMemo(() => {
    let sessionFiltered = currentSessionInvoices;
    if (!searchTerm) return sessionFiltered;
    const term = searchTerm.toLowerCase();
    return sessionFiltered.filter(inv => {
        const student = students.find(s => String(s.id) === String(inv.studentId));
        const studentName = student?.name?.toLowerCase() || '';
        return studentName.includes(term) || inv.studentReg.toLowerCase().includes(term);
    });
}, [currentSessionInvoices, searchTerm, students]);

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

    const toggleSelectInvoice = (invoiceId: string) => {
        const newSelected = new Set(selectedInvoices);
        if (newSelected.has(invoiceId)) {
            newSelected.delete(invoiceId);
        } else {
            newSelected.add(invoiceId);
        }
        setSelectedInvoices(newSelected);
    };


//     const toggleSelectAll = () => {
//     const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
//     if (selectedInvoices.size === pendingInvoices.length) {
//         setSelectedInvoices(new Set());
//     } else {
//         setSelectedInvoices(new Set(pendingInvoices.map(inv => inv.id)));
//     }
// };

const toggleSelectAll = () => {
    const pendingInvoices = currentSessionInvoices.filter(inv => inv.status === 'pending');
    if (selectedInvoices.size === pendingInvoices.length) {
        setSelectedInvoices(new Set());
    } else {
        setSelectedInvoices(new Set(pendingInvoices.map(inv => inv.id)));
    }
};


    const handleBulkApprove = () => {
        if (selectedInvoices.size === 0) {
            setToast('No registrations selected');
            return;
        }
        setShowBulkModal(true);
    };


    const confirmBulkApprove = () => {
    selectedInvoices.forEach(invoiceId => {
        approveInvoice(invoiceId, currentUser!.id);
        // Also mark payment as verified
        verifyPaymentPhysical(invoiceId, currentUser!.id);
    });
    setToast(`${selectedInvoices.size} registrations approved and payment verified`);
    setSelectedInvoices(new Set());
    setShowBulkModal(false);
};

    // const confirmBulkApprove = () => {
    //     selectedInvoices.forEach(invoiceId => {
    //         approveInvoice(invoiceId, currentUser!.id);
    //     });
    //     setToast(`${selectedInvoices.size} registrations approved`);
    //     setSelectedInvoices(new Set());
    //     setShowBulkModal(false);
    // };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            {/* <PageHeader title="Registration Approval" subtitle="Review student registrations" /> */}
            <PageHeader
                title="Registration Approval"
                subtitle="Review student registrations"
                action={
                    <Button
                        variant="primary"
                        onClick={handleBulkApprove}
                        disabled={selectedInvoices.size === 0}
                    >
                        <CheckSquare className="w-4 h-4 mr-1" />
                        Approve Selected ({selectedInvoices.size})
                    </Button>
                }
            />

<div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    {/* Search and Select All Bar */}
    <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
                <input
                    type="text"
                    placeholder="Search by student name or registration number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            
            {/* Select All Button */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={toggleSelectAll} 
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                >
                  
                    {/* {selectedInvoices.size === invoices.filter(i => i.status === 'pending').length && invoices.filter(i => i.status === 'pending').length > 0 ? */}
                    {selectedInvoices.size === currentSessionInvoices.filter(i => i.status === 'pending').length && currentSessionInvoices.filter(i => i.status === 'pending').length > 0 ?
                        <CheckSquare className="w-4 h-4 text-emerald-600" /> :
                        <Square className="w-4 h-4 text-slate-500" />
                    }
                    <span>Select All Pending</span>
                </button>
                <span className="text-sm text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    {selectedInvoices.size} selected
                </span>
            </div>
        </div>
    </div>
    
    <Table headers={['Select', 'Student', 'Reg No', 'Program', 'Level', 'Amount', 'Payment Verified', 'Status', 'Actions']} rowCount={filteredInvoices.length}>
        {filteredInvoices.map(inv => (
            <tr key={inv.id} className={selectedInvoices.has(inv.id) ? 'bg-emerald-50' : ''}>
                <td className="px-4 py-3 text-center">
                    {inv.status === 'pending' && (
    <button onClick={() => toggleSelectInvoice(inv.id)}>
                            {selectedInvoices.has(inv.id) ?
                                <CheckSquare className="w-4 h-4 text-emerald-600" /> :
                                <Square className="w-4 h-4 text-slate-400" />
                            }
                        </button>
                    )}
                </td>
                <td className="px-4 py-3 font-medium text-sm">{getStudentName(inv.studentId)}</td>
                <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
                <td className="px-4 py-3 text-sm">{inv.programName}</td>
                <td className="px-4 py-3 text-center">Level {inv.level}</td>
                <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                    {inv.physicalVerified ? (
                        <Badge status="success">Verified ✓</Badge>
                    ) : (
                        <button onClick={() => handleVerifyPayment(inv.id)} className="text-blue-600 hover:text-blue-800 text-xs">
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
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
            >
                View Receipt
            </button>
            <button 
                onClick={() => handleApprove(inv)} 
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
            >
                Approve
            </button>
            <button 
                onClick={() => setShowRejectModal(true)} 
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
            >
                Reject
            </button>
        </div>
    )}
</td>
                {/* <td className="px-4 py-3">
                    {inv.status === 'paid' && (
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-slate-100 rounded text-blue-600">
                                <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleApprove(inv)} className="p-1.5 hover:bg-slate-100 rounded text-emerald-600">
                                <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setShowRejectModal(true)} className="p-1.5 hover:bg-slate-100 rounded text-red-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </td> */}
            </tr>
        ))}
    </Table>
</div>
            {/* <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
                            {selectedInvoices.size === invoices.filter(i => i.status === 'paid').length && invoices.filter(i => i.status === 'paid').length > 0 ?
                                <CheckSquare className="w-4 h-4 text-emerald-600" /> :
                                <Square className="w-4 h-4 text-slate-400" />
                            }
                            Select All
                        </button>
                        <span className="text-xs text-slate-400">
                            ({selectedInvoices.size} selected)
                        </span>
                    </div>
                </div>
                <Table headers={['Select','Student', 'Reg No', 'Program', 'Level', 'Amount', 'Payment Verified', 'Status', 'Actions']} rowCount={invoices.length}>
                    {invoices.map(inv => (
                        // <tr key={inv.id}>
                        <tr key={inv.id} className={selectedInvoices.has(inv.id) ? 'bg-emerald-50' : ''}>
                            
                            <td className="px-4 py-3 text-center">
                                {inv.status === 'paid' && (
                                    <button onClick={() => toggleSelectInvoice(inv.id)}>
                                        {selectedInvoices.has(inv.id) ?
                                            <CheckSquare className="w-4 h-4 text-emerald-600" /> :
                                            <Square className="w-4 h-4 text-slate-400" />
                                        }
                                    </button>
                                )}
                            </td>
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
            </div> */}

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
            <Modal open={showBulkModal} onClose={() => setShowBulkModal(false)} title="Confirm Bulk Approval" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        You are about to approve <strong>{selectedInvoices.size}</strong> registration(s).
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                        <Button variant="success" onClick={confirmBulkApprove}>
                            <Check className="w-4 h-4 mr-1" />
                            Confirm Approve
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AccountsApproval;

