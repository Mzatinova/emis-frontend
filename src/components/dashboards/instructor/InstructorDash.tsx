import React, { useState, useMemo, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { StatCard, Badge, PageHeader, Toast } from '@/components/shared/UI';
import { BookOpen, Users } from 'lucide-react';
import InstructorStudents from './InstructorStudents';
import InstructorResults from './InstructorResults';
import InstructorClasses from './InstructorClasses';
import { useRegistration } from '@/contexts/RegistrationContext';
import InstructorPerformanceReport from './InstructorPerformanceReport';

const InstructorDash: React.FC<{ active: string }> = ({ active }) => {
  const { currentUser, students, sessions, apiRequest } = useEMIS();
  const { registrations, fetchInstructorRegistrations } = useRegistration();

  const [toast, setToast] = useState('');
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

  // Get students for this instructor
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

  // Get total unique students
  const totalStudents = new Set(Object.values(studentsByCourse).flat().map(s => s?.id)).size;

  // ========== DASHBOARD VIEW ==========
  if (active === 'dashboard') {
    return (
      <div>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
        <PageHeader title="Instructor Dashboard" subtitle="View your assigned courses and students" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatCard label="My Assigned Courses" value={myAssignedCourses.length} icon={BookOpen} color="bg-emerald-600" />
          <StatCard label="My Students" value={totalStudents} icon={Users} color="bg-blue-600" />
        </div>
        
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

  if (active === 'results') {
    return (
      <InstructorResults
        toast={toast}
        setToast={setToast}
        myAssignedCourses={myAssignedCourses}
      />
    );
  }

  if (active === 'performance') {
    return (
        <InstructorPerformanceReport
            toast={toast}
            setToast={setToast}
            myAssignedCourses={myAssignedCourses}
        />
    );
}

  return null;
};

export default InstructorDash;

