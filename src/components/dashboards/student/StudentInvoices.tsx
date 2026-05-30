// src/components/dashboard/student/StudentInvoices.tsx
import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge, Button, Modal, Toast } from '@/components/shared/UI';
import { Upload } from 'lucide-react';

const StudentInvoices: React.FC = () => {
    const { currentUser, myInvoices, apiRequest, fetchRegistrationData } = useEMIS();
    const [toast, setToast] = useState('');
    const [receiptModal, setReceiptModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [receiptImage, setReceiptImage] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadReceipt = async () => {
        if (!receiptImage) {
            setToast('Please select a receipt image');
            return;
        }
        setUploading(true);
        try {
            await apiRequest(`/registration/upload-receipt/${selectedInvoice.id}`, 'POST', {
                receipt_image: receiptImage
            });
            setToast('Receipt uploaded successfully');
            setReceiptModal(false);
            setReceiptImage('');
            // Refresh invoices after upload
            if (currentUser?.id) {
                await fetchRegistrationData(currentUser.id);
            }
        } catch (error: any) {
            console.error('Failed to upload receipt:', error);
            setToast(error.message || 'Failed to upload receipt');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge status="warning">Pending</Badge>;
            case 'paid': return <Badge status="info">Receipt Uploaded</Badge>;
            case 'approved': return <Badge status="success">Approved</Badge>;
            case 'rejected': return <Badge status="error">Rejected</Badge>;
            default: return <Badge status="default">{status}</Badge>;
        }
    };

    const invoices = myInvoices || [];

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader title="My Invoices" subtitle="Track your payment history" />

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {invoices.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500">No invoices found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Invoice #</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Level</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50 border-b border-slate-100">
                                    <td className="px-4 py-3 font-mono text-xs">#{String(inv.id).slice(-8)}</td>
                                    <td className="px-4 py-3">Level {inv.level}</td>
                                    <td className="px-4 py-3 font-medium">K{Number(inv.amount).toLocaleString()}</td>
                                    <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                                    <td className="px-4 py-3 text-xs">{new Date(inv.created_at || inv.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        {(inv.status === 'pending' || inv.status === 'rejected') && (
                                            <Button
                                                variant="secondary"
                                                className="px-3 py-1.5 text-sm"
                                                onClick={() => {
                                                    setSelectedInvoice(inv);
                                                    setReceiptModal(true);
                                                }}
                                            >
                                                <Upload className="w-3 h-3 inline mr-1" />
                                                Upload Receipt
                                            </Button>
                                        )}
                                        {inv.status === 'approved' && (
                                            <span className="text-xs text-emerald-600">✓ Paid</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Receipt Upload Modal */}
            <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Upload Payment Receipt" size="lg">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Please upload a clear image of your payment receipt for verification.
                    </p>
                    {selectedInvoice?.rejection_reason && (
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-red-800">Previous rejection reason:</p>
                            <p className="text-sm text-red-700">{selectedInvoice.rejection_reason}</p>
                        </div>
                    )}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="receipt-upload"
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer block">
                            {receiptImage ? (
                                <div className="space-y-2">
                                    <img src={receiptImage} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
                                    <p className="text-sm text-emerald-600">✓ Receipt loaded. Click to change.</p>
                                </div>
                            ) : (
                                <div className="py-8">
                                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">Click to select receipt image</p>
                                    <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
                                </div>
                            )}
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setReceiptModal(false)}>Cancel</Button>
                        <Button onClick={handleUploadReceipt} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Submit Receipt'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentInvoices;


// // src/components/dashboard/student/StudentInvoices.tsx
// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Badge, Button, Table, Modal, Toast } from '@/components/shared/UI';
// import { Upload, Loader2 } from 'lucide-react';

// const StudentInvoices: React.FC = () => {
//     const { currentUser, myInvoices, apiRequest, fetchRegistrationData } = useEMIS();
//     const [toast, setToast] = useState('');
//     const [receiptModal, setReceiptModal] = useState(false);
//     const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//     const [receiptImage, setReceiptImage] = useState<string>('');
//     const [uploading, setUploading] = useState(false);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const loadInvoices = async () => {
//             if (currentUser?.id) {
//                 setLoading(true);
//                 await fetchRegistrationData(currentUser.id);
//                 setLoading(false);
//             }
//         };
//         loadInvoices();
//     }, [currentUser?.id]);

//     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setReceiptImage(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const handleUploadReceipt = async () => {
//         if (!receiptImage) {
//             setToast('Please select a receipt image');
//             return;
//         }
//         setUploading(true);
//         try {
//             await apiRequest(`/registration/upload-receipt/${selectedInvoice.id}`, 'POST', {
//                 receipt_image: receiptImage
//             });
//             setToast('Receipt uploaded successfully');
//             setReceiptModal(false);
//             setReceiptImage('');
//             // Refresh invoices
//             if (currentUser?.id) {
//                 await fetchRegistrationData(currentUser.id);
//             }
//         } catch (error: any) {
//             console.error('Failed to upload receipt:', error);
//             setToast(error.message || 'Failed to upload receipt');
//         } finally {
//             setUploading(false);
//         }
//     };

//     const getStatusBadge = (status: string) => {
//         switch (status) {
//             case 'pending': return <Badge status="warning">Pending</Badge>;
//             case 'paid': return <Badge status="info">Receipt Uploaded</Badge>;
//             case 'approved': return <Badge status="success">Approved</Badge>;
//             case 'rejected': return <Badge status="error">Rejected</Badge>;
//             default: return <Badge status="default">{status}</Badge>;
//         }
//     };

//     if (loading) {
//         return (
//             <div className="p-8 text-center flex items-center justify-center gap-2">
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 <span>Loading invoices...</span>
//             </div>
//         );
//     }

//     const invoices = myInvoices || [];

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader title="My Invoices" subtitle="Track your payment history" />

//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                 {invoices.length === 0 ? (
//                     <div className="text-center py-12">
//                         <p className="text-slate-500">No invoices found</p>
//                     </div>
//                 ) : (
//                     <table className="w-full">
//                         <thead className="bg-slate-50 border-b border-slate-200">
//                             <tr>
//                                 <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Invoice #</th>
//                                 <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Level</th>
//                                 <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
//                                 <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
//                                 <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
//                                 <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {invoices.map((inv: any) => (
//                                 <tr key={inv.id} className="hover:bg-slate-50 border-b border-slate-100">
//                                     <td className="px-4 py-3 font-mono text-xs">#{String(inv.id).slice(-8)}</td>
//                                     <td className="px-4 py-3">Level {inv.level}</td>
//                                     <td className="px-4 py-3 font-medium">K{Number(inv.amount).toLocaleString()}</td>
//                                     <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
//                                     <td className="px-4 py-3 text-xs">{new Date(inv.created_at || inv.createdAt).toLocaleDateString()}</td>
//                                     <td className="px-4 py-3">
//                                         {(inv.status === 'pending' || inv.status === 'rejected') && (
//                                             <Button
//                                                 variant="secondary"
//                                                 className="px-3 py-1.5 text-sm"
//                                                 onClick={() => {
//                                                     setSelectedInvoice(inv);
//                                                     setReceiptModal(true);
//                                                 }}
//                                             >
//                                                 <Upload className="w-3 h-3 inline mr-1" />
//                                                 Upload Receipt
//                                             </Button>
//                                         )}
//                                         {inv.status === 'approved' && (
//                                             <span className="text-xs text-emerald-600">✓ Paid</span>
//                                         )}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}
//             </div>

//             {/* Receipt Upload Modal */}
//             <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Upload Payment Receipt" size="lg">
//                 <div className="space-y-4">
//                     <p className="text-sm text-slate-600">
//                         Please upload a clear image of your payment receipt for verification.
//                     </p>
//                     {selectedInvoice?.rejection_reason && (
//                         <div className="bg-red-50 p-3 rounded-lg">
//                             <p className="text-sm font-medium text-red-800">Previous rejection reason:</p>
//                             <p className="text-sm text-red-700">{selectedInvoice.rejection_reason}</p>
//                         </div>
//                     )}
//                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
//                         <input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleImageChange}
//                             className="hidden"
//                             id="receipt-upload"
//                         />
//                         <label htmlFor="receipt-upload" className="cursor-pointer block">
//                             {receiptImage ? (
//                                 <div className="space-y-2">
//                                     <img src={receiptImage} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
//                                     <p className="text-sm text-emerald-600">✓ Receipt loaded. Click to change.</p>
//                                 </div>
//                             ) : (
//                                 <div className="py-8">
//                                     <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
//                                     <p className="text-sm text-slate-600">Click to select receipt image</p>
//                                     <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
//                                 </div>
//                             )}
//                         </label>
//                     </div>
//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="secondary" onClick={() => setReceiptModal(false)}>Cancel</Button>
//                         <Button onClick={handleUploadReceipt} disabled={uploading}>
//                             {uploading ? 'Uploading...' : 'Submit Receipt'}
//                         </Button>
//                     </div>
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default StudentInvoices;

// // src/components/dashboard/student/StudentInvoices.tsx
// import React, { useState } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Badge, Button, Table, Modal, Field, Input, Toast } from '@/components/shared/UI';
// import { Upload } from 'lucide-react';

// const StudentInvoices: React.FC = () => {
//     const { currentUser } = useEMIS();
//     const { getStudentInvoices, uploadReceipt, fetchInvoices } = useRegistration();
//     const [toast, setToast] = useState('');
//     const [receiptModal, setReceiptModal] = useState(false);
//     const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//     const [receiptImage, setReceiptImage] = useState<string>('');

//     const myInvoices = getStudentInvoices(currentUser?.id || '');

//     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setReceiptImage(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const handleUploadReceipt = async () => {
//         if (!receiptImage) {
//             setToast('Please select a receipt image');
//             return;
//         }
//         try {
//             await uploadReceipt(selectedInvoice.id, receiptImage);
//             await fetchInvoices();
//             setToast('Receipt uploaded successfully');
//             setReceiptModal(false);
//             setReceiptImage('');
//         } catch (error) {
//             setToast('Failed to upload receipt');
//         }
//     };

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader title="My Invoices" subtitle="Track your payment history" />

//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                 <Table headers={['Invoice #', 'Level', 'Amount', 'Status', 'Date', 'Actions']} rowCount={myInvoices.length}>
//                     {myInvoices.map(inv => (
//                         <tr key={inv.id} className="hover:bg-slate-50">
//                             <td className="px-4 py-3 font-mono text-xs">#{inv.id.slice(-8)}</td>
//                             <td className="px-4 py-3">Level {inv.level}</td>
//                             <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
//                             <td className="px-4 py-3">
//                                 {inv.status === 'pending' && <Badge status="warning">Pending</Badge>}
//                                 {inv.status === 'paid' && <Badge status="info">Receipt Uploaded</Badge>}
//                                 {inv.status === 'approved' && <Badge status="success">Approved</Badge>}
//                                 {inv.status === 'rejected' && <Badge status="error">Rejected</Badge>}
//                             </td>
//                             <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
//                             <td className="px-4 py-3">
//                                 {(inv.status === 'pending' || inv.status === 'rejected') && (
//                                     <Button
//                                         variant="secondary"
//                                         className="px-3 py-1.5 text-sm"
//                                         onClick={() => {
//                                             setSelectedInvoice(inv);
//                                             setReceiptModal(true);
//                                         }}
//                                     >
//                                         <Upload className="w-3 h-3 inline mr-1" />
//                                         Upload Receipt
//                                     </Button>
//                                 )}
//                             </td>
//                         </tr>
//                     ))}
//                 </Table>
//             </div>

//             {/* Receipt Upload Modal */}
//             <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Upload Payment Receipt" size="lg">
//                 <div className="space-y-4">
//                     <p className="text-sm text-slate-600">
//                         Please upload a clear image of your payment receipt for verification.
//                     </p>
//                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
//                         <input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleImageChange}
//                             className="hidden"
//                             id="receipt-upload"
//                         />
//                         <label htmlFor="receipt-upload" className="cursor-pointer block">
//                             {receiptImage ? (
//                                 <div className="space-y-2">
//                                     <img src={receiptImage} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
//                                     <p className="text-sm text-emerald-600">✓ Receipt loaded. Click to change.</p>
//                                 </div>
//                             ) : (
//                                 <div className="py-8">
//                                     <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
//                                     <p className="text-sm text-slate-600">Click to select receipt image</p>
//                                 </div>
//                             )}
//                         </label>
//                     </div>
//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="secondary" onClick={() => setReceiptModal(false)}>Cancel</Button>
//                         <Button onClick={handleUploadReceipt}>Submit Receipt</Button>
//                     </div>
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default StudentInvoices;