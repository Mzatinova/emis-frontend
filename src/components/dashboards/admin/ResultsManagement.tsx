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
    const { getStudentRegistrations } = useRegistration();

    const [filters, setFilters] = useState({ search: '', programName: '', level: '', status: '' });
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState('ALL');
    const [selectedLevel, setSelectedLevel] = useState('ALL');

    // Edit Result Modal
    const [editModal, setEditModal] = useState(false);
    const [editingResult, setEditingResult] = useState<any>(null);
    const [editForm, setEditForm] = useState({ exam: '' });

    // Get unique programs from students
    const programs = useMemo(() => {
        const progSet = new Set();
        students.forEach(s => {
            if (s.program) progSet.add(s.program);
        });
        return Array.from(progSet);
    }, [students]);

    // Check if student registration is approved
    const isStudentApproved = (studentId: string): boolean => {
        const registrations = getStudentRegistrations(studentId);
        return registrations.some(r => r.registrationStatus === 'approved');
    };

    // Get registration status text
    const getRegistrationStatus = (studentId: string): 'Approved' | 'Pending' => {
        const registrations = getStudentRegistrations(studentId);
        if (registrations.some(r => r.registrationStatus === 'approved')) return 'Approved';
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
        setEditForm({ exam: result.exam?.toString() || '' });
        setEditModal(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingResult) return;

        const exam = editForm.exam === '' ? null : parseFloat(editForm.exam);
        updateResult(editingResult.id, { exam });
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
        const student = students.find(s => s.id === r.studentId);
        const course = courses.find(c => c.id === r.courseId);
        const searchTerm = filters.search.toLowerCase();
        return (
            (!filters.search ||
                r.studentReg.toLowerCase().includes(searchTerm) ||
                (student?.name || '').toLowerCase().includes(searchTerm)) &&
            (!filters.programName || student?.program === filters.programName) &&
            (!filters.level || student?.level === filters.level) &&
            (!filters.status || r.status === filters.status)
        );
    }), [results, filters, students, courses]);

    // const filteredResults = useMemo(() => results.filter(r => {
    //     const student = students.find(s => s.id === r.studentId);
    //     const course = courses.find(c => c.id === r.courseId);
    //     const searchTerm = filters.search.toLowerCase();
    //     return (
    //         (!filters.search ||
    //             r.studentReg.toLowerCase().includes(searchTerm) ||
    //             (student?.name || '').toLowerCase().includes(searchTerm)) &&
    //         (!filters.courseId || r.courseId === filters.courseId) &&
    //         (!filters.programName || student?.program === filters.programName) &&
    //         (!filters.status || r.status === filters.status)
    //     );
    // }), [results, filters, students, courses]);

    const pendingCount = filteredResults.filter(r => r.status === 'pending' && isStudentApproved(r.studentId)).length;

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
                            Publish Results
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                        placeholder="Search by name or reg number"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        className="pl-9"
                    />
                </div>
                <Select value={filters.programName} onChange={e => setFilters({ ...filters, programName: e.target.value })}>
                    <option value="">All Programs</option>
                    {programs.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                </Select>
                <Select value={filters.level} onChange={e => setFilters({ ...filters, level: e.target.value })}>
                    <option value="">All Levels</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4">Level 4</option>
                </Select>
                <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending (Not Published)</option>
                    <option value="approved">Published</option>
                </Select>
            </div>

            {/* Statistics Bar */}
            <div className="bg-slate-100 rounded-xl p-3 mb-4 flex justify-between items-center">
                <span className="text-sm text-slate-600">Ready to publish: <strong>{pendingCount}</strong> results</span>
                <span className="text-sm text-slate-600">Total results: <strong>{filteredResults.length}</strong></span>
            </div>

            {/* Results Table */}
            <Table headers={['Student', 'Program', 'Reg Status', 'Level', 'Exam', 'Grade', 'Status', 'Actions']} rowCount={filteredResults.length}>
                {filteredResults.map(r => {
                    const stu = students.find(s => s.id === r.studentId);
                    const cou = courses.find(c => c.id === r.courseId);
                    const regStatus = getRegistrationStatus(r.studentId);
                    const canPublish = regStatus === 'Approved' && r.status === 'pending';
                    const isPublished = r.status === 'approved';

                    return (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-slate-900 text-sm">{stu?.name}</div>
                                <div className="font-mono text-xs text-slate-500">{r.studentReg}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">{stu?.program || '—'}</td>
                            <td className="px-4 py-3">
                                {regStatus === 'Approved' ? (
                                    <Badge status="success">Approved</Badge>
                                ) : (
                                    <Badge status="warning">Pending</Badge>
                                )}
                            </td>
                            <td className="px-4 py-3 text-sm">{stu?.level || '—'}</td>
                            <td className="px-4 py-3 text-center font-medium">{r.exam ?? '—'}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {r.grade}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                {isPublished ? (
                                    <Badge status="success">Published ✓</Badge>
                                ) : (
                                    <Badge status="warning">Not Published</Badge>
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    {/* Edit Button - Always show for pending results */}
                                    {!isPublished && (
                                        <button
                                            onClick={() => openEditModal(r)}
                                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                            title="Edit result"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {isPublished && (
                                        <button
                                            className="p-1.5 bg-slate-100 text-slate-400 rounded cursor-not-allowed"
                                            disabled
                                            title="Published results cannot be edited"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Publish Button */}
                                    {!isPublished && (
                                        <button
                                            onClick={() => handlePublish(r.id, r.studentId)}
                                            disabled={!canPublish}
                                            className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition ${canPublish
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                }`}
                                            title={!canPublish ? 'Student registration must be approved first' : 'Publish result'}
                                        >
                                            <Send className="w-3 h-3" />
                                            Publish
                                        </button>
                                    )}
                                    {isPublished && (
                                        <span className="text-xs text-slate-400 py-1.5">Locked</span>
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
                            value={editForm.exam}
                            onChange={e => setEditForm({ exam: e.target.value })}
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