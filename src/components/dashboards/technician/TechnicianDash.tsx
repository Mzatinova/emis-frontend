import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { StatCard, PageHeader, Toast } from '@/components/shared/UI';
import { Users, ScrollText, GraduationCap, BookOpen, Activity } from 'lucide-react';
import TechnicianStaff from './TechnicianStaff';
import TechnicianStudent from './TechnicianStudent';
import TechnicianAudit from './TechnicianAudit';

const TechnicianDash: React.FC<{ active: string }> = ({ active }) => {
  const { users, students, courses, audits } = useEMIS();
  const [toast, setToast] = useState('');

  // DASHBOARD VIEW
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Technician Dashboard" subtitle="System super admin overview" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Staff" value={users.length} icon={Users} color="bg-purple-600" sub="Including technician" />
          <StatCard label="Total Students" value={students.length} icon={GraduationCap} color="bg-blue-600" />
          <StatCard label="Total Courses" value={courses.length} icon={BookOpen} color="bg-emerald-600" />
          <StatCard label="Audit Entries" value={audits.length} icon={ScrollText} color="bg-amber-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" />Recent Activity</h3>
            <div className="space-y-3">
              {audits.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{a.action}</p>
                    <p className="text-xs text-slate-500 truncate">{a.details}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Users by Role</h3>
            <div className="space-y-3">
              {(['administrator', 'instructor', 'accounts', 'student'] as const).map(r => {
                const count = r === 'student' ? students.length : users.filter(u => u.role === r).length;
                return (
                  <div key={r} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-slate-700 capitalize">{r}</span>
                    <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STAFF USER MANAGEMENT VIEW
  if (active === 'users') {
    return <TechnicianStaff toast={toast} setToast={setToast} />;
  }

  // STUDENT MANAGEMENT VIEW
  if (active === 'students') {
    return <TechnicianStudent toast={toast} setToast={setToast} />;
  }

  // AUDIT VIEW
  if (active === 'audit') {
    return <TechnicianAudit />;
  }

  return null;
};

export default TechnicianDash;

// import React, { useEffect, useState, useMemo } from 'react';
// import { useEMIS, Role, User, Student } from '@/contexts/EMISContext';
// import { StatCard, Badge, PageHeader, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
// import { Users, ScrollText, GraduationCap, BookOpen, Plus, Edit2, Trash2, Settings as SettingsIcon, Activity, Search, Power } from 'lucide-react';

// const TechnicianDash: React.FC<{ active: string }> = ({ active }) => {
//   const { users, students, courses, audits, addUser, updateUser, deleteUser, addStudent, updateStudent } = useEMIS();
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editing, setEditing] = useState<User | null>(null);
//   const [toast, setToast] = useState('');
//   const [form, setForm] = useState({ name: '', email: '', password: '', role: 'administrator' as Role, active: true });
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);
//   const [editValue, setEditValue] = useState({ min: 0, max: 0 });

//   // Student Management State
//   const [studentModal, setStudentModal] = useState(false);
//   const [editingStudent, setEditingStudent] = useState<Student | null>(null);
//   const [sForm, setSForm] = useState({ name: '', password: 'student123', program: '', level: 'Year 1', active: true, email: '' });
//   const [studentSearch, setStudentSearch] = useState('');

//   // Grading scale state
//   const [gradingScale, setGradingScale] = useState([
//     { min: 75, max: 100, grade: 'A', description: 'Distinction' },
//     { min: 65, max: 74, grade: 'B', description: 'Merit' },
//     { min: 55, max: 64, grade: 'C', description: 'Credit' },
//     { min: 45, max: 54, grade: 'D', description: 'Pass' },
//     { min: 0, max: 44, grade: 'F', description: 'Fail' },
//   ]);

//   useEffect(() => {
//     const saved = localStorage.getItem('grading_scale');
//     if (saved) {
//       const parsed = JSON.parse(saved);
//       const filtered = parsed.filter((item: any) => item.grade !== 'E');
//       if (filtered.length !== parsed.length) {
//         localStorage.setItem('grading_scale', JSON.stringify(filtered));
//         setGradingScale(filtered);
//       } else {
//         setGradingScale(parsed);
//       }
//     }
//   }, []);

//   // Student functions
//   const openNewStudent = () => {
//     setEditingStudent(null);
//     setSForm({ name: '', password: 'student123', program: '', level: 'Year 1', active: true, email: '' });
//     setStudentModal(true);
//   };

//   const openEditStudent = (s: Student) => {
//     setEditingStudent(s);
//     setSForm({ name: s.name, password: '', program: s.program || '', level: s.level || 'Year 1', active: s.active, email: s.email || '' });
//     setStudentModal(true);
//   };

//   const submitStudent = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!sForm.name) { setToast('Name required'); return; }
//     if (editingStudent) {
//       updateStudent(editingStudent.id, sForm);
//       setToast('Student updated');
//     } else {
//       addStudent(sForm as any);
//       setToast('Student registered with auto-generated reg number');
//     }
//     setStudentModal(false);
//   };

//   const toggleStudentActive = (s: Student) => {
//     updateStudent(s.id, { active: !s.active });
//     setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
//   };

//   // Staff user functions
//   const openNew = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'administrator', active: true }); setModalOpen(true); };
//   const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email || '', password: '', role: u.role, active: u.active }); setModalOpen(true); };

//   const submit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!form.name || !form.email || !form.password) { setToast('Please fill all fields'); return; }
//     if (editing) { updateUser(editing.id, form); setToast('User updated'); }
//     else { addUser(form); setToast('User created'); }
//     setModalOpen(false);
//   };

//   const handleDelete = (id: string) => { if (confirm('Delete this user?')) { deleteUser(id); setToast('User deleted'); } };

//   const saveGradingScale = () => {
//     localStorage.setItem('grading_scale', JSON.stringify(gradingScale));
//     setToast('Grading scale saved successfully');
//   };

//   const staffUsers = users.filter(u => u.role !== 'technician');

//   // Filtered students for search
//   const filteredStudents = useMemo(() =>
//     students.filter(s =>
//       s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
//       s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
//     ), [students, studentSearch]
//   );

//   // DASHBOARD VIEW
//   if (active === 'dashboard') {
//     return (
//       <div>
//         {toast && <Toast message={toast} onClose={() => setToast('')} />}
//         <PageHeader title="Technician Dashboard" subtitle="System super admin overview" />
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <StatCard label="Total Users" value={users.length} icon={Users} color="bg-purple-600" sub="Including technician" />
//           <StatCard label="Total Students" value={students.length} icon={GraduationCap} color="bg-blue-600" />
//           <StatCard label="Total Courses" value={courses.length} icon={BookOpen} color="bg-emerald-600" />
//           <StatCard label="Audit Entries" value={audits.length} icon={ScrollText} color="bg-amber-600" />
//         </div>
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-white border border-slate-200 rounded-xl p-5">
//             <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4" />Recent Activity</h3>
//             <div className="space-y-3">
//               {audits.slice(0, 6).map(a => (
//                 <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0">
//                   <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-slate-900">{a.action}</p>
//                     <p className="text-xs text-slate-500 truncate">{a.details}</p>
//                     <p className="text-xs text-slate-400 mt-0.5">{new Date(a.timestamp).toLocaleString()}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="bg-white border border-slate-200 rounded-xl p-5">
//             <h3 className="font-semibold text-slate-900 mb-4">Users by Role</h3>
//             <div className="space-y-3">
//               {(['administrator', 'instructor', 'accounts', 'student'] as const).map(r => {
//                 const count = r === 'student' ? students.length : users.filter(u => u.role === r).length;
//                 return (
//                   <div key={r} className="flex items-center justify-between py-2">
//                     <span className="text-sm font-medium text-slate-700 capitalize">{r}</span>
//                     <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full">{count}</span>
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // STAFF USER MANAGEMENT VIEW
//   if (active === 'users') {
//     return (
//       <div>
//         {toast && <Toast message={toast} onClose={() => setToast('')} />}
//         <PageHeader title="Staff User Management" subtitle="Create and manage staff accounts (Admin, Instructor, Accounts)"
//           action={<Button onClick={openNew}><Plus className="w-4 h-4 inline mr-1" />New Staff User</Button>} />
//         <Table headers={['Name', 'Email', 'Role', 'Status', 'Created', 'Actions']} rowCount={staffUsers.length}>
//           {staffUsers.map(u => (
//             <tr key={u.id} className="hover:bg-slate-50">
//               <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
//               <td className="px-4 py-3 text-slate-600">{u.email}</td>
//               <td className="px-4 py-3"><Badge status={u.role}>{u.role}</Badge></td>
//               <td className="px-4 py-3"><Badge status={u.active ? 'active' : 'inactive'} /></td>
//               <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
//               <td className="px-4 py-3">
//                 <div className="flex gap-2">
//                   <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 className="w-4 h-4" /></button>
//                   <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </Table>
//         <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff User' : 'Create Staff User'}>
//           <form onSubmit={submit} className="space-y-4">
//             <Field label="Full Name" required><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
//             <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
//             <Field label="Password" required><Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
//             <Field label="Role" required>
//               <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
//                 <option value="administrator">Administrator</option>
//                 <option value="instructor">Instructor</option>
//                 <option value="accounts">Accounts</option>
//               </Select>
//             </Field>
//             <label className="flex items-center gap-2 text-sm">
//               <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
//               Active
//             </label>
//             <div className="flex justify-end gap-2 pt-2">
//               <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
//               <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
//             </div>
//           </form>
//         </Modal>
//       </div>
//     );
//   }

//   // STUDENT MANAGEMENT VIEW (NEW)
//   if (active === 'students') {
//     return (
//       <div>
//         {toast && <Toast message={toast} onClose={() => setToast('')} />}
//         <PageHeader title="Student Management" subtitle="Create and manage student accounts (Technician responsibility)"
//           action={<Button onClick={openNewStudent}><Plus className="w-4 h-4 inline mr-1" />Register Student</Button>} />

//         <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
//           <div className="relative">
//             <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//             <Input
//               placeholder="Search by name or registration number"
//               value={studentSearch}
//               onChange={e => setStudentSearch(e.target.value)}
//               className="pl-9"
//             />
//           </div>
//         </div>

//         <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Actions']} rowCount={filteredStudents.length}>
//           {filteredStudents.map(s => (
//             <tr key={s.id} className="hover:bg-slate-50">
//               <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
//               <td className="px-4 py-3 font-medium">{s.name}</td>
//               <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
//               <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
//               <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
//               <td className="px-4 py-3">
//                 <div className="flex gap-2">
//                   <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 className="w-4 h-4" /></button>
//                   <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active"><Power className="w-4 h-4" /></button>
//                 </div>
//               </td>
//             </tr>
//           ))}
//         </Table>

//         <Modal open={studentModal} onClose={() => setStudentModal(false)} title={editingStudent ? 'Edit Student' : 'Register New Student'}>
//           <form onSubmit={submitStudent} className="space-y-4">
//             <Field label="Full Name" required><Input value={sForm.name} onChange={e => setSForm({ ...sForm, name: e.target.value })} /></Field>
//             <Field label="Email"><Input type="email" value={sForm.email} onChange={e => setSForm({ ...sForm, email: e.target.value })} placeholder="optional" /></Field>
//             <Field label="Program"><Input value={sForm.program} onChange={e => setSForm({ ...sForm, program: e.target.value })} placeholder="e.g. Electrical Engineering" /></Field>
//             <Field label="Level">
//               <Select value={sForm.level} onChange={e => setSForm({ ...sForm, level: e.target.value })}>
//                 <option>Year 1</option><option>Year 2</option><option>Year 3</option><option>Year 4</option>
//               </Select>
//             </Field>
//             <Field label="Password" required={!editingStudent}><Input type="text" value={sForm.password} onChange={e => setSForm({ ...sForm, password: e.target.value })} placeholder={editingStudent ? 'Leave blank to keep current' : 'student123'} /></Field>
//             {!editingStudent && <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded">A registration number will be auto-generated.</p>}
//             <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sForm.active} onChange={e => setSForm({ ...sForm, active: e.target.checked })} />Active</label>
//             <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setStudentModal(false)}>Cancel</Button><Button type="submit">{editingStudent ? 'Update' : 'Register'}</Button></div>
//           </form>
//         </Modal>
//       </div>
//     );
//   }

//   // SETTINGS VIEW
//   // if (active === 'settings') {
//   //   const startEdit = (idx: number, currentMin: number, currentMax: number) => {
//   //     setEditingIndex(idx);
//   //     setEditValue({ min: currentMin, max: currentMax });
//   //   };

//   //   const saveEdit = (idx: number) => {
//   //     const updated = [...gradingScale];
//   //     updated[idx] = { ...updated[idx], min: editValue.min, max: editValue.max };
//   //     setGradingScale(updated);
//   //     setEditingIndex(null);
//   //   };

//   //   return (
//   //     <div>
//   //       {toast && <Toast message={toast} onClose={() => setToast('')} />}
//   //       <PageHeader title="System Settings" subtitle="Grading rules and system configuration" />
//   //       <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
//   //         <div className="flex justify-between items-center mb-4">
//   //           <h3 className="font-semibold text-slate-900 flex items-center gap-2">
//   //             <SettingsIcon className="w-4 h-4" /> Grading Scale
//   //           </h3>
//   //           <Button onClick={saveGradingScale}>Save Changes</Button>
//   //         </div>
//   //         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//   //           {gradingScale.map((item, idx) => (
//   //             <div key={item.grade} className="p-4 border border-slate-200 rounded-lg">
//   //               <div className="flex items-center justify-between">
//   //                 <span className="text-2xl font-bold text-blue-700">{item.grade}</span>
//   //                 {editingIndex === idx ? (
//   //                   <div className="flex gap-1">
//   //                     <Input
//   //                       type="number"
//   //                       value={editValue.min}
//   //                       onChange={e => setEditValue({ ...editValue, min: parseInt(e.target.value) })}
//   //                       className="w-16 h-8 text-xs"
//   //                     />
//   //                     <span>-</span>
//   //                     <Input
//   //                       type="number"
//   //                       value={editValue.max}
//   //                       onChange={e => setEditValue({ ...editValue, max: parseInt(e.target.value) })}
//   //                       className="w-16 h-8 text-xs"
//   //                     />
//   //                     <button onClick={() => saveEdit(idx)} className="text-green-600 ml-1">✓</button>
//   //                     <button onClick={() => setEditingIndex(null)} className="text-red-600">✗</button>
//   //                   </div>
//   //                 ) : (
//   //                   <span
//   //                     className="text-xs text-slate-500 cursor-pointer hover:text-blue-600"
//   //                     onClick={() => startEdit(idx, item.min, item.max)}
//   //                   >
//   //                     {item.min} - {item.max} ✏️
//   //                   </span>
//   //                 )}
//   //               </div>
//   //               <p className="text-sm text-slate-600 mt-1">{item.description}</p>
//   //             </div>
//   //           ))}
//   //         </div>
//   //       </div>
//   //       <div className="bg-white border border-slate-200 rounded-xl p-6">
//   //         <h3 className="font-semibold text-slate-900 mb-4">Access Control Rules</h3>
//   //         <ul className="space-y-2 text-sm text-slate-700">
//   //           <li className="flex gap-2"><span className="text-emerald-600">✓</span> Only Instructors can create courses and modules</li>
//   //           <li className="flex gap-2"><span className="text-emerald-600">✓</span> Only Accounts can approve results</li>
//   //           <li className="flex gap-2"><span className="text-emerald-600">✓</span> Approved results are permanently locked</li>
//   //           <li className="flex gap-2"><span className="text-emerald-600">✓</span> Students see only approved results</li>
//   //           <li className="flex gap-2"><span className="text-emerald-600">✓</span> No public registration permitted</li>
//   //           <li className="flex gap-2"><span className="text-emerald-600">✓</span> All actions are audit-logged</li>
//   //         </ul>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   // AUDIT VIEW
//   if (active === 'audit') {
//     return (
//       <div>
//         <PageHeader title="Audit Logs" subtitle={`${audits.length} system events recorded`} />
//         <Table headers={['Timestamp', 'User', 'Action', 'Details']} rowCount={audits.length}>
//           {audits.map(a => (
//             <tr key={a.id} className="hover:bg-slate-50">
//               <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(a.timestamp).toLocaleString()}</td>
//               <td className="px-4 py-3 text-slate-900">{a.userName}</td>
//               <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{a.action}</span></td>
//               <td className="px-4 py-3 text-slate-600">{a.details}</td>
//             </tr>
//           ))}
//         </Table>
//       </div>
//     );
//   }

//   return null;
// };

// export default TechnicianDash;