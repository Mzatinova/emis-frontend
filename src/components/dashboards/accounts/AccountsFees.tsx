import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Button, Table, Toast, Input, Select, Modal, Field } from '@/components/shared/UI';
import { DollarSign, Eye, X, Loader2 } from 'lucide-react';

interface FeeStructure {
    id: number;
    program_id: string;
    program_name: string;
    level: number;
    full_level_amount: number;
    per_course_amount: number;
}

const AccountsFees: React.FC = () => {
    const { apiRequest } = useEMIS();
    const { feeStructuresList, fetchFeeStructuresGlobal } = useRegistration();
    const [toast, setToast] = useState('');
    const [programs, setPrograms] = useState<{ id: string, name: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [feeModal, setFeeModal] = useState(false);
    const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
    const [feeForm, setFeeForm] = useState({
        programId: '',
        programName: '',
        level: 1,
        fullLevelAmount: 0,
        perCourseAmount: 0
    });

    const fetchPrograms = async () => {
        try {
            const response = await apiRequest('/programs');
            if (response.data) {
                setPrograms(response.data.map((p: any) => ({ id: p.id, name: p.name })));
            }
        } catch (error) {
            console.error('Failed to fetch programs:', error);
        }
    };

    useEffect(() => {
        fetchPrograms();
    }, []);

    const handleAddFee = async () => {
        if (!feeForm.programId || (!feeForm.fullLevelAmount && !feeForm.perCourseAmount)) {
            setToast('Please fill all required fields');
            return;
        }
        setSubmitting(true);
        try {
            await apiRequest('/fee-structures', 'POST', {
                programId: feeForm.programId,
                programName: feeForm.programName,
                level: feeForm.level,
                fullLevelAmount: feeForm.fullLevelAmount,
                perCourseAmount: feeForm.perCourseAmount
            });
            await fetchFeeStructuresGlobal();
            setToast('Fee structure added');
            setFeeModal(false);
            setFeeForm({ programId: '', programName: '', level: 1, fullLevelAmount: 0, perCourseAmount: 0 });
        } catch (error: any) {
            console.error('Failed to add fee structure:', error);
            setToast(error.message || 'Failed to add fee structure');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateFee = async () => {
        if (!editingFee) return;
        setSubmitting(true);
        try {
            const updateData: any = {};
            if (feeForm.fullLevelAmount !== editingFee.full_level_amount) {
                updateData.fullLevelAmount = feeForm.fullLevelAmount;
            }
            if (feeForm.perCourseAmount !== editingFee.per_course_amount) {
                updateData.perCourseAmount = feeForm.perCourseAmount;
            }

            await apiRequest(`/fee-structures/${editingFee.id}`, 'PUT', updateData);
            await fetchFeeStructuresGlobal();
            setToast('Fee structure updated');
            setFeeModal(false);
            setEditingFee(null);
            setFeeForm({ programId: '', programName: '', level: 1, fullLevelAmount: 0, perCourseAmount: 0 });
        } catch (error) {
            console.error('Failed to update fee structure:', error);
            setToast('Failed to update fee structure');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteFee = async (id: number) => {
        if (confirm('Delete this fee structure?')) {
            try {
                await apiRequest(`/fee-structures/${id}`, 'DELETE');
                await fetchFeeStructuresGlobal();
                setToast('Fee structure deleted');
            } catch (error) {
                console.error('Failed to delete fee structure:', error);
                setToast('Failed to delete fee structure');
            }
        }
    };

    const openFeeModal = (fee?: FeeStructure) => {
        if (fee) {
            setEditingFee(fee);
            setFeeForm({
                programId: fee.program_id,
                programName: fee.program_name,
                level: fee.level,
                fullLevelAmount: fee.full_level_amount,
                perCourseAmount: fee.per_course_amount,
            });
        } else {
            setEditingFee(null);
            setFeeForm({ programId: '', programName: '', level: 1, fullLevelAmount: 0, perCourseAmount: 0 });
        }
        setFeeModal(true);
    };

    if (!feeStructuresList) {
        return (
            <div className="p-8 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading fee structures...</span>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Fee Structure"
                subtitle="Set registration fees per program and level"
                action={<Button onClick={() => openFeeModal()}><DollarSign className="w-4 h-4 inline mr-1" />Add Fee Structure</Button>}
            />

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <Table headers={['Program', 'Level', 'Full Level Fee', 'Per Course Fee', 'Actions']} rowCount={feeStructuresList.length}>
                    {feeStructuresList.map((fee: FeeStructure) => (
                        <tr key={fee.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{fee.program_name}</td>
                            <td className="px-4 py-3 text-center">Level {fee.level}</td>
                            <td className="px-4 py-3 font-medium text-emerald-600">K{fee.full_level_amount.toLocaleString()}</td>
                            <td className="px-4 py-3 font-medium text-blue-600">K{fee.per_course_amount.toLocaleString()}</td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    <button onClick={() => openFeeModal(fee)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteFee(fee.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </Table>
            </div>

            <Modal open={feeModal} onClose={() => !submitting && setFeeModal(false)} title={editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}>
                <form onSubmit={(e) => { e.preventDefault(); editingFee ? handleUpdateFee() : handleAddFee(); }} className="space-y-4">
                    <Field label="Program" required>
                        <Select
                            value={feeForm.programId}
                            onChange={e => {
                                const program = programs.find(p => p.id === e.target.value);
                                setFeeForm({ ...feeForm, programId: e.target.value, programName: program?.name || '' });
                            }}
                            disabled={!!editingFee || submitting}
                        >
                            <option value="">Select program</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Level" required>
                        <Select
                            value={feeForm.level}
                            onChange={e => setFeeForm({ ...feeForm, level: parseInt(e.target.value) })}
                            disabled={!!editingFee || submitting}
                        >
                            <option value={1}>Level 1</option>
                            <option value={2}>Level 2</option>
                            <option value={3}>Level 3</option>
                            <option value={4}>Level 4</option>
                        </Select>
                    </Field>
                    <Field label="Full Level Fee (K)" required>
                        <Input
                            type="number"
                            min="0"
                            value={feeForm.fullLevelAmount}
                            onChange={e => setFeeForm({ ...feeForm, fullLevelAmount: parseInt(e.target.value) || 0 })}
                            disabled={submitting}
                            placeholder="e.g., 500000"
                        />
                    </Field>
                    <Field label="Per Course Fee (K)" required>
                        <Input
                            type="number"
                            min="0"
                            value={feeForm.perCourseAmount}
                            onChange={e => setFeeForm({ ...feeForm, perCourseAmount: parseInt(e.target.value) || 0 })}
                            disabled={submitting}
                            placeholder="e.g., 150000"
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setFeeModal(false)} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />}
                            {editingFee ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Adding...' : 'Add')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AccountsFees;

// import React, { useState, useMemo, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Button, Table, Toast, Input, Select, Modal, Field } from '@/components/shared/UI';
// import { DollarSign, Eye, X, Loader2 } from 'lucide-react';

// interface FeeStructure {
//     id: number;
//     program_id: string;
//     program_name: string;
//     level: number;
//     full_level_amount: number;
//     per_course_amount: number;
// }

// const AccountsFees: React.FC = () => {
//     const { apiRequest } = useEMIS();
//     const [toast, setToast] = useState('');
//     const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
//     const [programs, setPrograms] = useState<{ id: string, name: string }[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);
//     const [feeModal, setFeeModal] = useState(false);
//     const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
//     const [feeForm, setFeeForm] = useState({
//         programId: '',
//         programName: '',
//         level: 1,
//         fullLevelAmount: 0,
//         perCourseAmount: 0
//     });

//     // Fetch programs from API
//     const fetchPrograms = async () => {
//         try {
//             const response = await apiRequest('/programs');
//             if (response.data) {
//                 setPrograms(response.data.map((p: any) => ({ id: p.id, name: p.name })));
//             }
//         } catch (error) {
//             console.error('Failed to fetch programs:', error);
//         }
//     };

//     const fetchFeeStructures = async () => {
//     // Check cache first
//     const cached = localStorage.getItem('fee_structures_cache');
//     const cacheTime = localStorage.getItem('fee_structures_cache_time');
    
//     if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < 300000)) {
//         // Use cached data (5 minutes cache)
//         setFeeStructures(JSON.parse(cached));
//         setLoading(false);
//         return;
//     }
    
//     setLoading(true);
//     try {
//         const response = await apiRequest('/fee-structures');
//         if (response.data) {
//             setFeeStructures(response.data);
//             localStorage.setItem('fee_structures_cache', JSON.stringify(response.data));
//             localStorage.setItem('fee_structures_cache_time', Date.now().toString());
//         }
//     } catch (error) {
//         console.error('Failed to fetch fee structures:', error);
//         setToast('Failed to load fee structures');
//     } finally {
//         setLoading(false);
//     }
// };

//     // const fetchFeeStructures = async () => {
//     //     setLoading(true);
//     //     try {
//     //         const response = await apiRequest('/fee-structures');
//     //         if (response.data) {
//     //             setFeeStructures(response.data);
//     //         }
//     //     } catch (error) {
//     //         console.error('Failed to fetch fee structures:', error);
//     //         setToast('Failed to load fee structures');
//     //     } finally {
//     //         setLoading(false);
//     //     }
//     // };

//     useEffect(() => {
//         fetchPrograms();
//         fetchFeeStructures();
//     }, []);

//     const handleAddFee = async () => {
//         if (!feeForm.programId || (!feeForm.fullLevelAmount && !feeForm.perCourseAmount)) {
//             setToast('Please fill all required fields');
//             return;
//         }
//         setSubmitting(true);
//         try {
//             await apiRequest('/fee-structures', 'POST', {
//                 programId: feeForm.programId,
//                 programName: feeForm.programName,
//                 level: feeForm.level,
//                 fullLevelAmount: feeForm.fullLevelAmount,
//                 perCourseAmount: feeForm.perCourseAmount
//             });
//             await fetchFeeStructures();
//             setToast('Fee structure added');
//             setFeeModal(false);
//             setFeeForm({ programId: '', programName: '', level: 1, fullLevelAmount: 0, perCourseAmount: 0 });
//         } catch (error: any) {
//             console.error('Failed to add fee structure:', error);
//             setToast(error.message || 'Failed to add fee structure');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const handleUpdateFee = async () => {
//         if (!editingFee) return;
//         setSubmitting(true);
//         try {
//             const updateData: any = {};
//             if (feeForm.fullLevelAmount !== editingFee.full_level_amount) {
//                 updateData.fullLevelAmount = feeForm.fullLevelAmount;
//             }
//             if (feeForm.perCourseAmount !== editingFee.per_course_amount) {
//                 updateData.perCourseAmount = feeForm.perCourseAmount;
//             }

//             await apiRequest(`/fee-structures/${editingFee.id}`, 'PUT', updateData);
//             await fetchFeeStructures();
//             setToast('Fee structure updated');
//             setFeeModal(false);
//             setEditingFee(null);
//             setFeeForm({ programId: '', programName: '', level: 1, fullLevelAmount: 0, perCourseAmount: 0 });
//         } catch (error) {
//             console.error('Failed to update fee structure:', error);
//             setToast('Failed to update fee structure');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const handleDeleteFee = async (id: number) => {
//         if (confirm('Delete this fee structure?')) {
//             try {
//                 await apiRequest(`/fee-structures/${id}`, 'DELETE');
//                 await fetchFeeStructures();
//                 setToast('Fee structure deleted');
//             } catch (error) {
//                 console.error('Failed to delete fee structure:', error);
//                 setToast('Failed to delete fee structure');
//             }
//         }
//     };

//     const openFeeModal = (fee?: FeeStructure) => {
//         if (fee) {
//             setEditingFee(fee);
//             setFeeForm({
//                 programId: fee.program_id,
//                 programName: fee.program_name,
//                 level: fee.level,
//                 fullLevelAmount: fee.full_level_amount,
//                 perCourseAmount: fee.per_course_amount,
//             });
//         } else {
//             setEditingFee(null);
//             setFeeForm({ programId: '', programName: '', level: 1, fullLevelAmount: 0, perCourseAmount: 0 });
//         }
//         setFeeModal(true);
//     };

//     if (loading) {
//         return (
//             <div className="p-8 text-center flex items-center justify-center gap-2">
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 <span>Loading fee structures...</span>
//             </div>
//         );
//     }

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader
//                 title="Fee Structure"
//                 subtitle="Set registration fees per program and level"
//                 action={<Button onClick={() => openFeeModal()}><DollarSign className="w-4 h-4 inline mr-1" />Add Fee Structure</Button>}
//             />

//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                 <Table headers={['Program', 'Level', 'Full Level Fee', 'Per Course Fee', 'Actions']} rowCount={feeStructures.length}>
//                     {feeStructures.map(fee => (
//                         <tr key={fee.id} className="hover:bg-slate-50">
//                             <td className="px-4 py-3 font-medium">{fee.program_name}</td>
//                             <td className="px-4 py-3 text-center">Level {fee.level}</td>
//                             <td className="px-4 py-3 font-medium text-emerald-600">K{fee.full_level_amount.toLocaleString()}</td>
//                             <td className="px-4 py-3 font-medium text-blue-600">K{fee.per_course_amount.toLocaleString()}</td>
//                             <td className="px-4 py-3">
//                                 <div className="flex gap-2">
//                                     <button onClick={() => openFeeModal(fee)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
//                                         <Eye className="w-4 h-4" />
//                                     </button>
//                                     <button onClick={() => handleDeleteFee(fee.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
//                                         <X className="w-4 h-4" />
//                                     </button>
//                                 </div>
//                             </td>
//                         </tr>
//                     ))}
//                 </Table>
//             </div>

//             <Modal open={feeModal} onClose={() => !submitting && setFeeModal(false)} title={editingFee ? 'Edit Fee Structure' : 'Add Fee Structure'}>
//                 <form onSubmit={(e) => { e.preventDefault(); editingFee ? handleUpdateFee() : handleAddFee(); }} className="space-y-4">
//                     <Field label="Program" required>
//                         <Select
//                             value={feeForm.programId}
//                             onChange={e => {
//                                 const program = programs.find(p => p.id === e.target.value);
//                                 setFeeForm({ ...feeForm, programId: e.target.value, programName: program?.name || '' });
//                             }}
//                             disabled={!!editingFee || submitting}
//                         >
//                             <option value="">Select program</option>
//                             {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
//                         </Select>
//                     </Field>
//                     <Field label="Level" required>
//                         <Select
//                             value={feeForm.level}
//                             onChange={e => setFeeForm({ ...feeForm, level: parseInt(e.target.value) })}
//                             disabled={!!editingFee || submitting}
//                         >
//                             <option value={1}>Level 1</option>
//                             <option value={2}>Level 2</option>
//                             <option value={3}>Level 3</option>
//                             <option value={4}>Level 4</option>
//                         </Select>
//                     </Field>
//                     <Field label="Full Level Fee (K)" required>
//                         <Input
//                             type="number"
//                             min="0"
//                             value={feeForm.fullLevelAmount}
//                             onChange={e => setFeeForm({ ...feeForm, fullLevelAmount: parseInt(e.target.value) || 0 })}
//                             disabled={submitting}
//                             placeholder="e.g., 500000"
//                         />
//                     </Field>
//                     <Field label="Per Course Fee (K)" required>
//                         <Input
//                             type="number"
//                             min="0"
//                             value={feeForm.perCourseAmount}
//                             onChange={e => setFeeForm({ ...feeForm, perCourseAmount: parseInt(e.target.value) || 0 })}
//                             disabled={submitting}
//                             placeholder="e.g., 150000"
//                         />
//                     </Field>
//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="secondary" onClick={() => setFeeModal(false)} disabled={submitting}>Cancel</Button>
//                         <Button type="submit" disabled={submitting}>
//                             {submitting && <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />}
//                             {editingFee ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Adding...' : 'Add')}
//                         </Button>
//                     </div>
//                 </form>
//             </Modal>
//         </div>
//     );
// };

// export default AccountsFees;