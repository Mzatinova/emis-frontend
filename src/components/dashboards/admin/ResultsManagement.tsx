import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
import { Search, Send, Layers, Edit2, Eye } from 'lucide-react';

interface ResultsManagementProps {
    toast: string;
    setToast: (msg: string) => void;
}

const ResultsManagement: React.FC<ResultsManagementProps> = ({ toast, setToast }) => {
    const { currentUser, students, courses, results, updateResult, approveResult, sessions } = useEMIS();
    // const { getStudentRegistrations } = useRegistration();
    // const { invoices } = useRegistration();
    const { invoices, fetchInvoices } = useRegistration();

    const [filters, setFilters] = useState({ search: '', programName: '', level: '', status: '' });
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState('ALL');
    const [selectedLevel, setSelectedLevel] = useState('ALL');
    const [publishStatusFilter, setPublishStatusFilter] = useState('all');

    // Edit Result Modal
    const [editModal, setEditModal] = useState(false);
    const [editingResult, setEditingResult] = useState<any>(null);
    const [editForm, setEditForm] = useState({ marks: '' });

    const [publishConfirmModal, setPublishConfirmModal] = useState(false);
    const [publishTarget, setPublishTarget] = useState<{ id: string; studentId: string; studentName: string; resultsCount: number } | null>(null);

    const [activeResultsTab, setActiveResultsTab] = useState<'current' | 'history'>('current');
    const [selectedHistorySession, setSelectedHistorySession] = useState<string>('');
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionPage, setSessionPage] = useState(1);
    const sessionPageSize = 20;

    const currentSession = sessions.find(s => s.active === true);


    // Get unique programs from students
    const programs = useMemo(() => {
        const progSet = new Set();
        students.forEach(s => {
            if (s.program) progSet.add(s.program);
        });
        return Array.from(progSet);
    }, [students]);

    // Check if student registration is approved
    // Check if student registration is approved (using invoices)
    const isStudentApproved = (studentId: string): boolean => {
        const studentInvoices = invoices.filter(inv => String(inv.studentId) === String(studentId));
        return studentInvoices.some(inv => inv.status === 'approved');
    };

    // Get registration status text (using invoices)
    const getRegistrationStatus = (studentId: string): 'Approved' | 'Pending' => {
        const studentInvoices = invoices.filter(inv => String(inv.studentId) === String(studentId));
        if (studentInvoices.some(inv => inv.status === 'approved')) return 'Approved';
        return 'Pending';
    };

    // Single publish
    const handlePublish = (id: string, studentId: string) => {
        if (!isStudentApproved(studentId)) {
            setToast('Cannot publish: Student registration not approved');
            return;
        }
        approveResult(id);
        setToast('Result published successfully');
    };

    // Edit result
    const openEditModal = (result: any) => {
        if (result.status === 'approved') {
            setToast('Cannot edit published result');
            return;
        }
        setEditingResult(result);
        setEditForm({ marks: result.marks?.toString() || '' });
        setEditModal(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResult) return;

        const marks = editForm.marks === '' ? null : parseFloat(editForm.marks);
        updateResult(editingResult.id, { marks });
        setEditModal(false);
        setEditingResult(null);
        setToast('Result updated successfully');
    };

    // Bulk publish
    const handleBulkPublish = () => {
        if (!selectedProgram) {
            setToast('Select a program');
            return;
        }

        let studentsInProgram;
        if (selectedProgram === 'ALL' && selectedLevel === 'ALL') {
            studentsInProgram = students.filter(s => isStudentApproved(s.id));
        } else if (selectedProgram === 'ALL' && selectedLevel !== 'ALL') {
            studentsInProgram = students.filter(s => s.level === selectedLevel && isStudentApproved(s.id));
        } else if (selectedProgram !== 'ALL' && selectedLevel === 'ALL') {
            studentsInProgram = students.filter(s => s.program === selectedProgram && isStudentApproved(s.id));
        } else {
            studentsInProgram = students.filter(s => s.program === selectedProgram && s.level === selectedLevel && isStudentApproved(s.id));
        }

        const studentIds = studentsInProgram.map(s => s.id);

        const pendingResults = results.filter(r =>
            studentIds.includes(r.studentId) &&
            r.status === 'pending'
        );

        if (pendingResults.length === 0) {
            setToast('No pending results found');
            return;
        }

        let publishText = '';
        if (selectedProgram === 'ALL' && selectedLevel === 'ALL') publishText = 'ALL PROGRAMS & LEVELS';
        else if (selectedProgram === 'ALL') publishText = `ALL PROGRAMS - ${selectedLevel}`;
        else if (selectedLevel === 'ALL') publishText = selectedProgram;
        else publishText = `${selectedProgram} - ${selectedLevel}`;

        if (confirm(`Publish ${pendingResults.length} results for ${publishText}?`)) {
            pendingResults.forEach(r => approveResult(r.id));
            setToast(`${pendingResults.length} results published`);
            setShowBulkModal(false);
            setSelectedProgram('ALL');
            setSelectedLevel('ALL');
        }
    };

    // Get sessions that have results
    // Get sessions that have results (excluding current session for history)
