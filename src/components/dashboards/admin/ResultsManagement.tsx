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
    const { currentUser, students, courses, results, updateResult, approveResult } = useEMIS();
    // const { getStudentRegistrations } = useRegistration();
    const { invoices } = useRegistration();

    const [filters, setFilters] = useState({ search: '', programName: '', level: '', status: '' });
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState('ALL');
    const [selectedLevel, setSelectedLevel] = useState('ALL');

    // Edit Result Modal
    const [editModal, setEditModal] = useState(false);
    const [editingResult, setEditingResult] = useState<any>(null);
    const [editForm, setEditForm] = useState({ marks: '' });

    

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

  const filteredResults = useMemo(() => results.filter(r => {
    const student = students.find(s => String(s.id) === String(r.studentId));
    const searchTerm = filters.search.toLowerCase().trim();
    return (
        (!filters.search ||
           (student?.regNumber || '').toLowerCase().includes(searchTerm) ||
            (student?.name || '').toLowerCase().includes(searchTerm)) &&
        (!filters.programName || (student?.program || '').toLowerCase() === filters.programName.toLowerCase()) &&
        (!filters.level || (student?.level || '').toLowerCase() === filters.level.toLowerCase())
    );
}), [results, filters, students]);

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
}, [filteredResults, students]);

// Get unique levels from students (dynamically)
const levels = useMemo(() => {
    const levelSet = new Set();
    students.forEach(s => {
        if (s.level) levelSet.add(s.level);
    });
    return Array.from(levelSet).sort();
}, [students]);
    

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Results Management"
                subtitle="Edit, publish, and manage student results"
               action={
    <div className="flex gap-2">
        <Button variant="primary" onClick={() => setShowBulkModal(true)}>
            <Layers className="w-4 h-4 inline mr-1" />
            {publishButtonLabel}
        </Button>
    </div>
}
            />

            {/* Filters */}
                      {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select value={filters.programName} onChange={e => setFilters({ ...filters, programName: e.target.value })}>
                        <option value="">All Programs</option>
                        {programs.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                    </Select>
                   <Select value={filters.level} onChange={e => setFilters({ ...filters, level: e.target.value })}>
    <option value="">All Levels</option>
    {levels.map(level => <option key={level as string} value={level as string}>{level as string}</option>)}
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
            <div className="bg-slate-100 rounded-xl p-3 mb-4 flex justify-between items-center">
                <div className="bg-slate-100 rounded-xl p-3 mb-4">
    <span className="text-sm text-slate-600">Ready to publish: <strong>{pendingStudentsCount}</strong> students</span>
</div>
                {/* <span className="text-sm text-slate-600">Total results: <strong>{filteredResults.length}</strong></span> */}
            </div>

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
                        <button
                            onClick={() => {
                                // Open first pending result for editing
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
                        {!group.allPublished && canPublish && (
                            <button
                                onClick={() => {
                                    const pendingResults = [group.practical, group.occupation, group.fundamentals].filter(r => r && r.status === 'pending');
                                    if (confirm(`Publish ${pendingResults.length} result(s) for ${group.studentName}?`)) {
                                        pendingResults.forEach(r => approveResult(r.id));
                                        setToast(`${pendingResults.length} result(s) published`);
                                    }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium"
                            >
                                <Send className="w-3 h-3 inline mr-1" />
                                Publish
                            </button>
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

            {/* Bulk Publish Modal */}
            <Modal open={showBulkModal} onClose={() => setShowBulkModal(false)} title="Publish Results" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Publish pending results based on selection below.
                        <br />
                        <strong className="text-amber-600">Note:</strong> Only students with approved registration will be included.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Program">
                            <Select value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
                                <option value="ALL">All Programs</option>
                                {programs.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                            </Select>
                        </Field>

                        <Field label="Level">
                            <Select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                                <option value="ALL">All Levels</option>
                                <option value="Level 1">Level 1</option>
                                <option value="Level 2">Level 2</option>
                                <option value="Level 3">Level 3</option>
                                <option value="Level 4">Level 4</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                        <Button variant="success" onClick={handleBulkPublish}>
                            <Send className="w-4 h-4 mr-1" />
                            Publish
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ResultsManagement;