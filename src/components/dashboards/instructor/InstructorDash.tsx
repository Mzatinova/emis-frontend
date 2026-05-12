import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { StatCard, Badge, PageHeader, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
import { BookOpen, Users, FileText, Search, Upload, Edit2, GraduationCap, Plus } from 'lucide-react';
import InstructorStudents from './InstructorStudents';
import InstructorResults from './InstructorResults';
import InstructorClasses from './InstructorClasses';

const InstructorDash: React.FC<{ active: string }> = ({ active }) => {
  const { currentUser, students, courses, modules, results, sessions, addResult, updateResult } = useEMIS();
  const [toast, setToast] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');

  // Load programs from localStorage to get course assignments
  const [programs] = useState(() => {
    const saved = localStorage.getItem('emis_programs');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Get courses assigned to this instructor from programs
  const myAssignedCourses = useMemo(() => {
    const assigned: { programName: string; level: number; courseName: string }[] = [];
    programs.forEach((program: any) => {
      program.courses.forEach((course: any) => {
        if (course.instructorId === currentUser?.id) {
          assigned.push({
            programName: program.name,
            level: course.level,
            courseName: course.courseName,
          });
        }
      });
    });
    return assigned;
  }, [programs, currentUser]);

  // Get students filtered by instructor's assigned courses
  const getStudentsByCourse = () => {
    // Students are assigned to programs and levels
    // Need to match: student.program matches programName, student.level matches level
    const studentMap: { [key: string]: any[] } = {};

    myAssignedCourses.forEach(assigned => {
      const key = `${assigned.programName} - Level ${assigned.level} - ${assigned.courseName}`;
      const matchedStudents = students.filter(s =>
        s.active &&
        s.program === assigned.programName &&
        s.level === `Year ${assigned.level}`
      );
      if (matchedStudents.length > 0) {
        studentMap[key] = matchedStudents;
      }
    });

    return studentMap;
  };

  const studentsByCourse = getStudentsByCourse();

  // Results Management
  const [resultModal, setResultModal] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [rForm, setRForm] = useState({ studentId: '', courseId: '', moduleId: '', sessionId: '', ca: '', exam: '' });
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('regNumber,courseCode,ca,exam\nTC/2025/003,EE201-Practical,22,55');
  const [filters, setFilters] = useState({ search: '', courseId: '', moduleId: '', sessionId: '', status: '' });

  // Filter results for this instructor's courses
  const myResults = useMemo(() => {
    // Get all module IDs from courses this instructor teaches
    const myModuleIds = modules
      .filter(m => myAssignedCourses.some(c =>
        c.courseName === m.name ||
        m.name?.includes(c.courseName)
      ))
      .map(m => m.id);

    return results.filter(r => myModuleIds.includes(r.moduleId));
  }, [results, modules, myAssignedCourses]);

  const openNewResult = () => {
    setEditingResult(null);
    setRForm({ studentId: '', courseId: '', moduleId: '', sessionId: sessions[0]?.id || '', ca: '', exam: '' });
    setResultModal(true);
  };

  const openEditResult = (r: any) => {
    if (r.status === 'approved') { setToast('Cannot edit approved (locked) result'); return; }
    setEditingResult(r);
    setRForm({ studentId: r.studentId, courseId: r.courseId, moduleId: r.moduleId, sessionId: r.sessionId, ca: r.ca?.toString() || '', exam: r.exam?.toString() || '' });
    setResultModal(true);
  };

  const submitResult = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === rForm.studentId);
    if (!student || !rForm.courseId || !rForm.moduleId || !rForm.sessionId) { setToast('Fill all fields'); return; }
    const ca = rForm.ca === '' ? null : parseFloat(rForm.ca);
    const exam = rForm.exam === '' ? null : parseFloat(rForm.exam);
    if (editingResult) {
      updateResult(editingResult.id, { ca, exam });
      setToast('Result updated');
    } else {
      addResult({ studentId: student.id, studentReg: student.regNumber, courseId: rForm.courseId, moduleId: rForm.moduleId, sessionId: rForm.sessionId, ca, exam, createdBy: currentUser!.id });
      setToast('Result entered');
    }
    setResultModal(false);
  };

  const handleCsv = () => {
    const lines = csvText.trim().split('\n').slice(1);
    let added = 0;
    lines.forEach(line => {
      const [reg, courseCode, caS, examS] = line.split(',').map(s => s.trim());
      const stu = students.find(s => s.regNumber === reg);
      // Find module by course code pattern
      const mod = modules.find(m => m.code?.toLowerCase().includes(courseCode.toLowerCase()));
      if (stu && mod) {
        addResult({
          studentId: stu.id, studentReg: stu.regNumber, courseId: mod.courseId, moduleId: mod.id,
          sessionId: sessions[0]?.id || '', ca: caS ? parseFloat(caS) : null, exam: examS ? parseFloat(examS) : null,
          createdBy: currentUser!.id
        });
        added++;
      }
    });
    setCsvOpen(false);
    setToast(`${added} results entered from CSV`);
  };

  const filteredResults = useMemo(() => myResults.filter(r => {
    const student = students.find(s => s.id === r.studentId);
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search ||
        r.studentReg.toLowerCase().includes(searchTerm) ||
        (student?.name || '').toLowerCase().includes(searchTerm)) &&
      (!filters.status || r.status === filters.status)
    );
  }), [myResults, filters, students]);

  // ========== DASHBOARD VIEW ==========
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Instructor Dashboard" subtitle="View your students and enter results" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="My Assigned Courses" value={myAssignedCourses.length} icon={BookOpen} color="bg-emerald-600" />
          <StatCard label="My Students" value={Object.values(studentsByCourse).flat().length} icon={Users} color="bg-blue-600" />
          <StatCard label="Results Entered" value={myResults.length} icon={FileText} color="bg-purple-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> My Assigned Courses
            </h3>
            <div className="space-y-3">
              {myAssignedCourses.length === 0 ? (
                <p className="text-slate-400 text-sm">No courses assigned yet by Admin</p>
              ) : (
                myAssignedCourses.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className="font-mono text-xs text-blue-700 font-bold">{c.programName}</span>
                      <p className="text-sm text-slate-900">Level {c.level} - {c.courseName}</p>
                    </div>
                    <Badge status="active">Assigned</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Result Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium">Pending</span>
                <span className="font-bold text-amber-700">{myResults.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium">Approved (Locked)</span>
                <span className="font-bold text-emerald-700">{myResults.filter(r => r.status === 'approved').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== MY STUDENTS VIEW ==========
  // if (active === 'mystudents') {

  //   const courseOptions = Object.keys(studentsByCourse);

  //   const displayStudents = selectedCourse
  //     ? studentsByCourse[selectedCourse] || []
  //     : Object.values(studentsByCourse).flat();

  //   return (
  //     <div>
  //       {toast && <Toast message={toast} onClose={() => setToast('')} />}
  //       <PageHeader title="My Students" subtitle="Students assigned to your courses by level" />

  //       <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
  //         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  //           <div className="relative">
  //             <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
  //             <Input
  //               placeholder="Search by name or reg number"
  //               value={filters.search}
  //               onChange={e => setFilters({ ...filters, search: e.target.value })}
  //               className="pl-9"
  //             />
  //           </div>
  //           <Select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
  //             <option value="">All Courses</option>
  //             {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
  //           </Select>
  //         </div>
  //       </div>

  //       {displayStudents.length === 0 ? (
  //         <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
  //           <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
  //           <p className="text-slate-500">No students assigned to your courses yet</p>
  //           <p className="text-sm text-slate-400">Students will appear here once Admin assigns them to programs and levels</p>
  //         </div>
  //       ) : (
  //         <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Course']} rowCount={displayStudents.length}>
  //           {displayStudents
  //             .filter(s => !filters.search ||
  //               s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
  //               s.regNumber.toLowerCase().includes(filters.search.toLowerCase()))
  //             .map(s => (
  //               <tr key={s.id} className="hover:bg-slate-50">
  //                 <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
  //                 <td className="px-4 py-3 font-medium">{s.name}</td>
  //                 <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
  //                 <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
  //                 <td className="px-4 py-3">
  //                   {selectedCourse || (
  //                     <div className="flex flex-wrap gap-1">
  //                       {myAssignedCourses
  //                         .filter(c => s.program === c.programName && s.level === `Year ${c.level}`)
  //                         .map((c, idx) => <Badge key={idx} status="active">{c.courseName}</Badge>)}
  //                     </div>
  //                   )}
  //                 </td>
  //               </tr>
  //             ))}
  //         </Table>
  //       )}
  //     </div>
  //   );
  // }

  if (active === 'myclasses') {
    return (
      <InstructorClasses
        toast={toast}
        setToast={setToast}
        myAssignedCourses={myAssignedCourses}
      />
    );
  }

  if (active === 'mystudents') {
    return (
      <InstructorStudents
        toast={toast}
        setToast={setToast}
        myAssignedCourses={myAssignedCourses}
        studentsByCourse={studentsByCourse}
      />
    );
  }

  // ========== RESULTS VIEW ==========
  if (active === 'results') {
    return (
      <InstructorResults
        toast={toast}
        setToast={setToast}
        myAssignedCourses={myAssignedCourses}
      />
    );
  }
  // if (active === 'results') {
  //   return (
  //     <div>
  //       {toast && <Toast message={toast} onClose={() => setToast('')} />}
  //       <PageHeader
  //         title="Results Management"
  //         subtitle="Enter and edit results for your students (locked after approval)"
  //         action={
  //           <div className="flex gap-2">
  //             <Button variant="secondary" onClick={() => setCsvOpen(true)}>
  //               <Upload className="w-4 h-4 inline mr-1" />CSV Upload
  //             </Button>
  //             <Button onClick={openNewResult}>
  //               <Plus className="w-4 h-4 inline mr-1" />Enter Result
  //             </Button>
  //           </div>
  //         }
  //       />

  //       <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
  //         <div className="relative">
  //           <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
  //           <Input
  //             placeholder="Search by name or reg number"
  //             value={filters.search}
  //             onChange={e => setFilters({ ...filters, search: e.target.value })}
  //             className="pl-9"
  //           />
  //         </div>
  //         <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
  //           <option value="">All statuses</option>
  //           <option value="pending">Pending</option>
  //           <option value="approved">Approved</option>
  //         </Select>
  //       </div>

  //       <Table headers={['Student', 'Course', 'Module', 'CA', 'Exam', 'Total', 'Grade', 'Status', 'Actions']} rowCount={filteredResults.length}>
  //         {filteredResults.map(r => {
  //           const stu = students.find(s => s.id === r.studentId);
  //           const cou = courses.find(c => c.id === r.courseId);
  //           const mod = modules.find(m => m.id === r.moduleId);
  //           return (
  //             <tr key={r.id} className="hover:bg-slate-50">
  //               <td className="px-4 py-3">
  //                 <div className="font-medium text-slate-900 text-xs">{stu?.name}</div>
  //                 <div className="font-mono text-xs text-slate-500">{r.studentReg}</div>
  //               </td>
  //               <td className="px-4 py-3 text-xs">{cou?.code || '—'}</td>
  //               <td className="px-4 py-3 text-xs">{mod?.code || '—'}</td>
  //               <td className="px-4 py-3 text-center">{r.ca ?? '—'}</td>
  //               <td className="px-4 py-3 text-center">{r.exam ?? '—'}</td>
  //               <td className="px-4 py-3 text-center font-medium">{r.total ?? '—'}</td>
  //               <td className="px-4 py-3 text-center">
  //                 <span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : r.grade === 'INC' ? 'text-amber-600' : 'text-emerald-600'}`}>
  //                   {r.grade}
  //                 </span>
  //               </td>
  //               <td className="px-4 py-3"><Badge status={r.status} /></td>
  //               <td className="px-4 py-3">
  //                 {r.status === 'pending' ? (
  //                   <button onClick={() => openEditResult(r)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
  //                     <Edit2 className="w-4 h-4" />
  //                   </button>
  //                 ) : <span className="text-xs text-slate-400">Locked</span>}
  //               </td>
  //             </tr>
  //           );
  //         })}
  //       </Table>

  //       <Modal open={resultModal} onClose={() => setResultModal(false)} title={editingResult ? 'Edit Result' : 'Enter Result'}>
  //         <form onSubmit={submitResult} className="space-y-4">
  //           <Field label="Student" required>
  //             <Select value={rForm.studentId} onChange={e => setRForm({ ...rForm, studentId: e.target.value })} disabled={!!editingResult}>
  //               <option value="">Select student</option>
  //               {students.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.regNumber} - {s.name}</option>)}
  //             </Select>
  //           </Field>
  //           <Field label="Course" required>
  //             <Select value={rForm.courseId} onChange={e => setRForm({ ...rForm, courseId: e.target.value, moduleId: '' })} disabled={!!editingResult}>
  //               <option value="">Select course</option>
  //               {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
  //             </Select>
  //           </Field>
  //           <Field label="Module" required>
  //             <Select value={rForm.moduleId} onChange={e => setRForm({ ...rForm, moduleId: e.target.value })} disabled={!!editingResult}>
  //               <option value="">Select module</option>
  //               {modules.filter(m => m.courseId === rForm.courseId).map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
  //             </Select>
  //           </Field>
  //           <Field label="Session" required>
  //             <Select value={rForm.sessionId} onChange={e => setRForm({ ...rForm, sessionId: e.target.value })} disabled={!!editingResult}>
  //               <option value="">Select session</option>
  //               {sessions.map(s => <option key={s.id} value={s.id}>{s.year} - {s.semester}</option>)}
  //             </Select>
  //           </Field>
  //           <div className="grid grid-cols-2 gap-3">
  //             <Field label="CA (0-30)">
  //               <Input type="number" min="0" max="30" value={rForm.ca} onChange={e => setRForm({ ...rForm, ca: e.target.value })} />
  //             </Field>
  //             <Field label="Exam (0-70)">
  //               <Input type="number" min="0" max="70" value={rForm.exam} onChange={e => setRForm({ ...rForm, exam: e.target.value })} />
  //             </Field>
  //           </div>
  //           <p className="text-xs text-slate-500 bg-amber-50 p-2 rounded">Leave blank for missing marks. Grade auto-computed.</p>
  //           <div className="flex justify-end gap-2">
  //             <Button type="button" variant="secondary" onClick={() => setResultModal(false)}>Cancel</Button>
  //             <Button type="submit">{editingResult ? 'Update' : 'Submit'}</Button>
  //           </div>
  //         </form>
  //       </Modal>

  //       <Modal open={csvOpen} onClose={() => setCsvOpen(false)} title="CSV Bulk Upload" size="lg">
  //         <p className="text-sm text-slate-600 mb-2">Format: <code className="bg-slate-100 px-1 rounded">regNumber,courseCode,ca,exam</code></p>
  //         <textarea
  //           value={csvText}
  //           onChange={e => setCsvText(e.target.value)}
  //           rows={10}
  //           className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
  //         />
  //         <div className="flex justify-end gap-2 mt-3">
  //           <Button variant="secondary" onClick={() => setCsvOpen(false)}>Cancel</Button>
  //           <Button onClick={handleCsv}>Process CSV</Button>
  //         </div>
  //       </Modal>
  //     </div>
  //   );
  // }

  return null;
};

export default InstructorDash;

// import React, { useState, useMemo } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { StatCard, Badge, PageHeader, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
// import { BookOpen, Layers, FileText, Plus, Edit2, Search, Upload } from 'lucide-react';

// const InstructorDash: React.FC<{ active: string }> = ({ active }) => {
//   const { currentUser, students, courses, modules, results, sessions, addCourse, addModule, addResult, updateResult } = useEMIS();
//   const [toast, setToast] = useState('');

//   // Courses
//   const [courseModal, setCourseModal] = useState(false);
//   const [cForm, setCForm] = useState({ code: '', name: '', credits: 3 });
//   const submitCourse = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!cForm.code || !cForm.name) { setToast('All fields required'); return; }
//     addCourse({ ...cForm, instructorId: currentUser!.id });
//     setCourseModal(false); setCForm({ code: '', name: '', credits: 3 }); setToast('Course created');
//   };

//   // Modules
//   const [moduleModal, setModuleModal] = useState(false);
//   const [mForm, setMForm] = useState({ code: '', name: '', courseId: '' });
//   const submitModule = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!mForm.code || !mForm.name || !mForm.courseId) { setToast('All fields required'); return; }
//     addModule(mForm);
//     setModuleModal(false); setMForm({ code: '', name: '', courseId: '' }); setToast('Module created and assigned');
//   };

//   // Results
//   const [resultModal, setResultModal] = useState(false);
//   const [editingResult, setEditingResult] = useState<any>(null);
//   const [rForm, setRForm] = useState({ studentId: '', courseId: '', moduleId: '', sessionId: '', ca: '', exam: '' });
//   const [csvOpen, setCsvOpen] = useState(false);
//   const [csvText, setCsvText] = useState('regNumber,courseCode,moduleCode,ca,exam\nTC/2025/003,EE201,EE201-A,22,55');

//   const openNewResult = () => { setEditingResult(null); setRForm({ studentId: '', courseId: '', moduleId: '', sessionId: sessions[0]?.id || '', ca: '', exam: '' }); setResultModal(true); };
//   const openEditResult = (r: any) => {
//     if (r.status === 'approved') { setToast('Cannot edit approved (locked) result'); return; }
//     setEditingResult(r);
//     setRForm({ studentId: r.studentId, courseId: r.courseId, moduleId: r.moduleId, sessionId: r.sessionId, ca: r.ca?.toString() || '', exam: r.exam?.toString() || '' });
//     setResultModal(true);
//   };
//   const submitResult = (e: React.FormEvent) => {
//     e.preventDefault();
//     const student = students.find(s => s.id === rForm.studentId);
//     if (!student || !rForm.courseId || !rForm.moduleId || !rForm.sessionId) { setToast('Fill all fields'); return; }
//     const ca = rForm.ca === '' ? null : parseFloat(rForm.ca);
//     const exam = rForm.exam === '' ? null : parseFloat(rForm.exam);
//     if (editingResult) updateResult(editingResult.id, { ca, exam });
//     else addResult({ studentId: student.id, studentReg: student.regNumber, courseId: rForm.courseId, moduleId: rForm.moduleId, sessionId: rForm.sessionId, ca, exam, createdBy: currentUser!.id });
//     setResultModal(false); setToast(editingResult ? 'Result updated' : 'Result entered');
//   };

//   const handleCsv = () => {
//     const lines = csvText.trim().split('\n').slice(1);
//     let added = 0;
//     lines.forEach(line => {
//       const [reg, code, modCode, caS, examS] = line.split(',').map(s => s.trim());
//       const stu = students.find(s => s.regNumber === reg);
//       const cou = courses.find(c => c.code === code);
//       const mod = modules.find(m => m.code === modCode);
//       if (stu && cou && mod) {
//         addResult({ studentId: stu.id, studentReg: stu.regNumber, courseId: cou.id, moduleId: mod.id, sessionId: sessions[0]?.id || '', ca: caS ? parseFloat(caS) : null, exam: examS ? parseFloat(examS) : null, createdBy: currentUser!.id });
//         added++;
//       }
//     });
//     setCsvOpen(false); setToast(`${added} results entered from CSV`);
//   };

//   // Search
//   const [filters, setFilters] = useState({ search: '', courseId: '', moduleId: '', sessionId: '', status: '' });
//   const filtered = useMemo(() => results.filter(r => {
//     const student = students.find(s => s.id === r.studentId);
//     const searchTerm = filters.search.toLowerCase();
//     return (
//       (!filters.search ||
//         r.studentReg.toLowerCase().includes(searchTerm) ||
//         (student?.name || '').toLowerCase().includes(searchTerm)) &&
//       (!filters.courseId || r.courseId === filters.courseId) &&
//       (!filters.moduleId || r.moduleId === filters.moduleId) &&
//       (!filters.sessionId || r.sessionId === filters.sessionId) &&
//       (!filters.status || r.status === filters.status)
//     );
//   }), [results, filters, students]);

//   if (active === 'dashboard') {
//     return (
//       <div>
//         <PageHeader title="Instructor Dashboard" subtitle="Manage your courses, modules, and student results" />
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//           <StatCard label="My Courses" value={courses.length} icon={BookOpen} color="bg-emerald-600" />
//           <StatCard label="Modules" value={modules.length} icon={Layers} color="bg-blue-600" />
//           <StatCard label="Results Entered" value={results.length} icon={FileText} color="bg-purple-600" />
//           <StatCard label="Pending Approval" value={results.filter(r => r.status === 'pending').length} icon={FileText} color="bg-amber-600" />
//         </div>
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-white border border-slate-200 rounded-xl p-5">
//             <h3 className="font-semibold text-slate-900 mb-4">My Courses</h3>
//             <div className="space-y-2">
//               {courses.map(c => (
//                 <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                   <div><span className="font-mono text-xs text-blue-700 font-bold">{c.code}</span><p className="text-sm text-slate-900">{c.name}</p></div>
//                   <span className="text-xs text-slate-500">{modules.filter(m => m.courseId === c.id).length} modules</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           <div className="bg-white border border-slate-200 rounded-xl p-5">
//             <h3 className="font-semibold text-slate-900 mb-4">Result Status</h3>
//             <div className="space-y-3">
//               <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"><span className="text-sm font-medium">Pending</span><span className="font-bold text-amber-700">{results.filter(r => r.status === 'pending').length}</span></div>
//               <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg"><span className="text-sm font-medium">Approved (Locked)</span><span className="font-bold text-emerald-700">{results.filter(r => r.status === 'approved').length}</span></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (active === 'courses') {
//     return (
//       <div>
//         {toast && <Toast message={toast} onClose={() => setToast('')} />}
//         <PageHeader title="Courses" subtitle="Create and manage courses (instructor-only)"
//           action={<Button onClick={() => setCourseModal(true)}><Plus className="w-4 h-4 inline mr-1" />New Course</Button>} />
//         <Table headers={['Code', 'Course Name', 'Credits', 'Modules', 'Results']} rowCount={courses.length}>
//           {courses.map(c => (
//             <tr key={c.id} className="hover:bg-slate-50">
//               <td className="px-4 py-3 font-mono text-blue-700 font-bold text-xs">{c.code}</td>
//               <td className="px-4 py-3 font-medium">{c.name}</td>
//               <td className="px-4 py-3">{c.credits}</td>
//               <td className="px-4 py-3">{modules.filter(m => m.courseId === c.id).length}</td>
//               <td className="px-4 py-3">{results.filter(r => r.courseId === c.id).length}</td>
//             </tr>
//           ))}
//         </Table>
//         <Modal open={courseModal} onClose={() => setCourseModal(false)} title="Create Course">
//           <form onSubmit={submitCourse} className="space-y-4">
//             <Field label="Course Code" required><Input value={cForm.code} onChange={e => setCForm({ ...cForm, code: e.target.value.toUpperCase() })} placeholder="e.g. CS201" /></Field>
//             <Field label="Course Name" required><Input value={cForm.name} onChange={e => setCForm({ ...cForm, name: e.target.value })} /></Field>
//             <Field label="Credits" required><Input type="number" min="1" max="10" value={cForm.credits} onChange={e => setCForm({ ...cForm, credits: parseInt(e.target.value) || 0 })} /></Field>
//             <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setCourseModal(false)}>Cancel</Button><Button type="submit">Create</Button></div>
//           </form>
//         </Modal>
//       </div>
//     );
//   }

//   if (active === 'modules') {
//     return (
//       <div>
//         {toast && <Toast message={toast} onClose={() => setToast('')} />}
//         <PageHeader title="Modules" subtitle="Create modules and assign them to courses"
//           action={<Button onClick={() => setModuleModal(true)}><Plus className="w-4 h-4 inline mr-1" />New Module</Button>} />
//         <Table headers={['Code', 'Module Name', 'Assigned Course']} rowCount={modules.length}>
//           {modules.map(m => {
//             const c = courses.find(x => x.id === m.courseId);
//             return (
//               <tr key={m.id} className="hover:bg-slate-50">
//                 <td className="px-4 py-3 font-mono font-bold text-blue-700 text-xs">{m.code}</td>
//                 <td className="px-4 py-3 font-medium">{m.name}</td>
//                 <td className="px-4 py-3 text-slate-600">{c ? `${c.code} — ${c.name}` : '—'}</td>
//               </tr>
//             );
//           })}
//         </Table>
//         <Modal open={moduleModal} onClose={() => setModuleModal(false)} title="Create Module">
//           <form onSubmit={submitModule} className="space-y-4">
//             <Field label="Module Code" required><Input value={mForm.code} onChange={e => setMForm({ ...mForm, code: e.target.value.toUpperCase() })} placeholder="e.g. CS201-A" /></Field>
//             <Field label="Module Name" required><Input value={mForm.name} onChange={e => setMForm({ ...mForm, name: e.target.value })} /></Field>
//             <Field label="Assign to Course" required>
//               <Select value={mForm.courseId} onChange={e => setMForm({ ...mForm, courseId: e.target.value })}>
//                 <option value="">Select course</option>
//                 {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
//               </Select>
//             </Field>
//             <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setModuleModal(false)}>Cancel</Button><Button type="submit">Create & Assign</Button></div>
//           </form>
//         </Modal>
//       </div>
//     );
//   }

//   if (active === 'results') {
//     return (
//       <div>
//         {toast && <Toast message={toast} onClose={() => setToast('')} />}
//         <PageHeader title="Results Management" subtitle="Enter and edit results (locked after approval)"
//           action={
//             <div className="flex gap-2">
//               <Button variant="secondary" onClick={() => setCsvOpen(true)}><Upload className="w-4 h-4 inline mr-1" />CSV Upload</Button>
//               <Button onClick={openNewResult}><Plus className="w-4 h-4 inline mr-1" />Enter Result</Button>
//             </div>
//           } />

//         {/* FILTER BAR - ADD THIS */}
//         <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-3">
//           <div className="relative">
//             <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//             <Input
//               placeholder="Search by name or reg number"
//               value={filters.search}
//               onChange={e => setFilters({ ...filters, search: e.target.value })}
//               className="pl-9"
//             />
//           </div>
//           <Select value={filters.courseId} onChange={e => setFilters({ ...filters, courseId: e.target.value })}>
//             <option value="">All courses</option>
//             {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
//           </Select>
//           <Select value={filters.moduleId} onChange={e => setFilters({ ...filters, moduleId: e.target.value })}>
//             <option value="">All modules</option>
//             {modules.map(m => <option key={m.id} value={m.id}>{m.code}</option>)}
//           </Select>
//           <Select value={filters.sessionId} onChange={e => setFilters({ ...filters, sessionId: e.target.value })}>
//             <option value="">All sessions</option>
//             {sessions.map(s => <option key={s.id} value={s.id}>{s.year} {s.semester}</option>)}
//           </Select>
//           <Select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
//             <option value="">All statuses</option>
//             <option value="pending">Pending</option>
//             <option value="approved">Approved</option>
//           </Select>
//         </div>

//         <Table headers={['Student', 'Course', 'Module', 'CA', 'Exam', 'Total', 'Grade', 'Status', 'Actions']} rowCount={filtered.length}>
//           {filtered.map(r => {
//             const stu = students.find(s => s.id === r.studentId);
//             return (
//               <tr key={r.id} className="hover:bg-slate-50">
//                 <td className="px-4 py-3"><div className="font-medium text-xs">{stu?.name}</div><div className="font-mono text-xs text-slate-500">{r.studentReg}</div></td>
//                 <td className="px-4 py-3 text-xs">{courses.find(c => c.id === r.courseId)?.code}</td>
//                 <td className="px-4 py-3 text-xs">{modules.find(m => m.id === r.moduleId)?.code}</td>
//                 <td className="px-4 py-3 text-center">{r.ca ?? '—'}</td>
//                 <td className="px-4 py-3 text-center">{r.exam ?? '—'}</td>
//                 <td className="px-4 py-3 text-center font-medium">{r.total ?? '—'}</td>
//                 <td className="px-4 py-3 text-center"><span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : r.grade === 'INC' ? 'text-amber-600' : 'text-emerald-600'}`}>{r.grade}</span></td>
//                 <td className="px-4 py-3"><Badge status={r.status} /></td>
//                 <td className="px-4 py-3">{r.status === 'pending' ? <button onClick={() => openEditResult(r)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 className="w-4 h-4" /></button> : <span className="text-xs text-slate-400">Locked</span>}</td>
//               </tr>
//             );
//           })}
//         </Table>

//         <Modal open={resultModal} onClose={() => setResultModal(false)} title={editingResult ? 'Edit Result' : 'Enter Result'}>
//           <form onSubmit={submitResult} className="space-y-4">
//             <Field label="Student" required><Select value={rForm.studentId} onChange={e => setRForm({ ...rForm, studentId: e.target.value })} disabled={!!editingResult}><option value="">Select student</option>{students.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.regNumber} - {s.name}</option>)}</Select></Field>
//             <Field label="Course" required><Select value={rForm.courseId} onChange={e => setRForm({ ...rForm, courseId: e.target.value, moduleId: '' })} disabled={!!editingResult}><option value="">Select course</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}</Select></Field>
//             <Field label="Module" required><Select value={rForm.moduleId} onChange={e => setRForm({ ...rForm, moduleId: e.target.value })} disabled={!!editingResult}><option value="">Select module</option>{modules.filter(m => m.courseId === rForm.courseId).map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}</Select></Field>
//             <Field label="Session" required><Select value={rForm.sessionId} onChange={e => setRForm({ ...rForm, sessionId: e.target.value })} disabled={!!editingResult}><option value="">Select session</option>{sessions.map(s => <option key={s.id} value={s.id}>{s.year} - {s.semester}</option>)}</Select></Field>
//             <div className="grid grid-cols-2 gap-3">
//               <Field label="CA (0-30)"><Input type="number" min="0" max="30" value={rForm.ca} onChange={e => setRForm({ ...rForm, ca: e.target.value })} /></Field>
//               <Field label="Exam (0-70)"><Input type="number" min="0" max="70" value={rForm.exam} onChange={e => setRForm({ ...rForm, exam: e.target.value })} /></Field>
//             </div>
//             <p className="text-xs text-slate-500 bg-amber-50 p-2 rounded">Leave blank for missing marks. Grade auto-computed.</p>
//             <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setResultModal(false)}>Cancel</Button><Button type="submit">{editingResult ? 'Update' : 'Submit'}</Button></div>
//           </form>
//         </Modal>

//         <Modal open={csvOpen} onClose={() => setCsvOpen(false)} title="CSV Bulk Upload" size="lg">
//           <p className="text-sm text-slate-600 mb-2">Format: <code className="bg-slate-100 px-1 rounded">regNumber,courseCode,moduleCode,ca,exam</code></p>
//           <textarea value={csvText} onChange={e => setCsvText(e.target.value)} rows={10} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs" />
//           <div className="flex justify-end gap-2 mt-3"><Button variant="secondary" onClick={() => setCsvOpen(false)}>Cancel</Button><Button onClick={handleCsv}>Process CSV</Button></div>
//         </Modal>
//       </div>
//     );
//   }



//   return null;
// };

// export default InstructorDash;