const sessionsWithResults = useMemo(() => {
    const sessionIds = new Set(results.map(r => String(r.academic_session_id)).filter(Boolean));
    return sessions.filter(s => {
        // Exclude current session from history dropdown
        if (currentSession && String(s.id) === String(currentSession.id)) return false;
        return sessionIds.has(String(s.id));
    });
}, [sessions, results, currentSession]);
// const sessionsWithResults = useMemo(() => {
//     const sessionIds = new Set(results.map(r => String(r.academic_session_id)).filter(Boolean));
//     return sessions.filter(s => sessionIds.has(String(s.id)));
// }, [sessions, results]);

// Filter sessions by search
const filteredSessions = useMemo(() => {
    let filtered = sessionsWithResults;
    if (sessionSearch) {
        const searchLower = sessionSearch.toLowerCase();
        filtered = filtered.filter(s => 
            s.year.toLowerCase().includes(searchLower) ||
            (s.start_date && new Date(s.start_date).toLocaleDateString('en-GB').includes(searchLower)) ||
            (s.end_date && new Date(s.end_date).toLocaleDateString('en-GB').includes(searchLower))
        );
    }
    return filtered;
}, [sessionsWithResults, sessionSearch]);

const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionPageSize;
    return filteredSessions.slice(start, start + sessionPageSize);
}, [filteredSessions, sessionPage]);

const totalSessionPages = Math.ceil(filteredSessions.length / sessionPageSize);

// Filter results by session
const currentSessionResults = useMemo(() => {
    if (!currentSession) return [];
    return results.filter(r => String(r.academic_session_id) === String(currentSession.id));
}, [results, currentSession]);

const historySessionResults = useMemo(() => {
    if (!selectedHistorySession) return [];
    return results.filter(r => String(r.academic_session_id) === selectedHistorySession);
}, [results, selectedHistorySession]);

// Use appropriate results based on tab
const activeResults = activeResultsTab === 'current' ? currentSessionResults : historySessionResults;

