import React, { useState, useMemo } from 'react';
import { useEMIS, Student } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
import { Edit2, Search, Power, Users, UserCheck, Clock, UserX, Repeat } from 'lucide-react';

interface StudentManagementProps {
    toast: string;
    setToast: (msg: string) => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
    const { students, updateStudent } = useEMIS();
    const { invoices } = useRegistration();

    const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'unregistered' | 'repeaters'>('all');
    const [studentEditModal, setStudentEditModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
    const [studentSearch, setStudentSearch] = useState('');

    // Get student registration status from invoices
    const getStudentRegistrationStatus = (studentId: string): 'approved' | 'pending' | 'none' => {
        const studentInvoices = invoices.filter(i => String(i.studentId) === String(studentId));
        
        if (studentInvoices.some(i => i.status === 'approved')) {
            return 'approved';
        }
        if (studentInvoices.some(i => i.status === 'pending' || i.status === 'paid')) {
            return 'pending';
        }
        return 'none';
    };

    // Check if student is repeater
    const isStudentRepeater = (studentId: string): boolean => {
        return invoices.some(i => String(i.studentId) === String(studentId) && i.type === 'repeater');
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

    const toggleStudentActive = (s: Student) => {
        updateStudent(s.id, { active: !s.active });
        setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
    };

    const filteredStudents = useMemo(() => {
        let filtered = students.filter(s =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
        );

        if (activeTab === 'approved') {
            filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'approved');
        } else if (activeTab === 'pending') {
            filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'pending');
        } else if (activeTab === 'unregistered') {
            filtered = filtered.filter(s => getStudentRegistrationStatus(s.id) === 'none');
        } else if (activeTab === 'repeaters') {
            filtered = filtered.filter(s => isStudentRepeater(s.id));
        }

        return filtered;
    }, [students, studentSearch, activeTab, invoices]);

    const approvedCount = students.filter(s => getStudentRegistrationStatus(s.id) === 'approved').length;
    const pendingCount = students.filter(s => getStudentRegistrationStatus(s.id) === 'pending').length;
    const unregisteredCount = students.filter(s => getStudentRegistrationStatus(s.id) === 'none').length;
    const repeatersCount = students.filter(s => isStudentRepeater(s.id)).length;

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Student Management"
                subtitle="View students and assign programs/levels"
            />

