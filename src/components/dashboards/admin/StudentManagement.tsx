import React, { useState, useMemo } from 'react';
import { useEMIS, Student } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
import { Edit2, Search, Power, UserCheck, Clock, Repeat, History, Users } from 'lucide-react';

interface StudentManagementProps {
    toast: string;
    setToast: (msg: string) => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
    const { students, updateStudent, repeatersList, sessions } = useEMIS();
    const { invoices } = useRegistration();
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [currentFilter, setCurrentFilter] = useState<'registered' | 'approved' | 'pending' | 'repeaters'>('registered');
    const [studentEditModal, setStudentEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedRepeater, setSelectedRepeater] = useState<any>(null);
    const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string>('');
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionPage, setSessionPage] = useState(1);
    const sessionPageSize = 20;

    const currentSession = sessions.find(s => s.active === true);
    const [showToggleModal, setShowToggleModal] = useState(false);
const [toggleStudent, setToggleStudent] = useState<Student | null>(null);

    // Get all previous sessions
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

    // Get all students who registered for current session
    const currentSessionRegisteredStudents = useMemo(() => {
        if (!currentSession) return [];
        const registeredStudentIds = invoices
            .filter(inv => String(inv.academic_session_id) === String(currentSession.id))
            .map(inv => String(inv.studentId));
        const uniqueIds = [...new Set(registeredStudentIds)];
        return students.filter(s => uniqueIds.includes(String(s.id)));
    }, [students, invoices, currentSession]);

    // Get student registration status for current session
    const getStudentRegistrationStatus = (studentId: string): 'approved' | 'pending' => {
        if (!currentSession) return 'pending';
        const studentInvoices = invoices.filter(i => 
            String(i.studentId) === String(studentId) && 
            String(i.academic_session_id) === String(currentSession.id)
        );
        if (studentInvoices.some(i => i.status === 'approved')) return 'approved';
        return 'pending';
    };

    // Filter current session students
    const filteredCurrentStudents = useMemo(() => {
        let filtered = currentSessionRegisteredStudents;
        
        if (currentFilter === 'approved') {
            filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'approved');
        } else if (currentFilter === 'pending') {
            filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'pending');
        } else if (currentFilter === 'repeaters') {
            filtered = filtered.filter(s => repeatersList.some(r => String(r.student_id) === String(s.id)));
        }
        
        if (studentSearch) {
            const term = studentSearch.toLowerCase();
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(term) || 
                s.regNumber.toLowerCase().includes(term)
            );
        }
        
        return filtered;
    }, [currentSessionRegisteredStudents, currentFilter, studentSearch, repeatersList]);

    // Get students for history session
    const historySessionStudents = useMemo(() => {
        if (!selectedHistorySessionId) return [];
        const sessionInvoiceStudentIds = invoices
            .filter(inv => String(inv.academic_session_id) === String(selectedHistorySessionId))
            .map(inv => String(inv.studentId));
        const uniqueStudentIds = [...new Set(sessionInvoiceStudentIds)];
        return students.filter(s => uniqueStudentIds.includes(String(s.id)));
    }, [students, invoices, selectedHistorySessionId]);

    // Filter history session students
    const filteredHistoryStudents = useMemo(() => {
        let filtered = historySessionStudents;
        if (studentSearch) {
            const term = studentSearch.toLowerCase();
            filtered = filtered.filter(s => 
                s.name.toLowerCase().includes(term) || 
                s.regNumber.toLowerCase().includes(term)
            );
        }
        return filtered;
    }, [historySessionStudents, studentSearch]);

    const isStudentRepeater = (studentId: string): boolean => {
        return repeatersList.some(repeater => String(repeater.student_id) === String(studentId));
    };

    const openEditStudent = (s: Student) => {
        setEditingStudent(s);
        setStudentForm({ program: s.program || '', level: s.level || 'Level 1', active: s.active });
        setStudentEditModal(true);
    };

    const submitEditStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStudent) {
            updateStudent(editingStudent.id, studentForm);
            setToast(`Student ${editingStudent.name} updated`);
        }
        setStudentEditModal(false);
    };

    // const toggleStudentActive = (s: Student) => {
    //     updateStudent(s.id, { active: !s.active });
    //     setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
    // };

    const openToggleModal = (s: Student) => {
    setToggleStudent(s);
    setShowToggleModal(true);
};

