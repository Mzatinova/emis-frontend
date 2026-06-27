import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Select, Badge, Table, Toast, Button } from '@/components/shared/UI';
import { Download, Repeat, Users, BookOpen, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

interface RepeaterReportProps {
    toast: string;
    setToast: (msg: string) => void;
}

const RepeaterReport: React.FC<RepeaterReportProps> = ({ toast, setToast }) => {
    const { students, results, sessions, repeatersList } = useEMIS();

    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    // Get only approved results
    const approvedResults = results.filter(r => r.status === 'approved');

    // Get sessions with results
    // const sessionsWithResults = useMemo(() => {
    //     const sessionIds = new Set(approvedResults.map(r => String(r.academic_session_id)).filter(Boolean));
    //     return sessions.filter(s => sessionIds.has(String(s.id)));
    // }, [sessions, approvedResults]);

    // Get unique programs
    const programs = useMemo(() => {
        const progSet = new Set();
        students.forEach(s => {
            if (s.program) progSet.add(s.program);
        });
        return Array.from(progSet);
    }, [students]);

    // Get unique levels
    const levels = useMemo(() => {
        const levelSet = new Set();
        students.forEach(s => {
            if (s.level) levelSet.add(s.level);
        });
        return Array.from(levelSet).sort();
    }, [students]);

    // Filter repeaters
// Filter repeaters (no session filter)
const filteredRepeaters = useMemo(() => {
    let repeaters = repeatersList;

    // Filter by program
    if (selectedProgram) {
        const programStudentIds = students.filter(s => s.program === selectedProgram).map(s => String(s.id));
        repeaters = repeaters.filter(r => programStudentIds.includes(String(r.student_id)));
    }

    // Filter by level
    if (selectedLevel) {
        const levelStudentIds = students.filter(s => s.level === selectedLevel).map(s => String(s.id));
        repeaters = repeaters.filter(r => levelStudentIds.includes(String(r.student_id)));
    }

    return repeaters;
}, [repeatersList, selectedProgram, selectedLevel, students]);

    // Enrich repeater data with student info
    const enrichedRepeaters = useMemo(() => {
        return filteredRepeaters.map(repeater => {
            const student = students.find(s => s.id === repeater.student_id);
            const failedCourses = repeater.failed_courses || [];
            const session = sessions.find(s => String(s.id) === String(repeater.academic_session_id));
            
            // Get all results for this student in the failed courses
            const studentResults = approvedResults.filter(r => 
                String(r.studentId) === String(repeater.student_id) &&
                String(r.academic_session_id) === String(repeater.academic_session_id)
            );

            return {
                ...repeater,
                studentName: student?.name || 'Unknown',
                regNumber: student?.regNumber || 'N/A',
                program: student?.program || 'N/A',
                level: student?.level || 'N/A',
                active: student?.active || false,
              
                failedCourses: failedCourses,
                totalFailed: failedCourses.length,
                studentResults: studentResults,
            };
        });
    }, [filteredRepeaters, students, sessions, approvedResults]);

    // Statistics
    const stats = useMemo(() => {
        const totalRepeaters = enrichedRepeaters.length;
        const uniqueStudents = new Set(enrichedRepeaters.map(r => r.student_id)).size;
        
        // Count by program
        const programCounts: Record<string, number> = {};
        enrichedRepeaters.forEach(r => {
            if (r.program) {
                programCounts[r.program] = (programCounts[r.program] || 0) + 1;
            }
        });
        
        // Count by level
        const levelCounts: Record<string, number> = {};
        enrichedRepeaters.forEach(r => {
            if (r.level) {
                levelCounts[r.level] = (levelCounts[r.level] || 0) + 1;
            }
        });
        
        // Count failed courses
        const courseCounts: Record<string, number> = {};
        enrichedRepeaters.forEach(r => {
            r.failedCourses.forEach((course: any) => {
                if (course.course_name) {
                    courseCounts[course.course_name] = (courseCounts[course.course_name] || 0) + 1;
                }
            });
        });
        
        return { totalRepeaters, uniqueStudents, programCounts, levelCounts, courseCounts };
    }, [enrichedRepeaters]);

    // Toggle expand
    const toggleExpand = (studentId: string) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    // Download CSV
    const downloadReport = () => {
        let csv = 'Student,Reg Number,Program,Level,Failed Courses,Total Failed,Session\n';
        
        enrichedRepeaters.forEach(r => {
            const courses = r.failedCourses.map((c: any) => c.course_name).join('; ');
            csv += `${r.studentName},${r.regNumber},${r.program},${r.level},"${courses}",${r.totalFailed},${r.sessionYear}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
   
        a.click();
        window.URL.revokeObjectURL(url);
        setToast('Report downloaded');
    };

    // Get grade color
    const getGradeColor = (grade: string) => {
        if (grade === 'F') return 'text-red-600 bg-red-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader 
                title="Repeater Report" 
                subtitle="Students who failed courses and need to repeat"
                action={
                    <Button onClick={downloadReport} disabled={enrichedRepeaters.length === 0}>
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                        <Select 
                            value={selectedProgram}
                            onChange={e => setSelectedProgram(e.target.value)}
                        >
                            <option value="">All Programs</option>
                            {programs.map(p => (
                                <option key={p as string} value={p as string}>{p as string}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                        <Select 
                            value={selectedLevel}
                            onChange={e => setSelectedLevel(e.target.value)}
                        >
                            <option value="">All Levels</option>
                            {levels.map(l => (
                                <option key={l as string} value={l as string}>{l as string}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            {enrichedRepeaters.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Repeat className="w-4 h-4 text-red-600" />
                                Total Repeaters
                            </div>
                            <div className="text-2xl font-bold text-red-600">{stats.totalRepeaters}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Users className="w-4 h-4 text-blue-600" />
                                Unique Students
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{stats.uniqueStudents}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                Most Failed Course
                            </div>
                            <div className="text-sm font-medium text-slate-900 truncate">
                                {Object.entries(stats.courseCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 1)
                                    .map(([course, count]) => `${course} (${count})`)[0] || 'N/A'}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                                Most Affected Level
                            </div>
                            <div className="text-sm font-medium text-slate-900">
                                {Object.entries(stats.levelCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 1)
                                    .map(([level, count]) => `${level} (${count})`)[0] || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Program Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm">By Program</h4>
                            <div className="space-y-1">
                                {Object.entries(stats.programCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 5)
                                    .map(([program, count]) => (
                                        <div key={program} className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">{program}</span>
                                            <Badge status="error">{count}</Badge>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <h4 className="font-semibold text-slate-900 mb-2 text-sm">By Level</h4>
                            <div className="space-y-1">
                                {Object.entries(stats.levelCounts)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([level, count]) => (
                                        <div key={level} className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">{level}</span>
                                            <Badge status="error">{count}</Badge>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Repeater Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Program</th>
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Level</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Failed Courses</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Details</th>
</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {enrichedRepeaters.map((repeater) => {
                                const isExpanded = expandedStudent === repeater.student_id;
                                
                                return (
                                    <React.Fragment key={repeater.student_id}>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{repeater.studentName}</div>
                                                <div className="text-xs text-slate-500 font-mono">{repeater.regNumber}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{repeater.program}</td>
                                            <td className="px-4 py-3 text-slate-600">{repeater.level}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge status="error">{repeater.totalFailed}</Badge>
                                            </td>
                                           
                                            <td className="px-4 py-3 text-center">
                                                <Badge status={repeater.active ? 'active' : 'inactive'}>
                                                    {repeater.active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleExpand(repeater.student_id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                                >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-3 bg-red-50">
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-semibold text-red-700">Failed Courses</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                            {repeater.failedCourses.map((course: any, idx: number) => {
                                                                const result = repeater.studentResults.find(
                                                                    (r: any) => r.courseName === course.course_name
                                                                );
                                                                return (
                                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-red-200 flex justify-between items-center">
                                                                        <div>
                                                                            <span className="text-sm font-medium">{course.course_name}</span>
                                                                            <div className="text-xs text-slate-500">
                                                                                Required Pass: {course.required_pass}%
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-bold text-red-600">
                                                                                {result?.marks ?? '—'}%
                                                                            </span>
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeColor('F')}`}>
                                                                                F
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-2">
                                                            <span className="font-medium">Note:</span> Student must repeat {repeater.totalFailed} course(s) in the next session.
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {enrichedRepeaters.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <Repeat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p>No repeaters found for the selected filters</p>
                        <p className="text-sm text-slate-400">All students passed their courses</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RepeaterReport;