            <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'all'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    All ({students.length})
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'approved'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <UserCheck className="w-4 h-4" />
                    Approved ({approvedCount})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'pending'
                            ? 'border-b-2 border-amber-600 text-amber-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Pending ({pendingCount})
                </button>
                <button
                    onClick={() => setActiveTab('unregistered')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'unregistered'
                            ? 'border-b-2 border-slate-600 text-slate-600'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <UserX className="w-4 h-4" />
                    Unregistered ({unregisteredCount})
                </button>
                <button
                    onClick={() => setActiveTab('repeaters')}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'repeaters'
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

            <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Actions']} rowCount={filteredStudents.length}>
                {filteredStudents.map(s => {
                    const regStatus = getStudentRegistrationStatus(s.id);
                    const isRepeater = isStudentRepeater(s.id);
                    return (
                        <tr key={s.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                            <td className="px-4 py-3 font-medium">{s.name}</td>
                            <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                            <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                            <td className="px-4 py-3">
                                <div className="flex gap-1 flex-wrap">
                                    <Badge status={s.active ? 'active' : 'inactive'} />
                                    {regStatus === 'approved' && <Badge status="success">Approved</Badge>}
                                    {regStatus === 'pending' && <Badge status="warning">Pending</Badge>}
                                    {isRepeater && <Badge status="info">Repeater</Badge>}
                                </div>
                              </td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Program/Level">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active">
                                        <Power className="w-4 h-4" />
                                    </button>
                                </div>
                              </td>
                         </tr>
                    );
                })}
            </Table>

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
        </div>
    );
};

export default StudentManagement;

// import React, { useState, useMemo } from 'react';
// import { useEMIS, Student } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
// import { Edit2, Search, Power, Users, UserCheck, Repeat, UserPlus, UserCog } from 'lucide-react';

// interface StudentManagementProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
//     const { students, updateStudent } = useEMIS();
//     const { getStudentRegistrations, invoices, registrations } = useRegistration();

//     const [activeTab, setActiveTab] = useState<'all' | 'registered' | 'repeaters' | 'new' | 'continuing'>('all');
//     const [studentEditModal, setStudentEditModal] = useState(false);
//     const [editingStudent, setEditingStudent] = useState<Student | null>(null);
//     const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
//     const [studentSearch, setStudentSearch] = useState('');

//     // Check if student is registered (approved)
//     const isStudentRegistered = (studentId: string): boolean => {
//         const studentRegs = getStudentRegistrations(studentId);
//         return studentRegs.some(r => r.registrationStatus === 'approved');
//     };

//     // Check if student is repeater
//     const isStudentRepeater = (studentId: string): boolean => {
//         return invoices.some(i => i.studentId === studentId && i.type === 'repeater');
//     };

//     // Check if student is new (first time registration, not repeater)
//     const isNewStudent = (studentId: string): boolean => {
//         return isStudentRegistered(studentId) && !isStudentRepeater(studentId);
//     };

//     // Check if continuing student (registered in previous sessions)
//     // Check if continuing student (registered in previous sessions)
//     const isContinuingStudent = (studentId: string): boolean => {
//         // Student has registration history from previous sessions
//         const studentRegs = registrations.filter(r => r.studentId === studentId);
//         // If they have more than 1 registration, they are continuing
//         // OR if they are registered and not in Level 1
//         return studentRegs.length > 1 || (isStudentRegistered(studentId) && studentRegs.some(r => String(r.level).replace('Level ', '') !== '1'));
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

//     // Filter students based on search and tab
//     const filteredStudents = useMemo(() => {
//         let filtered = students.filter(s =>
//             s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
//             s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
//         );

//         if (activeTab === 'registered') {
//             filtered = filtered.filter(s => isStudentRegistered(s.id));
//         } else if (activeTab === 'repeaters') {
//             filtered = filtered.filter(s => isStudentRepeater(s.id));
//         } else if (activeTab === 'new') {
//             filtered = filtered.filter(s => isNewStudent(s.id));
//         } else if (activeTab === 'continuing') {
//             filtered = filtered.filter(s => isContinuingStudent(s.id));
//         }

//         return filtered;
//     }, [students, studentSearch, activeTab]);

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader
//                 title="Student Management"
//                 subtitle="View students and assign programs/levels (accounts created by Technician)"
//             />

//             {/* Tabs */}
//             <div className="flex flex-wrap justify-center gap-1 mb-4 border-b border-slate-200">
//                 <button
//                     onClick={() => setActiveTab('all')}
//                     className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'all'
//                             ? 'border-b-2 border-emerald-600 text-emerald-600'
//                             : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <Users className="w-4 h-4" />
//                     All Students
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('registered')}
//                     className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'registered'
//                             ? 'border-b-2 border-emerald-600 text-emerald-600'
//                             : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <UserCheck className="w-4 h-4" />
//                     Registered
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('new')}
//                     className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'new'
//                             ? 'border-b-2 border-emerald-600 text-emerald-600'
//                             : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <UserPlus className="w-4 h-4" />
//                     New Students
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('continuing')}
//                     className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'continuing'
//                             ? 'border-b-2 border-emerald-600 text-emerald-600'
//                             : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <UserCog className="w-4 h-4" />
//                     Continuing
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('repeaters')}
//                     className={`px-3 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'repeaters'
//                             ? 'border-b-2 border-emerald-600 text-emerald-600'
//                             : 'text-slate-500 hover:text-slate-700'
//                         }`}
//                 >
//                     <Repeat className="w-4 h-4" />
//                     Repeaters
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

//             <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Actions']} rowCount={filteredStudents.length}>
//                 {filteredStudents.map(s => (
//                     <tr key={s.id} className="hover:bg-slate-50">
//                         <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
//                         <td className="px-4 py-3 font-medium">{s.name}</td>
//                         <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
//                         <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
//                         <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
//                         <td className="px-4 py-3">
//                             <div className="flex gap-2">
//                                 <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Program/Level">
//                                     <Edit2 className="w-4 h-4" />
//                                 </button>
//                                 <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active">
//                                     <Power className="w-4 h-4" />
//                                 </button>
//                             </div>
//                         </td>
//                     </tr>
//                 ))}
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
//         </div>
//     );
// };

// export default StudentManagement;

// // import React, { useState, useMemo } from 'react';
// // import { useEMIS, Student } from '@/contexts/EMISContext';
// // import { useRegistration } from '@/contexts/RegistrationContext';
// // import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
// // import { Edit2, Search, Power, Users, UserCheck } from 'lucide-react';

// // interface StudentManagementProps {
// //     toast: string;
// //     setToast: (msg: string) => void;
// // }

// // const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
// //     const { students, updateStudent } = useEMIS();
// //     const { getStudentRegistrations } = useRegistration();

// //     const [activeTab, setActiveTab] = useState<'all' | 'registered'>('all');
// //     const [studentEditModal, setStudentEditModal] = useState(false);
// //     const [editingStudent, setEditingStudent] = useState<Student | null>(null);
// //     const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
// //     const [studentSearch, setStudentSearch] = useState('');

// //     // Check if student is registered (approved)
// //     const isStudentRegistered = (studentId: string): boolean => {
// //         const registrations = getStudentRegistrations(studentId);
// //         return registrations.some(r => r.registrationStatus === 'approved');
// //     };