const confirmToggleActive = () => {
    if (toggleStudent) {
        updateStudent(toggleStudent.id, { active: !toggleStudent.active });
        setToast(`Student ${toggleStudent.name} ${!toggleStudent.active ? 'activated' : 'deactivated'}`);
        setShowToggleModal(false);
        setToggleStudent(null);
    }
};

    const selectedSession = sessions.find(s => String(s.id) === selectedHistorySessionId);

    const registeredCount = currentSessionRegisteredStudents.length;
    const approvedCount = currentSessionRegisteredStudents.filter(s => getStudentRegistrationStatus(s.id) === 'approved').length;
    const pendingCount = currentSessionRegisteredStudents.filter(s => getStudentRegistrationStatus(s.id) === 'pending').length;
    const repeatersCount = currentSessionRegisteredStudents.filter(s => isStudentRepeater(s.id)).length;

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Student Management"
                subtitle={activeTab === 'current' ? `Current Session: ${currentSession?.year || 'No active session'}` : "Previous Sessions History"}
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-4">
                <button
                    onClick={() => {
                        setActiveTab('current');
                        setSelectedHistorySessionId('');
                        setStudentSearch('');
                        setCurrentFilter('registered');
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
                        setStudentSearch('');
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
                <>
                    {!currentSession && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-center">
                            <p className="text-amber-800">No active academic session. Please activate a session first.</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200">
                        <button
                            onClick={() => setCurrentFilter('registered')}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${currentFilter === 'registered'
                                ? 'border-b-2 border-emerald-600 text-emerald-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            Registered ({registeredCount})
                        </button>
                        <button
                            onClick={() => setCurrentFilter('approved')}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${currentFilter === 'approved'
                                ? 'border-b-2 border-emerald-600 text-emerald-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <UserCheck className="w-4 h-4" />
                            Approved ({approvedCount})
                        </button>
                        <button
                            onClick={() => setCurrentFilter('pending')}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${currentFilter === 'pending'
                                ? 'border-b-2 border-amber-600 text-amber-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            Pending ({pendingCount})
                        </button>
                        <button
                            onClick={() => setCurrentFilter('repeaters')}
                            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${currentFilter === 'repeaters'
                                ? 'border-b-2 border-purple-600 text-purple-600'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Repeat className="w-4 h-4" />
                            Repeaters ({repeatersCount})
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                placeholder="Search by name or registration number"
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Registration', 'Academic', 'Actions']} rowCount={filteredCurrentStudents.length}>
                        {filteredCurrentStudents.map(s => {
                            const regStatus = getStudentRegistrationStatus(s.id);
                            const isRepeater = isStudentRepeater(s.id);
                            return (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                                    <td className="px-4 py-3 font-medium">{s.name}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                                    <td className="px-4 py-3">
                                        <Badge status={s.active ? 'active' : 'inactive'}>
                                            {s.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {regStatus === 'approved' && <Badge status="success">Approved</Badge>}
                                        {regStatus === 'pending' && <Badge status="warning">Pending</Badge>}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isRepeater ? (
                                            <button
                                                onClick={() => setSelectedRepeater(repeatersList.find(r => String(r.student_id) === String(s.id)))}
                                                className="text-amber-600 hover:text-amber-800 text-sm font-medium underline"
                                            >
                                                Repeater (Details)
                                            </button>
                                        ) : (
                                            <Badge status="success">Regular</Badge>
                                        )}
                                    </td>

                                    <td className="px-4 py-3">
    <div className="flex gap-2">
        <button 
            onClick={() => openEditStudent(s)} 
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
        >
            Edit
        </button>

        {/* <button 
    onClick={() => openToggleModal(s)} 
    className={`px-3 py-1.5 rounded text-xs font-medium ${s.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
>
    {s.active ? 'Deactivate' : 'Activate'}
</button> */}
        {/* <button 
            onClick={() => toggleStudentActive(s)} 
            className={`px-3 py-1.5 rounded text-xs font-medium ${s.active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
        >
            {s.active ? 'Deactivate' : 'Activate'}
        </button> */}
    </div>
</td>
                                    {/* <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600">
                                                <Power className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td> */}
                                </tr>
                            );
                        })}
                    </Table>
                </>
            )}

            {/* History View */}
            {activeTab === 'history' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
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
                        
                        <Select 
                            value={selectedHistorySessionId}
                            onChange={e => {
                                setSelectedHistorySessionId(e.target.value);
                                setStudentSearch('');
                            }}
                            className="w-full mt-2"
                        >
                            <option value="">-- Select a Session --</option>
                            {paginatedSessions.map(session => {
                                const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
                                const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
                                const studentCount = invoices.filter(inv => String(inv.academic_session_id) === String(session.id)).length;
                                return (
                                    <option key={session.id} value={session.id}>
                                        {session.year} ({start} - {end}) - {studentCount} students
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

                    {selectedHistorySessionId && (
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input
                                    placeholder="Search by name or registration number"
                                    value={studentSearch}
                                    onChange={e => setStudentSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    )}

                    {!selectedHistorySessionId && (
                        <div className="text-center py-8 text-slate-500">
                            Select a session to view students
                        </div>
                    )}

                    {selectedHistorySessionId && filteredHistoryStudents.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No students found for {selectedSession?.year}
                            {studentSearch && ` matching "${studentSearch}"`}
                        </div>
                    )}

                    {selectedHistorySessionId && filteredHistoryStudents.length > 0 && (
                        <div>
                            <div className="mb-3 text-sm text-slate-600">
                                Showing {filteredHistoryStudents.length} student(s) for {selectedSession?.year}
                                {studentSearch && ` matching "${studentSearch}"`}
                            </div>
                            <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Registration']} rowCount={filteredHistoryStudents.length}>
                                {filteredHistoryStudents.map(s => {
                                    const regStatus = invoices.some(inv => 
                                        String(inv.studentId) === String(s.id) && 
                                        String(inv.academic_session_id) === selectedHistorySessionId &&
                                        inv.status === 'approved'
                                    ) ? 'approved' : 'pending';
                                    return (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                                            <td className="px-4 py-3 font-medium">{s.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                                            <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge status={s.active ? 'active' : 'inactive'}>
                                                    {s.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {regStatus === 'approved' && <Badge status="success">Approved</Badge>}
                                                {regStatus === 'pending' && <Badge status="warning">Pending</Badge>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </Table>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Student Modal */}
            <Modal open={studentEditModal} onClose={() => setStudentEditModal(false)} title={`Edit Student: ${editingStudent?.name}`}>
                <form onSubmit={submitEditStudent} className="space-y-4">
                    <Field label="Registration Number">
                        <Input value={editingStudent?.regNumber || ''} disabled className="bg-slate-100" />
                    </Field>
                    <Field label="Program">
                        <Input value={studentForm.program} onChange={e => setStudentForm({ ...studentForm, program: e.target.value })} placeholder="e.g. Electrical Engineering" />
                    </Field>
                    <Field label="Level">
                        <Select value={studentForm.level} onChange={e => setStudentForm({ ...studentForm, level: e.target.value })}>
                            <option>Level 1</option>
                            <option>Level 2</option>
                            <option>Level 3</option>
                            <option>Level 4</option>
                        </Select>
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={studentForm.active} onChange={e => setStudentForm({ ...studentForm, active: e.target.checked })} />
                        Active
                    </label>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setStudentEditModal(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>

            {/* Repeater Details Modal */}
            <Modal
                open={!!selectedRepeater}
                onClose={() => setSelectedRepeater(null)}
                title={`Failed Courses - ${selectedRepeater?.name}`}
            >
                <div className="space-y-3">
                    <p className="text-sm text-slate-600">This student needs to repeat the following course(s):</p>
                    {selectedRepeater?.failed_courses.map((course: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
                            <div className="font-semibold text-red-800">{course.course_name}</div>
                            <div className="text-sm text-slate-600 mt-1">
                                Marks: {course.marks} | Required: {course.required_pass} | Level: {course.level}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
            {/* <Modal open={showToggleModal} onClose={() => setShowToggleModal(false)} title="Confirm Action" size="md">
    <div className="space-y-4">
        <p className="text-sm text-slate-600">
            Are you sure you want to <strong>{toggleStudent?.active ? 'deactivate' : 'activate'}</strong> {toggleStudent?.name}?
        </p>
        <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-800">
                {toggleStudent?.active 
                    ? 'Deactivated students will not be able to log in or access the system.' 
                    : 'Activated students will be able to log in and access the system.'}
            </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowToggleModal(false)}>
                Cancel
            </Button>
            <Button 
                variant={toggleStudent?.active ? 'danger' : 'success'} 
                onClick={confirmToggleActive}
            >
                Confirm {toggleStudent?.active ? 'Deactivate' : 'Activate'}
            </Button>
        </div>
    </div>
</Modal> */}
        </div>
    );
};

export default StudentManagement;

// import React, { useState, useMemo } from 'react';
// import { useEMIS, Student } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
// import { Edit2, Search, Power, Users, UserCheck, Clock, UserX, Repeat, History } from 'lucide-react';

// interface StudentManagementProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
//     const { students, updateStudent, repeatersList, sessions } = useEMIS();
//     const { invoices } = useRegistration();
//     const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
//     const [statusFilter, setStatusFilter] = useState<'approved' | 'pending' | 'unregistered'>('approved');
//     const [studentEditModal, setStudentEditModal] = useState(false);
//     const [editingStudent, setEditingStudent] = useState<Student | null>(null);
//     const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
//     const [studentSearch, setStudentSearch] = useState('');
//     const [selectedRepeater, setSelectedRepeater] = useState<any>(null);
//     const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string>('');
//     const [sessionSearch, setSessionSearch] = useState('');
//     const [sessionPage, setSessionPage] = useState(1);
//     const sessionPageSize = 20;

//     const currentSession = sessions.find(s => s.active === true);

//     // Get all previous sessions
//     const previousSessions = useMemo(() => {
//         if (!currentSession) return sessions;
//         return sessions.filter(s => String(s.id) !== String(currentSession.id));
//     }, [sessions, currentSession]);

//     // Filter sessions by search
//     const filteredSessions = useMemo(() => {
//         let filtered = previousSessions;
//         if (sessionSearch) {
//             const searchLower = sessionSearch.toLowerCase();
//             filtered = filtered.filter(s => 
//                 s.year.toLowerCase().includes(searchLower) ||
//                 (s.start_date && new Date(s.start_date).toLocaleDateString('en-GB').includes(searchLower)) ||
//                 (s.end_date && new Date(s.end_date).toLocaleDateString('en-GB').includes(searchLower))
//             );
//         }
//         return filtered;
//     }, [previousSessions, sessionSearch]);

//     const paginatedSessions = useMemo(() => {
//         const start = (sessionPage - 1) * sessionPageSize;
//         return filteredSessions.slice(start, start + sessionPageSize);
//     }, [filteredSessions, sessionPage]);

//     const totalSessionPages = Math.ceil(filteredSessions.length / sessionPageSize);

//     // Get student registration status for a specific session
//     const getStudentRegistrationStatusForSession = (studentId: string, sessionId: string): 'approved' | 'pending' | 'none' => {
//         const studentInvoices = invoices.filter(i => 
//             String(i.studentId) === String(studentId) && 
//             String(i.academic_session_id) === String(sessionId)
//         );

//         if (studentInvoices.some(i => i.status === 'approved')) return 'approved';
//         if (studentInvoices.some(i => i.status === 'pending' || i.status === 'paid')) return 'pending';
//         return 'none';
//     };

//     // Get students for current session based on invoices
//     const currentSessionStudents = useMemo(() => {
//         if (!currentSession) return [];
        
//         // Get all students who have invoices for current session
//         const currentSessionInvoiceStudentIds = invoices
//             .filter(inv => String(inv.academic_session_id) === String(currentSession.id))
//             .map(inv => String(inv.studentId));
        
//         const uniqueStudentIds = [...new Set(currentSessionInvoiceStudentIds)];
        
//         return students.filter(s => uniqueStudentIds.includes(String(s.id)));
//     }, [students, invoices, currentSession]);

//     // Get students for history session
//     const historySessionStudents = useMemo(() => {
//         if (!selectedHistorySessionId) return [];
        
//         const sessionInvoiceStudentIds = invoices
//             .filter(inv => String(inv.academic_session_id) === String(selectedHistorySessionId))
//             .map(inv => String(inv.studentId));
        
//         const uniqueStudentIds = [...new Set(sessionInvoiceStudentIds)];
        
//         return students.filter(s => uniqueStudentIds.includes(String(s.id)));
//     }, [students, invoices, selectedHistorySessionId]);

//     // Filter current session students by status and search
//     const filteredCurrentStudents = useMemo(() => {
//         let filtered = currentSessionStudents;
        
//         // Filter by registration status for current session
//         if (statusFilter !== 'unregistered') {
//             filtered = filtered.filter(s => 
//                 getStudentRegistrationStatusForSession(s.id, currentSession!.id) === statusFilter
//             );
//         } else {
//             // Unregistered: no invoice for current session (but these shouldn't appear since currentSessionStudents only has students with invoices)
//             filtered = filtered.filter(s => 
//                 getStudentRegistrationStatusForSession(s.id, currentSession!.id) === 'none'
//             );
//         }
        
//         // Search filter
//         if (studentSearch) {
//             const term = studentSearch.toLowerCase();
//             filtered = filtered.filter(s => 
//                 s.name.toLowerCase().includes(term) || 
//                 s.regNumber.toLowerCase().includes(term)
//             );
//         }
        
//         return filtered;
//     }, [currentSessionStudents, statusFilter, studentSearch, currentSession]);

//     // Filter history session students
//     const filteredHistoryStudents = useMemo(() => {
//         let filtered = historySessionStudents;
        
//         if (studentSearch) {
//             const term = studentSearch.toLowerCase();
//             filtered = filtered.filter(s => 
//                 s.name.toLowerCase().includes(term) || 
//                 s.regNumber.toLowerCase().includes(term)
//             );
//         }
        
//         return filtered;
//     }, [historySessionStudents, studentSearch]);

//     const isStudentRepeater = (studentId: string): boolean => {
//         return repeatersList.some(repeater => String(repeater.student_id) === String(studentId));
//     };

//     const openEditStudent = (s: Student) => {
//         setEditingStudent(s);
//         setStudentForm({ program: s.program || '', level: s.level || 'Level 1', active: s.active });
//         setStudentEditModal(true);
//     };

//     const submitEditStudent = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (editingStudent) {
//             updateStudent(editingStudent.id, studentForm);
//             setToast(`Student ${editingStudent.name} updated`);
//         }
//         setStudentEditModal(false);
//     };

//     const toggleStudentActive = (s: Student) => {
//         updateStudent(s.id, { active: !s.active });
//         setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
//     };

//     const selectedSession = sessions.find(s => String(s.id) === selectedHistorySessionId);

//     const approvedCount = currentSessionStudents.filter(s => 
//         getStudentRegistrationStatusForSession(s.id, currentSession?.id || '') === 'approved'
//     ).length;
    
//     const pendingCount = currentSessionStudents.filter(s => 
//         getStudentRegistrationStatusForSession(s.id, currentSession?.id || '') === 'pending'
//     ).length;

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader
//                 title="Student Management"
//                 subtitle={activeTab === 'current' ? `Current Session: ${currentSession?.year || 'No active session'}` : "Previous Sessions History"}
//             />

//             {/* Tabs */}
//             <div className="flex gap-2 border-b border-slate-200 mb-4">
//                 <button
//                     onClick={() => {
//                         setActiveTab('current');
//                         setSelectedHistorySessionId('');
//                         setStudentSearch('');
//                         setStatusFilter('approved');
//                     }}
//                     className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'current'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                     }`}
//                 >
//                     Current Session {currentSession ? `(${currentSession.year})` : ''}
//                 </button>
//                 <button
//                     onClick={() => {
//                         setActiveTab('history');
//                         setSelectedHistorySessionId('');
//                         setSessionSearch('');
//                         setSessionPage(1);
//                         setStudentSearch('');
//                     }}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'history'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                     }`}
//                 >
//                     <History className="w-4 h-4" />
//                     History
//                 </button>
//             </div>

//             {/* Current Session View */}
//             {activeTab === 'current' && currentSession && (
//                 <>
//                     <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200">
//                         <button
//                             onClick={() => setStatusFilter('approved')}
//                             className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${statusFilter === 'approved'
//                                 ? 'border-b-2 border-emerald-600 text-emerald-600'
//                                 : 'text-slate-500 hover:text-slate-700'
//                             }`}
//                         >
//                             <UserCheck className="w-4 h-4" />
//                             Approved ({approvedCount})
//                         </button>
//                         <button
//                             onClick={() => setStatusFilter('pending')}
//                             className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${statusFilter === 'pending'
//                                 ? 'border-b-2 border-amber-600 text-amber-600'
//                                 : 'text-slate-500 hover:text-slate-700'
//                             }`}
//                         >
//                             <Clock className="w-4 h-4" />
//                             Pending ({pendingCount})
//                         </button>
//                     </div>

//                     <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
//                         <div className="relative">
//                             <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//                             <Input
//                                 placeholder="Search by name or registration number"
//                                 value={studentSearch}
//                                 onChange={e => setStudentSearch(e.target.value)}
//                                 className="pl-9"
//                             />
//                         </div>
//                     </div>

//                    <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Registration', 'Academic', 'Actions']} rowCount={filteredCurrentStudents.length}>
//     {filteredCurrentStudents.map(s => {
//         const regStatus = getStudentRegistrationStatusForSession(s.id, currentSession.id);
//         const isRepeater = isStudentRepeater(s.id);
//         return (
//             <tr key={s.id} className="hover:bg-slate-50">
//                 <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
//                 <td className="px-4 py-3 font-medium">{s.name}</td>
//                 <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
//                 <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
//                 <td className="px-4 py-3">
//                     <Badge status={s.active ? 'active' : 'inactive'}>
//                         {s.active ? 'Active' : 'Inactive'}
//                     </Badge>
//                 </td>
//                 <td className="px-4 py-3">
//                     {regStatus === 'approved' && <Badge status="success">Approved</Badge>}
//                     {regStatus === 'pending' && <Badge status="warning">Pending</Badge>}
//                 </td>
//                 <td className="px-4 py-3">
//                     {isRepeater ? (
//                         <button
//                             onClick={() => setSelectedRepeater(repeatersList.find(r => String(r.student_id) === String(s.id)))}
//                             className="text-amber-600 hover:text-amber-800 text-sm font-medium underline"
//                         >
//                             Repeater (Details)
//                         </button>
//                     ) : (
//                         <Badge status="success">Regular</Badge>
//                     )}
//                 </td>
//                 <td className="px-4 py-3">
//                     <div className="flex gap-2">
//                         <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
//                             <Edit2 className="w-4 h-4" />
//                         </button>
//                         <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600">
//                             <Power className="w-4 h-4" />
//                         </button>
//                     </div>
//                 </td>
//             </tr>
//         );
//     })}
// </Table>
//                 </>
//             )}

//             {activeTab === 'current' && !currentSession && (
//                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
//                     <p className="text-amber-800">No active academic session. Please activate a session first.</p>
//                 </div>
//             )}

//             {/* History View */}
//             {activeTab === 'history' && (
//                 <div className="bg-white border border-slate-200 rounded-xl p-4">
//                     {/* Session Search */}
//                     <div className="mb-4">
//                         <label className="block text-sm font-medium text-slate-700 mb-1">
//                             Search Session
//                         </label>
//                         <div className="relative">
//                             <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//                             <Input
//                                 placeholder="Type to search sessions..."
//                                 value={sessionSearch}
//                                 onChange={e => {
//                                     setSessionSearch(e.target.value);
//                                     setSessionPage(1);
//                                 }}
//                                 className="pl-9"
//                             />
//                         </div>
                        
//                         <Select 
//                             value={selectedHistorySessionId}
//                             onChange={e => {
//                                 setSelectedHistorySessionId(e.target.value);
//                                 setStudentSearch('');
//                             }}
//                             className="w-full mt-2"
//                         >
//                             <option value="">-- Select a Session --</option>
//                             {paginatedSessions.map(session => {
//                                 const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
//                                 const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
//                                 const studentCount = invoices.filter(inv => String(inv.academic_session_id) === String(session.id)).length;
//                                 return (
//                                     <option key={session.id} value={session.id}>
//                                         {session.year} ({start} - {end}) - {studentCount} students
//                                     </option>
//                                 );
//                             })}
//                         </Select>
                        
//                         {totalSessionPages > 1 && (
//                             <div className="flex justify-center gap-2 mt-2">
//                                 <button
//                                     onClick={() => setSessionPage(p => Math.max(1, p - 1))}
//                                     disabled={sessionPage === 1}
//                                     className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
//                                 >
//                                     Prev
//                                 </button>
//                                 <span className="text-xs">Page {sessionPage} of {totalSessionPages}</span>
//                                 <button
//                                     onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))}
//                                     disabled={sessionPage === totalSessionPages}
//                                     className="px-2 py-1 text-xs bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50"
//                                 >
//                                     Next
//                                 </button>
//                             </div>
//                         )}
//                     </div>

//                     {/* Student Search for selected session */}
//                     {selectedHistorySessionId && (
//                         <div className="mb-4">
//                             <div className="relative">
//                                 <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//                                 <Input
//                                     placeholder="Search by name or registration number"
//                                     value={studentSearch}
//                                     onChange={e => setStudentSearch(e.target.value)}
//                                     className="pl-9"
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     {!selectedHistorySessionId && (
//                         <div className="text-center py-8 text-slate-500">
//                             Select a session to view students
//                         </div>
//                     )}

//                     {selectedHistorySessionId && filteredHistoryStudents.length === 0 && (
//                         <div className="text-center py-8 text-slate-500">
//                             No students found for {selectedSession?.year}
//                             {studentSearch && ` matching "${studentSearch}"`}
//                         </div>
//                     )}

//                     {selectedHistorySessionId && filteredHistoryStudents.length > 0 && (
//                         <div>
//                             <div className="mb-3 text-sm text-slate-600">
//                                 Showing {filteredHistoryStudents.length} student(s) for {selectedSession?.year}
//                                 {studentSearch && ` matching "${studentSearch}"`}
//                             </div>
//                             <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Registration']} rowCount={filteredHistoryStudents.length}>
//                                 {filteredHistoryStudents.map(s => {
//                                     const regStatus = getStudentRegistrationStatusForSession(s.id, selectedHistorySessionId);
//                                     return (
//                                         <tr key={s.id} className="hover:bg-slate-50">
//                                             <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
//                                             <td className="px-4 py-3 font-medium">{s.name}</td>
//                                             <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
//                                             <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
//                                             <td className="px-4 py-3">
//                                                 <Badge status={s.active ? 'active' : 'inactive'}>
//                                                     {s.active ? 'Active' : 'Inactive'}
//                                                 </Badge>
//                                             </td>
//                                             <td className="px-4 py-3">
//                                                 {regStatus === 'approved' && <Badge status="success">Approved</Badge>}
//                                                 {regStatus === 'pending' && <Badge status="warning">Pending</Badge>}
//                                             </td>
//                                         </tr>
//                                     );
//                                 })}
//                             </Table>
//                         </div>
//                     )}
//                 </div>
//             )}

//             {/* Edit Student Modal */}
//             <Modal open={studentEditModal} onClose={() => setStudentEditModal(false)} title={`Edit Student: ${editingStudent?.name}`}>
//                 <form onSubmit={submitEditStudent} className="space-y-4">
//                     <Field label="Registration Number">
//                         <Input value={editingStudent?.regNumber || ''} disabled className="bg-slate-100" />
//                     </Field>
//                     <Field label="Program">
//                         <Input value={studentForm.program} onChange={e => setStudentForm({ ...studentForm, program: e.target.value })} placeholder="e.g. Electrical Engineering" />
//                     </Field>
//                     <Field label="Level">
//                         <Select value={studentForm.level} onChange={e => setStudentForm({ ...studentForm, level: e.target.value })}>
//                             <option>Level 1</option>
//                             <option>Level 2</option>
//                             <option>Level 3</option>
//                             <option>Level 4</option>
//                         </Select>
//                     </Field>
//                     <label className="flex items-center gap-2 text-sm">
//                         <input type="checkbox" checked={studentForm.active} onChange={e => setStudentForm({ ...studentForm, active: e.target.checked })} />
//                         Active
//                     </label>
//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="secondary" onClick={() => setStudentEditModal(false)}>Cancel</Button>
//                         <Button type="submit">Save Changes</Button>
//                     </div>
//                 </form>
//             </Modal>

//             {/* Repeater Details Modal */}
//             <Modal
//                 open={!!selectedRepeater}
//                 onClose={() => setSelectedRepeater(null)}
//                 title={`Failed Courses - ${selectedRepeater?.name}`}
//             >
//                 <div className="space-y-3">
//                     <p className="text-sm text-slate-600">This student needs to repeat the following course(s):</p>
//                     {selectedRepeater?.failed_courses.map((course: any, idx: number) => (
//                         <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
//                             <div className="font-semibold text-red-800">{course.course_name}</div>
//                             <div className="text-sm text-slate-600 mt-1">
//                                 Marks: {course.marks} | Required: {course.required_pass} | Level: {course.level}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default StudentManagement;

// import React, { useState, useMemo } from 'react';
// import { useEMIS, Student } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
// import { Edit2, Search, Power, Users, UserCheck, Clock, UserX, Repeat } from 'lucide-react';

// interface StudentManagementProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
//     const { students, updateStudent, repeatersList } = useEMIS();
//     console.log('RepeatersList length:', repeatersList.length, 'Data:', repeatersList); // ADD THIS
//     const { invoices } = useRegistration();
//     const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'unregistered' | 'repeaters'>('all');
//     const [studentEditModal, setStudentEditModal] = useState(false);
//     const [editingStudent, setEditingStudent] = useState<Student | null>(null);
//     const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
//     const [studentSearch, setStudentSearch] = useState('');
//     const [selectedRepeater, setSelectedRepeater] = useState<any>(null);

//     // Get student registration status from invoices
//     const getStudentRegistrationStatus = (studentId: string): 'approved' | 'pending' | 'none' => {
//         const studentInvoices = invoices.filter(i => String(i.studentId) === String(studentId));

//         if (studentInvoices.some(i => i.status === 'approved')) {
//             return 'approved';
//         }
//         if (studentInvoices.some(i => i.status === 'pending' || i.status === 'paid')) {
//             return 'pending';
//         }
//         return 'none';
//     };

//     // Check if student is repeater
//     // Check if student is repeater using backend data
//     const isStudentRepeater = (studentId: string): boolean => {
//         return repeatersList.some(repeater => String(repeater.student_id) === String(studentId));
//     };

//     const openEditStudent = (s: Student) => {
//         setEditingStudent(s);
//         setStudentForm({ program: s.program || '', level: s.level || 'Level 1', active: s.active });
//         setStudentEditModal(true);
//     };

//     const submitEditStudent = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (editingStudent) {
//             updateStudent(editingStudent.id, studentForm);
//             setToast(`Student ${editingStudent.name} updated`);
//         }
//         setStudentEditModal(false);
//     };

//     const toggleStudentActive = (s: Student) => {
//         updateStudent(s.id, { active: !s.active });
//         setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
//     };

//     const filteredStudents = useMemo(() => {
//         let filtered = students.filter(s =>
//             s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
//             s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
//         );

//         if (activeTab === 'approved') {
//             filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'approved');
//         } else if (activeTab === 'pending') {
//             filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'pending');
//         } else if (activeTab === 'unregistered') {
//             filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'none');
//         } else if (activeTab === 'repeaters') {
//             filtered = filtered.filter(s => isStudentRepeater(s.id));
//         }

//         return filtered;
//     }, [students, studentSearch, activeTab, invoices]);

//     const approvedCount = students.filter(s => getStudentRegistrationStatus(s.id) === 'approved').length;
//     const pendingCount = students.filter(s => getStudentRegistrationStatus(s.id) === 'pending').length;
//     const unregisteredCount = students.filter(s => getStudentRegistrationStatus(s.id) === 'none').length;
//     const repeatersCount = students.filter(s => isStudentRepeater(s.id)).length;

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader
//                 title="Student Management"
//                 subtitle="View students and assign programs/levels"
//             />

//             <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200">
//                 <button
//                     onClick={() => setActiveTab('all')}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'all'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <Users className="w-4 h-4" />
//                     All ({students.length})
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('approved')}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'approved'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <UserCheck className="w-4 h-4" />
//                     Approved ({approvedCount})
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('pending')}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'pending'
//                         ? 'border-b-2 border-amber-600 text-amber-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <Clock className="w-4 h-4" />
//                     Pending ({pendingCount})
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('unregistered')}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'unregistered'
//                         ? 'border-b-2 border-slate-600 text-slate-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <UserX className="w-4 h-4" />
//                     Unregistered ({unregisteredCount})
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('repeaters')}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'repeaters'
//                         ? 'border-b-2 border-purple-600 text-purple-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <Repeat className="w-4 h-4" />
//                     Repeaters ({repeatersCount})
//                 </button>
//             </div>

//             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
//                 <div className="relative">
//                     <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//                     <Input
//                         placeholder="Search by name or registration number"
//                         value={studentSearch}
//                         onChange={e => setStudentSearch(e.target.value)}
//                         className="pl-9"
//                     />
//                 </div>
//             </div>

//             <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Registration', 'Academic', 'Actions']} rowCount={filteredStudents.length}>
//                 {filteredStudents.map(s => {
//                     const regStatus = getStudentRegistrationStatus(s.id);
//                     const isRepeater = isStudentRepeater(s.id);
//                     return (
//                         <tr key={s.id} className="hover:bg-slate-50">
//                             <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
//                             <td className="px-4 py-3 font-medium">{s.name}</td>
//                             <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
//                             <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>

//                             {/* Column 1: Account Status */}
//                             <td className="px-4 py-3">
//                                 <Badge status={s.active ? 'active' : 'inactive'}>
//                                     {s.active ? 'Active' : 'Inactive'}
//                                 </Badge>
//                             </td>

//                             {/* Column 2: Registration Status */}
//                             <td className="px-4 py-3">
//                                 {regStatus === 'approved' && <Badge status="success">Approved</Badge>}
//                                 {regStatus === 'pending' && <Badge status="warning">Pending</Badge>}
//                                 {regStatus === 'none' && <Badge status="default">Not Registered</Badge>}
//                             </td>

//                             {/* Column 3: Academic Status */}
//                             <td className="px-4 py-3">
//                                 {isRepeater ? (
//                                     <button
//                                         onClick={() => setSelectedRepeater(repeatersList.find(r => String(r.student_id) === String(s.id)))}
//                                         className="text-amber-600 hover:text-amber-800 text-sm font-medium underline"
//                                     >
//                                         Repeater (Details)
//                                     </button>
//                                 ) : (
//                                     <Badge status="success">Regular</Badge>
//                                 )}
//                             </td>


//                             <td className="px-4 py-3">
//                                 <div className="flex gap-2">
//                                     <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Program/Level">
//                                         <Edit2 className="w-4 h-4" />
//                                     </button>
//                                     <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active">
//                                         <Power className="w-4 h-4" />
//                                     </button>
//                                 </div>
//                             </td>
//                         </tr>
//                     );
//                 })}
//             </Table>

//             <Modal open={studentEditModal} onClose={() => setStudentEditModal(false)} title={`Edit Student: ${editingStudent?.name}`}>
//                 <form onSubmit={submitEditStudent} className="space-y-4">
//                     <Field label="Registration Number">
//                         <Input value={editingStudent?.regNumber || ''} disabled className="bg-slate-100" />
//                     </Field>
//                     <Field label="Program">
//                         <Input value={studentForm.program} onChange={e => setStudentForm({ ...studentForm, program: e.target.value })} placeholder="e.g. Electrical Engineering" />
//                     </Field>
//                     <Field label="Level">
//                         <Select value={studentForm.level} onChange={e => setStudentForm({ ...studentForm, level: e.target.value })}>
//                             <option>Level 1</option>
//                             <option>Level 2</option>
//                             <option>Level 3</option>
//                             <option>Level 4</option>
//                         </Select>
//                     </Field>
//                     <label className="flex items-center gap-2 text-sm">
//                         <input type="checkbox" checked={studentForm.active} onChange={e => setStudentForm({ ...studentForm, active: e.target.checked })} />
//                         Active
//                     </label>
//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="secondary" onClick={() => setStudentEditModal(false)}>Cancel</Button>
//                         <Button type="submit">Save Changes</Button>
//                     </div>
//                 </form>
//             </Modal>

//             <Modal
//                 open={!!selectedRepeater}
//                 onClose={() => setSelectedRepeater(null)}
//                 title={`Failed Courses - ${selectedRepeater?.name}`}
//             >
//                 <div className="space-y-3">
//                     <p className="text-sm text-slate-600">This student needs to repeat the following course(s):</p>
//                     {selectedRepeater?.failed_courses.map((course: any, idx: number) => (
//                         <div key={idx} className="border-l-4 border-red-400 bg-red-50 p-3 rounded">
//                             <div className="font-semibold text-red-800">{course.course_name}</div>
//                             <div className="text-sm text-slate-600 mt-1">
//                                 Marks: {course.marks} | Required: {course.required_pass} | Level: {course.level}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default StudentManagement;