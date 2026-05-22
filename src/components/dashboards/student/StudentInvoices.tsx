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