// //     const openEditStudent = (s: Student) => {
// //         setEditingStudent(s);
// //         setStudentForm({ program: s.program || '', level: s.level || 'Level 1', active: s.active });
// //         setStudentEditModal(true);
// //     };

// //     const submitEditStudent = (e: React.FormEvent) => {
// //         e.preventDefault();
// //         if (editingStudent) {
// //             updateStudent(editingStudent.id, studentForm);
// //             setToast(`Student ${editingStudent.name} updated`);
// //         }
// //         setStudentEditModal(false);
// //     };

// //     const toggleStudentActive = (s: Student) => {
// //         updateStudent(s.id, { active: !s.active });
// //         setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
// //     };

// //     // Filter students based on search and tab
// //     const filteredStudents = useMemo(() => {
// //         let filtered = students.filter(s =>
// //             s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
// //             s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
// //         );

// //         if (activeTab === 'registered') {
// //             filtered = filtered.filter(s => isStudentRegistered(s.id));
// //         }

// //         return filtered;
// //     }, [students, studentSearch, activeTab]);

// //     return (
// //         <div>
// //             {toast && <Toast message={toast} onClose={() => setToast('')} />}
// //             <PageHeader
// //                 title="Student Management"
// //                 subtitle="View students and assign programs/levels (accounts created by Technician)"
// //             />

// //             {/* Tabs */}
// //             <div className="flex justify-center gap-2 mb-4 border-b border-slate-200">
// //                 <button
// //                     onClick={() => setActiveTab('all')}
// //                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'all'
// //                         ? 'border-b-2 border-emerald-600 text-emerald-600'
// //                         : 'text-slate-500 hover:text-slate-700'
// //                         }`}
// //                 >
// //                     <Users className="w-4 h-4" />
// //                     All Students
// //                 </button>
// //                 <button
// //                     onClick={() => setActiveTab('registered')}
// //                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'registered'
// //                         ? 'border-b-2 border-emerald-600 text-emerald-600'
// //                         : 'text-slate-500 hover:text-slate-700'
// //                         }`}
// //                 >
// //                     <UserCheck className="w-4 h-4" />
// //                     Registered Students (Approved)
// //                 </button>
// //             </div>

// //             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
// //                 <div className="relative">
// //                     <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
// //                     <Input
// //                         placeholder="Search by name or registration number"
// //                         value={studentSearch}
// //                         onChange={e => setStudentSearch(e.target.value)}
// //                         className="pl-9"
// //                     />
// //                 </div>
// //             </div>

// //             <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Actions']} rowCount={filteredStudents.length}>
// //                 {filteredStudents.map(s => (
// //                     <tr key={s.id} className="hover:bg-slate-50">
// //                         <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
// //                         <td className="px-4 py-3 font-medium">{s.name}</td>
// //                         <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
// //                         <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
// //                         <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
// //                         <td className="px-4 py-3">
// //                             <div className="flex gap-2">
// //                                 <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Program/Level">
// //                                     <Edit2 className="w-4 h-4" />
// //                                 </button>
// //                                 <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active">
// //                                     <Power className="w-4 h-4" />
// //                                 </button>
// //                             </div>
// //                         </td>
// //                     </tr>
// //                 ))}
// //             </Table>

// //             <Modal open={studentEditModal} onClose={() => setStudentEditModal(false)} title={`Edit Student: ${editingStudent?.name}`}>
// //                 <form onSubmit={submitEditStudent} className="space-y-4">
// //                     <Field label="Registration Number">
// //                         <Input value={editingStudent?.regNumber || ''} disabled className="bg-slate-100" />
// //                     </Field>
// //                     <Field label="Program">
// //                         <Input value={studentForm.program} onChange={e => setStudentForm({ ...studentForm, program: e.target.value })} placeholder="e.g. Electrical Engineering" />
// //                     </Field>
// //                     <Field label="Level">
// //                         <Select value={studentForm.level} onChange={e => setStudentForm({ ...studentForm, level: e.target.value })}>
// //                             <option>Level 1</option>
// //                             <option>Level 2</option>
// //                             <option>Level 3</option>
// //                             <option>Level 4</option>
// //                         </Select>
// //                     </Field>
// //                     <label className="flex items-center gap-2 text-sm">
// //                         <input type="checkbox" checked={studentForm.active} onChange={e => setStudentForm({ ...studentForm, active: e.target.checked })} />
// //                         Active
// //                     </label>
// //                     <div className="flex justify-end gap-2">
// //                         <Button type="button" variant="secondary" onClick={() => setStudentEditModal(false)}>Cancel</Button>
// //                         <Button type="submit">Save Changes</Button>
// //                     </div>
// //                 </form>
// //             </Modal>
// //         </div>
// //     );
// // };

// // export default StudentManagement;