const filteredResults = useMemo(() => activeResults.filter(r => {
    const student = students.find(s => String(s.id) === String(r.studentId));
    const searchTerm = filters.search.toLowerCase().trim();
    return (
        (!filters.search ||
            (student?.regNumber || '').toLowerCase().includes(searchTerm) ||
            (student?.name || '').toLowerCase().includes(searchTerm)) &&
        (!filters.programName || (student?.program || '').toLowerCase() === filters.programName.toLowerCase()) &&
        (!filters.level || (student?.level || '').toLowerCase() === filters.level.toLowerCase())
    );
}), [activeResults, filters, students]);

    // const filteredResults = useMemo(() => results.filter(r => {
    //     const student = students.find(s => String(s.id) === String(r.studentId));
    //     const searchTerm = filters.search.toLowerCase().trim();
    //     return (
    //         (!filters.search ||
    //             (student?.regNumber || '').toLowerCase().includes(searchTerm) ||
    //             (student?.name || '').toLowerCase().includes(searchTerm)) &&
    //         (!filters.programName || (student?.program || '').toLowerCase() === filters.programName.toLowerCase()) &&
    //         (!filters.level || (student?.level || '').toLowerCase() === filters.level.toLowerCase())
    //     );
    // }), [results, filters, students]);

    const pendingStudentsCount = useMemo(() => {
        const studentsWithPendingResults = new Set();
        filteredResults.forEach(r => {
            if (r.status === 'pending' && isStudentApproved(r.studentId)) {
                studentsWithPendingResults.add(r.studentId);
            }
        });
        return studentsWithPendingResults.size;
    }, [filteredResults]);

    // Dynamic publish button label
    const publishButtonLabel = useMemo(() => {
        const programText = filters.programName || 'All Programs';
        const levelText = filters.level || 'All Levels';

        if (!filters.programName && !filters.level) {
            return 'Publish Results (All Programs & Levels)';
        } else if (filters.programName && !filters.level) {
            return `Publish Results (${filters.programName} - All Levels)`;
        } else if (!filters.programName && filters.level) {
            return `Publish Results (All Programs - ${filters.level})`;
        } else {
            return `Publish Results (${filters.programName} - ${filters.level})`;
        }
    }, [filters.programName, filters.level]);

    // Group results by student
    const groupedByStudent = useMemo(() => {
        const groups: { [key: string]: any } = {};

        filteredResults.forEach(r => {
            if (publishStatusFilter === 'published' && r.status !== 'approved') return;
            if (publishStatusFilter === 'not_published' && r.status !== 'pending') return;
            if (!groups[r.studentId]) {
                const student = students.find(s => String(s.id) === String(r.studentId));
                groups[r.studentId] = {
                    studentId: r.studentId,
                    studentReg: student?.regNumber || r.studentReg,
                    studentName: student?.name || '',
                    studentProgram: student?.program || '',
                    studentLevel: student?.level || '',
                    regStatus: getRegistrationStatus(r.studentId),
                    practical: null,
                    occupation: null,
                    fundamentals: null,
                    allPassed: true,
                    allPublished: true
                };
            }

            // Assign results to their course columns
            if (r.courseName === 'Practical') {
                groups[r.studentId].practical = r;
            } else if (r.courseName === 'Occupation') {
                groups[r.studentId].occupation = r;
            } else if (r.courseName === 'Fundamentals') {
                groups[r.studentId].fundamentals = r;
            }

            // Update pass/fail status
            if (r.grade === 'F' || !r.marks) {
                groups[r.studentId].allPassed = false;
            }
            if (r.status !== 'approved') {
                groups[r.studentId].allPublished = false;
            }
        });

        return Object.values(groups);
    }, [filteredResults, students, publishStatusFilter]);

    // Get unique levels from students (dynamically)
    const levels = useMemo(() => {
        const levelSet = new Set<string>();
        students.forEach(s => {
            if (s.level) {
                // Convert to string and clean up
                let levelValue = String(s.level).trim();

                // If it's just a number like "1", convert to "Level 1"
                if (levelValue.match(/^\d+$/)) {
                    levelValue = `Level ${levelValue}`;
                }
                // If it's already "Level 1", keep as is
                // If it's "level 1" (lowercase), capitalize it
                else if (levelValue.toLowerCase().startsWith('level')) {
                    levelValue = levelValue.charAt(0).toUpperCase() + levelValue.slice(1).toLowerCase();
                }

                levelSet.add(levelValue);
            }
        });
        // Sort numerically by the level number
        return Array.from(levelSet).sort((a, b) => {
            const numA = parseInt((a as string).replace('Level ', ''));
            const numB = parseInt((b as string).replace('Level ', ''));
            return numA - numB;
        });
    }, [students]);
    // const levels = useMemo(() => {
    //     const levelSet = new Set();
    //     students.forEach(s => {
    //         if (s.level) levelSet.add(s.level);
    //     });
    //     return Array.from(levelSet).sort();
    // }, [students]);


    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Results Management"
                subtitle="Edit, publish, and manage student results"
                action={
    activeResultsTab === 'current' && (
        <div className="flex gap-2">
            <Button variant="primary" onClick={() => setShowBulkModal(true)} disabled={publishStatusFilter === 'published'} >
                <Layers className="w-4 h-4 inline mr-1" />
                {publishButtonLabel}
            </Button>
        </div>
    )
}
                // action={
                //     <div className="flex gap-2">
                //         <Button variant="primary" onClick={() => setShowBulkModal(true)} disabled={publishStatusFilter === 'published'} >
                //             <Layers className="w-4 h-4 inline mr-1" />
                //             {publishButtonLabel}
                //         </Button>
                //     </div>
                // }
            />
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-4">
                <button
                    onClick={() => {
                        setActiveResultsTab('current');
                        setSelectedHistorySession('');
                    }}
                    className={`px-4 py-2 text-sm font-medium transition ${activeResultsTab === 'current'
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Current Session {currentSession ? `(${currentSession.year})` : ''}
                </button>
                <button
                    onClick={() => {
                        setActiveResultsTab('history');
                        setSelectedHistorySession('');
                        setSessionSearch('');
                        setSessionPage(1);
                    }}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeResultsTab === 'history'
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    History
                </button>
            </div>
         
            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={filters.programName} onChange={e => setFilters({ ...filters, programName: e.target.value })}>
                        <option value="">All Programs</option>
                        {programs.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                    </Select>
                    <Select value={filters.level} onChange={e => setFilters({ ...filters, level: e.target.value })}>
                        <option value="">All Levels</option>
                        {levels.map(level => <option key={level as string} value={level as string}>{level as string}</option>)}
                    </Select>
                    <Select value={publishStatusFilter} onChange={e => setPublishStatusFilter(e.target.value)}>
                        <option value="all">All Results</option>
                        <option value="published">Published</option>
                        <option value="not_published">Not Published</option>
                    </Select>
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                        placeholder="Search by name or reg number"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Statistics Bar */}
          {activeResultsTab === 'current' && (
    <div className="bg-slate-100 rounded-xl p-3 mb-4 flex justify-between items-center">
        <div className="bg-slate-100 rounded-xl p-3 mb-4">
            <span className="text-sm text-slate-600">Ready to publish: <strong>{pendingStudentsCount}</strong> students</span>
        </div>
    </div>
)}

                        {/* History Session Selector */}
            {activeResultsTab === 'history' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Select Academic Session
                    </label>
                    <div className="relative mb-2">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder="Search sessions..."
                            value={sessionSearch}
                            onChange={e => {
                                setSessionSearch(e.target.value);
                                setSessionPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Select 
                        value={selectedHistorySession}
                        onChange={e => {
                            setSelectedHistorySession(e.target.value);
                            setFilters({ search: '', programName: '', level: '', status: '' });
                            setPublishStatusFilter('all');
                        }}
                        className="w-full"
                    >
                        <option value="">-- Select a Session --</option>
                        {paginatedSessions.map(session => {
                            const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
                            const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
                            const resultCount = results.filter(r => String(r.academic_session_id) === String(session.id)).length;
                            return (
                                <option key={session.id} value={session.id}>
                                    {session.year} ({start} - {end}) - {resultCount} results
                                </option>
                            );
                        })}
                    </Select>
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
            )}

            {/* Results Table */}
            <Table
                headers={['Student', 'Program', 'Level', 'Reg Status', 'Practical', 'Occupation', 'Fundamentals', 'Overall', 'Actions']}
                rowCount={groupedByStudent.length}
            >
                {groupedByStudent.map((group: any) => {
                    const canPublish = group.regStatus === 'Approved' && !group.allPublished;

                    return (
                        <tr key={group.studentId} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-slate-900 text-sm">{group.studentName}</div>
                                <div className="font-mono text-xs text-slate-500">{group.studentReg}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">{group.studentProgram || '—'}</td>
                            <td className="px-4 py-3 text-sm">{group.studentLevel || '—'}</td>
                            <td className="px-4 py-3">
                                {group.regStatus === 'Approved' ? (
                                    <Badge status="success">Approved</Badge>
                                ) : (
                                    <Badge status="warning">Pending</Badge>
                                )}
                            </td>
                            {/* Practical Column */}
                            <td className="px-4 py-3 text-center">
                                {group.practical ? (
                                    <div>
                                        <span className="font-medium">{group.practical.marks ?? '—'}</span>
                                        <span className={`ml-1 font-bold ${group.practical.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ({group.practical.grade})
                                        </span>
                                    </div>
                                ) : '—'}
                            </td>
                            {/* Occupation Column */}
                            <td className="px-4 py-3 text-center">
                                {group.occupation ? (
                                    <div>
                                        <span className="font-medium">{group.occupation.marks ?? '—'}</span>
                                        <span className={`ml-1 font-bold ${group.occupation.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ({group.occupation.grade})
                                        </span>
                                    </div>
                                ) : '—'}
                            </td>
                            {/* Fundamentals Column */}
                            <td className="px-4 py-3 text-center">
                                {group.fundamentals ? (
                                    <div>
                                        <span className="font-medium">{group.fundamentals.marks ?? '—'}</span>
                                        <span className={`ml-1 font-bold ${group.fundamentals.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            ({group.fundamentals.grade})
                                        </span>
                                    </div>
                                ) : '—'}
                            </td>
                            {/* Overall Status */}
                            <td className="px-4 py-3">
                                <Badge status={group.allPassed ? 'success' : 'error'}>
                                    {group.allPassed ? 'Passed' : 'Failed'}
                                </Badge>
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    {group.allPublished ? (
                                        <span className="text-xs text-slate-400 py-1.5">Published ✓</span>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const resultToEdit = group.practical || group.occupation || group.fundamentals;
                                                    if (resultToEdit && resultToEdit.status !== 'approved') {
                                                        openEditModal(resultToEdit);
                                                    }
                                                }}
                                                className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                                title="Edit results"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {/* {canPublish && ( */}
                                            {canPublish && activeResultsTab === 'current' && (
                                                <button
                                                    onClick={() => {
                                                        const pendingResults = [group.practical, group.occupation, group.fundamentals].filter(r => r && r.status === 'pending');
                                                        setPublishTarget({
                                                            id: group.studentId,
                                                            studentId: group.studentId,
                                                            studentName: group.studentName,
                                                            resultsCount: pendingResults.length
                                                        });
                                                        setPublishConfirmModal(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium"
                                                >
                                                    <Send className="w-3 h-3 inline mr-1" />
                                                    Publish
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </Table>

            {/* Edit Result Modal */}
            <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Result">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg mb-2">
                        <p className="text-sm"><strong>Student:</strong> {students.find(s => s.id === editingResult?.studentId)?.name}</p>
                        <p className="text-sm"><strong>Course:</strong> {courses.find(c => c.id === editingResult?.courseId)?.name}</p>
                        <p className="text-sm"><strong>Current Grade:</strong> {editingResult?.grade}</p>
                    </div>
                    <Field label="Exam Mark (0-100)" required>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.marks}
                            onChange={e => setEditForm({ marks: e.target.value })}
                            required
                        />
                    </Field>
                    <p className="text-xs text-slate-500">Grade will be auto-computed based on exam mark.</p>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
                        <Button type="submit">Update Result</Button>
                    </div>
                </form>
            </Modal>
            {/* Single Publish Confirm Modal */}
            <Modal open={publishConfirmModal} onClose={() => setPublishConfirmModal(false)} title="Confirm Publish" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Publish results for <strong>{publishTarget?.studentName}</strong>?
                    </p>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                            {publishTarget?.resultsCount} course result(s) will be published.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setPublishConfirmModal(false)}>Cancel</Button>
                        {/* <Button variant="success" onClick={() => { */}
                        <Button variant="success" onClick={async () => {
                            if (publishTarget) {
                                const pendingResults = results.filter(r =>
                                    r.studentId === publishTarget.studentId && r.status === 'pending'
                                );

                                await Promise.all(pendingResults.map(r => approveResult(r.id)));
                                await fetchInvoices();
                                setToast(`${pendingResults.length} result(s) published for ${publishTarget.studentName}`);
                                setPublishConfirmModal(false);
                                setPublishTarget(null);
                                // pendingResults.forEach(r => approveResult(r.id));
                                // setToast(`${pendingResults.length} result(s) published for ${publishTarget.studentName}`);
                                // setPublishConfirmModal(false);
                                // setPublishTarget(null);
                            }
                        }}>
                            <Send className="w-4 h-4 mr-1" />
                            Confirm Publish
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Bulk Publish Modal */}
            {/* Bulk Publish Modal - WORKING VERSION */}
            <Modal open={showBulkModal} onClose={() => setShowBulkModal(false)} title="Confirm Bulk Publish" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        You are about to publish pending results for:
                    </p>

                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="font-medium text-blue-800">
                            {filters.programName || 'All Programs'} - {filters.level || 'All Levels'}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                            {filteredResults.filter(r => r.status === 'pending').length} result(s) will be published.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                        <Button variant="success" onClick={async () => {
                            const pendingResults = filteredResults.filter(r => r.status === 'pending');
                            if (pendingResults.length === 0) {
                                setToast('No pending results found');
                                setShowBulkModal(false);
                                return;
                            }
                            await Promise.all(pendingResults.map(r => approveResult(r.id)));
                            await fetchInvoices();
                            setToast(`${pendingResults.length} results published successfully`);
                            setShowBulkModal(false);
                        }}>
                            <Send className="w-4 h-4 mr-1" />
                            Confirm Publish
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ResultsManagement;