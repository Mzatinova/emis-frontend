import React, { useState, useEffect, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Button, Table, Toast, Input, Select, Modal, Field, Badge } from '@/components/shared/UI';
import { DollarSign, Eye, X, Loader2, History, Search } from 'lucide-react';

interface FeeStructure {
    id: number;
    program_id: string;
    program_name: string;
    level: number;
    full_level_amount: number;
    per_course_amount: number;
    academic_session_id?: number;
    session_year?: string;
}

const AccountsFees: React.FC = () => {
    const { apiRequest, sessions } = useEMIS();
    const { feeStructuresList, fetchFeeStructuresGlobal } = useRegistration();
    const [toast, setToast] = useState('');
    const [programs, setPrograms] = useState<{ id: string, name: string }[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [feeModal, setFeeModal] = useState(false);
    const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [feeForm, setFeeForm] = useState({
        programId: '',
        programName: '',
        level: 1,
        fullLevelAmount: 0,
        perCourseAmount: 0
    });

    // Session search and pagination for history
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionPage, setSessionPage] = useState(1);
    const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string>('');
    const [programSearch, setProgramSearch] = useState('');
    const sessionPageSize = 20;

    const currentSession = sessions.find(s => s.active === true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingFee, setDeletingFee] = useState<FeeStructure | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Filter fee structures by current session
    const currentSessionFees = useMemo(() => {
        if (!currentSession) return feeStructuresList || [];
        return (feeStructuresList || []).filter(fee => String(fee.academic_session_id) === String(currentSession.id));
    }, [feeStructuresList, currentSession]);

    // Get all previous sessions (not current)
    const previousSessions = useMemo(() => {
        if (!currentSession) return sessions;
        return sessions.filter(s => String(s.id) !== String(currentSession.id));
    }, [sessions, currentSession]);

    // Filter sessions by search
    const filteredSessions = useMemo(() => {
        let filtered = previousSessions;
        if (sessionSearch) {
            const searchLower = sessionSearch.toLowerCase();
            filtered = filtered.filter(s =>
                s.year.toLowerCase().includes(searchLower) ||
                (s.start_date && new Date(s.start_date).toLocaleDateString('en-GB').includes(searchLower)) ||
                (s.end_date && new Date(s.end_date).toLocaleDateString('en-GB').includes(searchLower))
            );
        }
        return filtered;
    }, [previousSessions, sessionSearch]);

    const paginatedSessions = useMemo(() => {
        const start = (sessionPage - 1) * sessionPageSize;
        return filteredSessions.slice(start, start + sessionPageSize);
    }, [filteredSessions, sessionPage]);

    const totalSessionPages = Math.ceil(filteredSessions.length / sessionPageSize);

    // Get fee structures for selected history session
    const selectedSessionFees = useMemo(() => {
        if (!selectedHistorySessionId) return [];
        return (feeStructuresList || []).filter(fee => String(fee.academic_session_id) === selectedHistorySessionId);
    }, [feeStructuresList, selectedHistorySessionId]);

    // Filter selected session fees by program search
    const filteredSessionFees = useMemo(() => {
        if (!programSearch) return selectedSessionFees;
        const term = programSearch.toLowerCase();
        return selectedSessionFees.filter(fee =>
            fee.program_name.toLowerCase().includes(term)
        );
    }, [selectedSessionFees, programSearch]);

    const selectedSession = sessions.find(s => String(s.id) === selectedHistorySessionId);

    const fetchPrograms = async () => {
        try {
            const response = await apiRequest('/programs');
            if (response.data) {
                setPrograms(response.data.map((p: any) => ({ id: String(p.id), name: p.name })));
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

        if (!currentSession) {
            setToast('No active academic session found');
            return;
        }

        setSubmitting(true);
        try {
            await apiRequest('/fee-structures', 'POST', {
                programId: feeForm.programId,
                programName: feeForm.programName,
                level: feeForm.level,
                fullLevelAmount: feeForm.fullLevelAmount,
                perCourseAmount: feeForm.perCourseAmount,
                academicSessionId: currentSession.id
            });
            await fetchFeeStructuresGlobal();
            setToast('Fee structure added for current session');
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

    // const handleDeleteFee = async (id: number) => {
    //     if (confirm('Delete this fee structure?')) {
    //         try {
    //             await apiRequest(`/fee-structures/${id}`, 'DELETE');
    //             await fetchFeeStructuresGlobal();
    //             setToast('Fee structure deleted');
    //         } catch (error) {
    //             console.error('Failed to delete fee structure:', error);
    //             setToast('Failed to delete fee structure');
    //         }
    //     }
    // };

    const openDeleteModal = (fee: FeeStructure) => {
    setDeletingFee(fee);
    setShowDeleteModal(true);
};

const confirmDeleteFee = async () => {
    if (!deletingFee) return;
    setDeleting(true);
    try {
        await apiRequest(`/fee-structures/${deletingFee.id}`, 'DELETE');
        await fetchFeeStructuresGlobal();
        setToast('Fee structure deleted');
        setShowDeleteModal(false);
        setDeletingFee(null);
    } catch (error) {
        console.error('Failed to delete fee structure:', error);
        setToast('Failed to delete fee structure');
    } finally {
        setDeleting(false);
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
                subtitle={activeTab === 'current' ? `Current Session: ${currentSession?.year || 'No active session'}` : "Previous Sessions History"}
                action={
                    activeTab === 'current' && (
                        <Button onClick={() => openFeeModal()}>
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Add Fee Structure
                        </Button>
                    )
                }
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-4">
                <button
                    onClick={() => {
                        setActiveTab('current');
                        setSelectedHistorySessionId('');
                        setProgramSearch('');
                    }}
                    className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'current'
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Current Session {currentSession ? `(${currentSession.year})` : ''}
                </button>
                <button
                    onClick={() => {
                        setActiveTab('history');
                        setSelectedHistorySessionId('');
                        setSessionSearch('');
                        setSessionPage(1);
                        setProgramSearch('');
                    }}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'history'
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <History className="w-4 h-4" />
                    History
                </button>
            </div>

            {/* Current Session View */}
            {activeTab === 'current' && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {currentSessionFees.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No fee structures set for current session ({currentSession?.year})
                        </div>
                    ) : (
                        <Table headers={['Program', 'Level', 'Full Level Fee', 'Per Course Fee', 'Actions']} rowCount={currentSessionFees.length}>
                            {currentSessionFees.map((fee: FeeStructure) => (
                                <tr key={fee.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium">{fee.program_name}</td>
                                    <td className="px-4 py-3 text-center">Level {fee.level}</td>
                                    <td className="px-4 py-3 font-medium text-emerald-600">K{fee.full_level_amount.toLocaleString()}</td>
                                    <td className="px-4 py-3 font-medium text-blue-600">K{fee.per_course_amount.toLocaleString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">

                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => openFeeModal(fee)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
    onClick={() => openDeleteModal(fee)} 
    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
>
    Delete
</button>
                                                    {/* <button
                                                        onClick={() => handleDeleteFee(fee.id)}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                                                    >
                                                        Delete
                                                    </button> */}
                                                </div>
                                            </td>
                                            {/* <button onClick={() => openFeeModal(fee)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteFee(fee.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600">
                                                <X className="w-4 h-4" />
                                            </button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </Table>
                    )}
                </div>
            )}

            {/* History View - Session Dropdown Pattern */}
            {activeTab === 'history' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    {/* Session Search */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Search Session
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                placeholder="Type to search sessions..."
                                value={sessionSearch}
                                onChange={e => {
                                    setSessionSearch(e.target.value);
                                    setSessionPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>

                        {/* Session Dropdown */}
                        <Select
                            value={selectedHistorySessionId}
                            onChange={e => {
                                setSelectedHistorySessionId(e.target.value);
                                setProgramSearch(''); // Reset program search when session changes
                            }}
                            className="w-full mt-2"
                        >
                            <option value="">-- Select a Session --</option>
                            {paginatedSessions.map(session => {
                                const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
                                const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
                                const feeCount = (feeStructuresList || []).filter(f => String(f.academic_session_id) === String(session.id)).length;
                                return (
                                    <option key={session.id} value={session.id}>
                                        {session.year} ({start} - {end}) - {feeCount} fee structures
                                    </option>
                                );
                            })}
                        </Select>

                        {/* Session Pagination */}
                        {totalSessionPages > 1 && (
                            <div className="flex justify-center gap-2 mt-2">
                                <button
                                    onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                                    disabled={sessionPage === 1}
                                    className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span className="text-xs">Page {sessionPage} of {totalSessionPages}</span>
                                <button
                                    onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))}
                                    disabled={sessionPage === totalSessionPages}
                                    className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Program Search - Only show when session is selected */}
                    {selectedHistorySessionId && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Search Program
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder="Type to search programs..."
                                    value={programSearch}
                                    onChange={e => setProgramSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {!selectedHistorySessionId && (
                        <div className="text-center py-8 text-slate-500">
                            Select a session to view fee structures
                        </div>
                    )}

                    {selectedHistorySessionId && filteredSessionFees.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No fee structures found for {selectedSession?.year}
                            {programSearch && ` matching "${programSearch}"`}
                        </div>
                    )}

                    {selectedHistorySessionId && filteredSessionFees.length > 0 && (
                        <div>
                            <div className="mb-3 text-sm text-slate-600">
                                Showing {filteredSessionFees.length} fee structure(s) for {selectedSession?.year}
                                {programSearch && ` matching "${programSearch}"`}
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <Table headers={['Program', 'Level', 'Full Level Fee', 'Per Course Fee']} rowCount={filteredSessionFees.length}>
                                    {filteredSessionFees.map((fee: FeeStructure) => (
                                        <tr key={fee.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium">{fee.program_name}</td>
                                            <td className="px-4 py-3 text-center">Level {fee.level}</td>
                                            <td className="px-4 py-3 font-medium text-emerald-600">K{fee.full_level_amount.toLocaleString()}</td>
                                            <td className="px-4 py-3 font-medium text-blue-600">K{fee.per_course_amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                            value={feeForm.fullLevelAmount === 0 ? '' : feeForm.fullLevelAmount}
                            onChange={e => setFeeForm({ ...feeForm, fullLevelAmount: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                            disabled={submitting}
                            placeholder="e.g., 500000"
                        />
                    </Field>
                    <Field label="Per Course Fee (K)" required>
                        <Input
                            type="number"
                            min="0"
                            value={feeForm.perCourseAmount === 0 ? '' : feeForm.perCourseAmount}
                            onChange={e => setFeeForm({ ...feeForm, perCourseAmount: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                            disabled={submitting}
                            placeholder="e.g., 150000"
                        />
                    </Field>
                    {/* <Field label="Full Level Fee (K)" required>
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
                    </Field> */}
                    {!currentSession && activeTab === 'current' && (
                        <p className="text-sm text-amber-600">No active session. Please activate a session first.</p>
                    )}
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setFeeModal(false)} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting || (!currentSession && activeTab === 'current')}>
                            {submitting && <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />}
                            {editingFee ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Adding...' : 'Add')}
                        </Button>
                    </div>
                </form>
            </Modal>
            <Modal open={showDeleteModal} onClose={() => !deleting && setShowDeleteModal(false)} title="Confirm Delete" size="md">
    <div className="space-y-4">
        <p className="text-sm text-slate-600">
            Are you sure you want to delete the fee structure for <strong>{deletingFee?.program_name}</strong>?
        </p>
        <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
                This action cannot be undone.
            </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancel
            </Button>
            <Button variant="danger" onClick={confirmDeleteFee} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Confirm Delete
            </Button>
        </div>
    </div>
</Modal>
        </div>
    );
};

export default AccountsFees;

// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
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
//     const { feeStructuresList, fetchFeeStructuresGlobal } = useRegistration();
//     const [toast, setToast] = useState('');
//     const [programs, setPrograms] = useState<{ id: string, name: string }[]>([]);
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

//     // const fetchPrograms = async () => {
//     //     try {
//     //         const response = await apiRequest('/programs');
//     //         if (response.data) {
//     //             setPrograms(response.data.map((p: any) => ({ id: p.id, name: p.name })));
//     //         }
//     //     } catch (error) {
//     //         console.error('Failed to fetch programs:', error);
//     //     }
//     // };
//     const fetchPrograms = async () => {
//     try {
//         const response = await apiRequest('/programs');
//         if (response.data) {
//             setPrograms(response.data.map((p: any) => ({ id: String(p.id), name: p.name })));
//         }
//     } catch (error) {
//         console.error('Failed to fetch programs:', error);
//     }
// };

//     useEffect(() => {
//         fetchPrograms();
//     }, []);

//     const handleAddFee = async () => {
//         if (!feeForm.programId || (!feeForm.fullLevelAmount && !feeForm.perCourseAmount)) {
//             setToast('Please fill all required fields');
//             return;
//         }
//         console.log('feeForm before submit:', feeForm);  // ADD THIS LINE
//         setSubmitting(true);
//         try {
//             await apiRequest('/fee-structures', 'POST', {
//                 programId: feeForm.programId,
//                 programName: feeForm.programName,
//                 level: feeForm.level,
//                 fullLevelAmount: feeForm.fullLevelAmount,
//                 perCourseAmount: feeForm.perCourseAmount
//             });
//             await fetchFeeStructuresGlobal();
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
//             await fetchFeeStructuresGlobal();
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
//                 await fetchFeeStructuresGlobal();
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

//     if (!feeStructuresList) {
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
//                 <Table headers={['Program', 'Level', 'Full Level Fee', 'Per Course Fee', 'Actions']} rowCount={feeStructuresList.length}>
//                     {feeStructuresList.map((fee: FeeStructure) => (
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
//     const program = programs.find(p => p.id === e.target.value);
//     console.log('Selected program:', program);  // ADD THIS
//     setFeeForm({ ...feeForm, programId: e.target.value, programName: program?.name || '' });
// }}
//                             // onChange={e => {
//                             //     const program = programs.find(p => p.id === e.target.value);
//                             //     setFeeForm({ ...feeForm, programId: e.target.value, programName: program?.name || '' });
//                             // }}
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