// // import React, { useState, useMemo } from 'react';
// // import { useEMIS, Student } from '@/contexts/EMISContext';
// // import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
// // import { Edit2, Search, Power } from 'lucide-react';

// // interface StudentManagementProps {
// //     toast: string;
// //     setToast: (msg: string) => void;
// // }

// // const StudentManagement: React.FC<StudentManagementProps> = ({ toast, setToast }) => {
// //     const { students, updateStudent } = useEMIS();

// //     const [studentEditModal, setStudentEditModal] = useState(false);
// //     const [editingStudent, setEditingStudent] = useState<Student | null>(null);
// //     const [studentForm, setStudentForm] = useState({ program: '', level: 'Level 1', active: true });
// //     const [studentSearch, setStudentSearch] = useState('');

// //     // Run once to convert Year to Level
// //     // React.useEffect(() => {
// //     //     students.forEach(student => {
// //     //         if (student.level && student.level.startsWith('Year')) {
// //     //             const newLevel = student.level.replace('Year', 'Level').trim();
// //     //             updateStudent(student.id, { level: newLevel });
// //     //         }
// //     //     });
// //     // }, []);

// //     const openEditStudent = (s: Student) => {
// //         setEditingStudent(s);
// //         setStudentForm({ program: s.program || '', level: s.level || 'Level 1', active: s.active });
// //         setStudentEditModal(true);
// //     };

// //     const submitEditStudent = (e: React.FormEvent) => {
// //         e.preventDefault();
// //         if (editingStudent) {
// //             updateStudent(editingStudent.id, studentForm);
// //             setToast(`Student ${editingStudent.name} updated`);
// //         }
// //         setStudentEditModal(false);
// //     };

// //     const toggleStudentActive = (s: Student) => {
// //         updateStudent(s.id, { active: !s.active });
// //         setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
// //     };

// //     const filteredStudents = useMemo(() =>
// //         students.filter(s =>
// //             s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
// //             s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
// //         ), [students, studentSearch]
// //     );

// //     return (
// //         <div>
// //             {toast && <Toast message={toast} onClose={() => setToast('')} />}
// //             <PageHeader
// //                 title="Student Management"
// //                 subtitle="View students and assign programs/levels (accounts created by Technician)"
// //             />

// //             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
// //                 <div className="relative">
// //                     <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
// //                     <Input
// //                         placeholder="Search by name or registration number"
// //                         value={studentSearch}
// //                         onChange={e => setStudentSearch(e.target.value)}
// //                         className="pl-9"
// //                     />
// //                 </div>
// //             </div>

// //             <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Actions']} rowCount={filteredStudents.length}>
// //                 {filteredStudents.map(s => (
// //                     <tr key={s.id} className="hover:bg-slate-50">
// //                         <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
// //                         <td className="px-4 py-3 font-medium">{s.name}</td>
// //                         <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
// //                         <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
// //                         <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
// //                         <td className="px-4 py-3">
// //                             <div className="flex gap-2">
// //                                 <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Program/Level">
// //                                     <Edit2 className="w-4 h-4" />
// //                                 </button>
// //                                 <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active">
// //                                     <Power className="w-4 h-4" />
// //                                 </button>
// //                             </div>
// //                         </td>
// //                     </tr>
// //                 ))}
// //             </Table>

// //             <Modal open={studentEditModal} onClose={() => setStudentEditModal(false)} title={`Edit Student: ${editingStudent?.name}`}>
// //                 <form onSubmit={submitEditStudent} className="space-y-4">
// //                     <Field label="Registration Number">
// //                         <Input value={editingStudent?.regNumber || ''} disabled className="bg-slate-100" />
// //                     </Field>
// //                     <Field label="Program">
// //                         <Input value={studentForm.program} onChange={e => setStudentForm({ ...studentForm, program: e.target.value })} placeholder="e.g. Electrical Engineering" />
// //                     </Field>
// //                     <Field label="Level">
// //                         <Select value={studentForm.level} onChange={e => setStudentForm({ ...studentForm, level: e.target.value })}>
// //                             <option>Level 1</option>
// //                             <option>Level 2</option>
// //                             <option>Level 3</option>
// //                             <option>Level 4</option>
// //                         </Select>
// //                     </Field>
// //                     <label className="flex items-center gap-2 text-sm">
// //                         <input type="checkbox" checked={studentForm.active} onChange={e => setStudentForm({ ...studentForm, active: e.target.checked })} />
// //                         Active
// //                     </label>
// //                     <div className="flex justify-end gap-2">
// //                         <Button type="button" variant="secondary" onClick={() => setStudentEditModal(false)}>Cancel</Button>
// //                         <Button type="submit">Save Changes</Button>
// //                     </div>
// //                 </form>
// //             </Modal>
// //         </div>
// //     );
// // };

// // export default StudentManagement;