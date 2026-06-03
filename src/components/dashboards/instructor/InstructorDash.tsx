import React, { useState, useMemo, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { StatCard, Badge, PageHeader, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
import { BookOpen, Users, FileText, Search, Upload, Edit2, GraduationCap, Plus } from 'lucide-react';
import InstructorStudents from './InstructorStudents';
import InstructorResults from './InstructorResults';
import InstructorClasses from './InstructorClasses';
import { useRegistration } from '@/contexts/RegistrationContext';

const InstructorDash: React.FC<{ active: string }> = ({ active }) => {
  const { currentUser, students, courses, results, sessions, addResult, updateResult, apiRequest } = useEMIS();
  //  const { registrations } = useRegistration();
  const { registrations, fetchInstructorRegistrations } = useRegistration();

  const [toast, setToast] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [myAssignedCourses, setMyAssignedCourses] = useState<{ programName: string; level: number; courseName: string }[]>([]);

  useEffect(() => {
    fetchInstructorRegistrations();
  }, []);

  useEffect(() => {
    const fetchAssignedCourses = async () => {
      try {
        const response = await apiRequest('/instructor/courses');
        if (response.data) {
          setMyAssignedCourses(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch assigned courses:', error);
      }
    };
    fetchAssignedCourses();
  }, []);


  // Get students filtered by instructor's assigned courses
  //   const getStudentsByCourse = () => {

  //   const studentMap: { [key: string]: any[] } = {};


  //   myAssignedCourses.forEach(assigned => {
  //     const key = `${assigned.programName} - Level ${assigned.level} - ${assigned.courseName}`;

  //     // Get students who have APPROVED registration for this specific course
  //     const matchedStudents = students.filter(s => {
  //       // Check if student has approved registration for this program, level, and course
  //       const hasApprovedRegistration = registrations.some(r => 
  //       String(r.studentId) === String(s.id) &&
  //       r.registrationStatus === 'approved' &&
  //       String(r.programName) === String(assigned.programName) &&
  //       String(r.level) === String(assigned.level) &&
  //       r.courses?.includes(assigned.courseName)
  //       );

  //       // const hasApprovedRegistration = registrations.some(r => 
  //       //   r.studentId === s.id &&
  //       //   r.registrationStatus === 'approved' &&
  //       //   r.programName === assigned.programName &&
  //       //   r.level === assigned.level &&
  //       //   r.courses?.includes(assigned.courseName)
  //       // );
  //       return s.active && hasApprovedRegistration;
  //     });


  //     console.log('Key:', key);
  // console.log('Matched students count:', matchedStudents.length);
  // console.log('Students in filter:', students.map(s => ({ id: s.id, name: s.name, active: s.active })));
  // console.log('Registrations:', registrations.map(r => ({ studentId: r.studentId, programName: r.programName, level: r.level, courses: r.courses })));
  //     if (matchedStudents.length > 0) {
  //       studentMap[key] = matchedStudents;
  //     }
  //   });

  //   return studentMap;
  // };
  // const getStudentsByCourse = () => {
  //   // Students are assigned to programs and levels
  //   // Need to match: student.program matches programName, student.level matches level
  //   const studentMap: { [key: string]: any[] } = {};

  //   myAssignedCourses.forEach(assigned => {
  //     const key = `${assigned.programName} - Level ${assigned.level} - ${assigned.courseName}`;
  //     const matchedStudents = students.filter(s =>
  //       s.active &&
  //       s.program === assigned.programName &&
  //       s.level === `Year ${assigned.level}`
  //     );
  //     if (matchedStudents.length > 0) {
  //       studentMap[key] = matchedStudents;
  //     }
  //   });

  //   return studentMap;
  // };

  // const studentsByCourse = getStudentsByCourse();
  const studentsByCourse = useMemo(() => {
    const activeSession = sessions.find(s => s.active === true);
    if (!activeSession) return {};

    const studentMap: { [key: string]: any[] } = {};

    myAssignedCourses.forEach(assigned => {
      const key = `${assigned.programName} - Level ${assigned.level} - ${assigned.courseName}`;

      const matchedStudents = students.filter(s => {
        const hasApprovedRegistration = registrations.some(r =>
          String(r.studentId) === String(s.id) &&
          r.registrationStatus === 'approved' &&
          String(r.programName) === String(assigned.programName) &&
          String(r.level) === String(assigned.level) &&
          r.courses?.includes(assigned.courseName) &&
          String(r.academic_session_id) === String(activeSession.id)
        );
        return s.active && hasApprovedRegistration;
      });

      if (matchedStudents.length > 0) {
        studentMap[key] = matchedStudents;
      }
    });

    return studentMap;
  }, [myAssignedCourses, students, registrations, sessions]);
  //   const studentsByCourse = useMemo(() => {

  //     console.log('Registration details:', registrations.map(r => ({
  //     studentId: r.studentId,
  //     programName: r.programName,
  //     level: r.level,
  //     courses: r.courses
  //   })));


  //   const studentMap: { [key: string]: any[] } = {};

  //   myAssignedCourses.forEach(assigned => {
  //     const key = `${assigned.programName} - Level ${assigned.level} - ${assigned.courseName}`;

  //     const matchedStudents = students.filter(s => {
  //       const hasApprovedRegistration = registrations.some(r => 
  //         String(r.studentId) === String(s.id) &&
  //         r.registrationStatus === 'approved' &&
  //         String(r.programName) === String(assigned.programName) &&
  //         String(r.level) === String(assigned.level) &&
  //         r.courses?.includes(assigned.courseName)
  //       );
  //       return s.active && hasApprovedRegistration;
  //     });

  //     console.log('Key:', key);
  // console.log('Matched students count:', matchedStudents.length);

  //     if (matchedStudents.length > 0) {
  //       studentMap[key] = matchedStudents;
  //     }
  //   });

  //   return studentMap;
  // }, [myAssignedCourses, students, registrations]);

  console.log('studentsByCourse:', studentsByCourse);

  // Results Management
  const [resultModal, setResultModal] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [rForm, setRForm] = useState({ studentId: '', courseId: '', sessionId: '', ca: '', exam: '' });
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('regNumber,courseCode,ca,exam\nTC/2025/003,EE201-Practical,22,55');
  const [filters, setFilters] = useState({ search: '', courseId: '', moduleId: '', sessionId: '', status: '' });

  // Filter results for this instructor's courses
  const myResults = useMemo(() => {
    return results.filter(r =>
      myAssignedCourses.some(c =>
        r.courseName === c.courseName ||
        r.courseId?.includes(c.courseName)
      )
    );
  }, [results, myAssignedCourses]);

  const openNewResult = () => {
    setEditingResult(null);
    setRForm({ studentId: '', courseId: '', sessionId: sessions[0]?.id || '', ca: '', exam: '' });
    setResultModal(true);
  };

  const openEditResult = (r: any) => {
    if (r.status === 'approved') { setToast('Cannot edit approved (locked) result'); return; }
    setEditingResult(r);
    setRForm({ studentId: r.studentId, courseId: r.courseId, sessionId: r.sessionId, ca: r.ca?.toString() || '', exam: r.exam?.toString() || '' });
    setResultModal(true);
  };

  const submitResult = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === rForm.studentId);
    if (!student || !rForm.courseId || !rForm.sessionId) { setToast('Fill all fields'); return; }
    const ca = rForm.ca === '' ? null : parseFloat(rForm.ca);
    const exam = rForm.exam === '' ? null : parseFloat(rForm.exam);
    if (editingResult) {
      updateResult(editingResult.id, { ca, exam });
      setToast('Result updated');
    } else {
      addResult({ studentId: student.id, studentReg: student.regNumber, courseId: rForm.courseId, sessionId: rForm.sessionId, ca, exam, createdBy: currentUser!.id });
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

      if (stu) {
        addResult({
          studentId: stu.id,
          studentReg: stu.regNumber,
          courseId: courseCode,
          sessionId: sessions[0]?.id || '',
          ca: caS ? parseFloat(caS) : null,
          exam: examS ? parseFloat(examS) : null,
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
                <span className="text-sm font-medium">⏳ Pending Approval</span>
                <span className="font-bold text-amber-700">{myResults.filter(r => r.status === 'pending').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <span className="text-sm font-medium">✓ Published</span>
                <span className="font-bold text-emerald-700">{myResults.filter(r => r.status === 'approved').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


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

  return null;
};

export default InstructorDash;
