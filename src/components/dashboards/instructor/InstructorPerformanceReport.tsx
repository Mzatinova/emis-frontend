import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Badge, Table, Toast, Button, Select } from '@/components/shared/UI';
import { Download, TrendingUp, TrendingDown, Users, Award, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';

interface InstructorPerformanceReportProps {
    toast: string;
    setToast: (msg: string) => void;
    myAssignedCourses: { programName: string; level: number; courseName: string }[];
}

const InstructorPerformanceReport: React.FC<InstructorPerformanceReportProps> = ({
    toast,
    setToast,
    myAssignedCourses
}) => {
    const { students, results, sessions } = useEMIS();
    const { registrations } = useRegistration();
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    const activeSession = sessions.find(s => s.active === true);

    // Get unique courses from assigned
    const courseOptions = useMemo(() => {
        const unique = new Map();
        myAssignedCourses.forEach(c => {
            const key = `${c.courseName}-${c.level}`;
            if (!unique.has(key)) {
                unique.set(key, {
                    courseName: c.courseName,
                    level: c.level,
                    programName: c.programName,
                    display: `${c.courseName} (Level ${c.level})`
                });
            }
        });
        return Array.from(unique.values());
    }, [myAssignedCourses]);

    // Get unique levels
    const levelOptions = useMemo(() => {
        const levels = new Set(myAssignedCourses.map(c => c.level));
        return Array.from(levels).sort();
    }, [myAssignedCourses]);

    // Filter assigned courses
    const filteredCourses = useMemo(() => {
        let courses = myAssignedCourses;
        if (selectedCourse) {
            const [courseName, levelStr] = selectedCourse.split(' (Level ');
            const level = parseInt(levelStr?.replace(')', '') || '0');
            courses = courses.filter(c => c.courseName === courseName && c.level === level);
        }
        if (selectedLevel) {
            courses = courses.filter(c => c.level === parseInt(selectedLevel));
        }
        return courses;
    }, [myAssignedCourses, selectedCourse, selectedLevel]);

    // Get students for each course
    const courseStudents = useMemo(() => {
        const result: { [key: string]: any[] } = {};
        
        filteredCourses.forEach(assigned => {
            const key = `${assigned.courseName}-${assigned.level}-${assigned.programName}`;
            
            const matchedStudents = students.filter(s => {
                const hasApprovedRegistration = registrations.some(r =>
                    String(r.studentId) === String(s.id) &&
                    r.registrationStatus === 'approved' &&
                    String(r.programName) === String(assigned.programName) &&
                    String(r.level) === String(assigned.level) &&
                    r.courses?.includes(assigned.courseName) &&
                    String(r.academic_session_id) === String(activeSession?.id)
                );
                return s.active && hasApprovedRegistration;
            });
            
            if (matchedStudents.length > 0) {
                result[key] = matchedStudents;
            }
        });
        
        return result;
    }, [filteredCourses, students, registrations, activeSession]);

    // Get results for students in a course
    const getStudentResults = (studentId: string, courseName: string) => {
        return results.filter(r => 
            String(r.studentId) === String(studentId) &&
            r.courseName === courseName &&
            r.status === 'approved'
        );
    };

    // Calculate course performance
    const coursePerformance = useMemo(() => {
        const stats: any[] = [];
        
        Object.entries(courseStudents).forEach(([key, studentList]) => {
            const [courseName, levelStr, programName] = key.split('-');
            const level = parseInt(levelStr);
            
            let totalStudents = studentList.length;
            let passed = 0;
            let failed = 0;
            let noResults = 0;
            let totalMarks = 0;
            let studentsWithResults = 0;
            
            studentList.forEach(s => {
                const studentResults = getStudentResults(s.id, courseName);
                if (studentResults.length > 0) {
                    const latestResult = studentResults[studentResults.length - 1];
                    if (latestResult.grade !== 'F') {
                        passed++;
                    } else {
                        failed++;
                    }
                    totalMarks += latestResult.marks || 0;
                    studentsWithResults++;
                } else {
                    noResults++;
                }
            });
            
            const passRate = studentsWithResults > 0 ? (passed / studentsWithResults) * 100 : 0;
            const averageScore = studentsWithResults > 0 ? totalMarks / studentsWithResults : 0;
            
            stats.push({
                courseName,
                level,
                programName,
                totalStudents,
                passed,
                failed,
                noResults,
                passRate,
                averageScore,
                studentsWithResults,
                students: studentList
            });
        });
        
        return stats;
    }, [courseStudents, results]);

    // Get student detailed performance
    const getStudentDetailedPerformance = (studentId: string) => {
        const studentResults = results.filter(r => 
            String(r.studentId) === String(studentId) &&
            r.status === 'approved'
        );
        
        const courseResults = studentResults.map(r => ({
            courseName: r.courseName || 'Unknown',
            marks: r.marks,
            grade: r.grade,
            status: r.status,
        }));
        
        const passed = courseResults.filter(r => r.grade !== 'F').length;
        const failed = courseResults.filter(r => r.grade === 'F').length;
        const total = courseResults.length;
        const average = total > 0 ? courseResults.reduce((sum, r) => sum + (r.marks || 0), 0) / total : 0;
        
        return { courseResults, passed, failed, total, average };
    };

    // Get grade color
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-emerald-600 bg-emerald-50';
            case 'B': return 'text-blue-600 bg-blue-50';
            case 'C': return 'text-amber-600 bg-amber-50';
            case 'D': return 'text-orange-600 bg-orange-50';
            case 'F': return 'text-red-600 bg-red-50';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    // Download CSV
    const downloadReport = () => {
        let csv = 'Course,Level,Program,Total Students,Passed,Failed,Pass Rate,Average Score\n';
        
        coursePerformance.forEach(c => {
            csv += `${c.courseName},${c.level},${c.programName},${c.totalStudents},${c.passed},${c.failed},${c.passRate.toFixed(1)}%,${c.averageScore.toFixed(1)}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `instructor_performance_report.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setToast('Report downloaded');
    };

    // Toggle student expand
    const toggleExpand = (studentId: string) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    // Calculate overall stats
const overallStats = useMemo(() => {
    // Use Set to count unique students across all courses
    const uniqueStudents = new Set();
    let totalPassed = 0;
    let totalFailed = 0;
    let totalNoResults = 0;
    
    coursePerformance.forEach(c => {
        c.students.forEach((s: any) => {
            uniqueStudents.add(s.id);
        });
        totalPassed += c.passed;
        totalFailed += c.failed;
        totalNoResults += c.noResults;
    });
    
    const totalStudents = uniqueStudents.size;
    const overallPassRate = (totalPassed + totalFailed) > 0 ? (totalPassed / (totalPassed + totalFailed)) * 100 : 0;
    
    return { totalStudents, totalPassed, totalFailed, totalNoResults, overallPassRate };
}, [coursePerformance]);

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader 
                title="Performance Report" 
                subtitle="View performance of your assigned courses"
                action={
                    <Button onClick={downloadReport} disabled={coursePerformance.length === 0}>
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                        <Select 
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                        >
                            <option value="">All Courses</option>
                            {courseOptions.map(c => (
                                <option key={c.display} value={c.display}>
                                    {c.display}
                                </option>
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
                            {levelOptions.map(l => (
                                <option key={l} value={l}>Level {l}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Overall Statistics */}
            {coursePerformance.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <BookOpen className="w-4 h-4" />
                            Courses
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{coursePerformance.length}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Users className="w-4 h-4" />
                            Total Students
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{overallStats.totalStudents}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            Overall Pass Rate
                        </div>
                        <div className="text-2xl font-bold text-emerald-600">{overallStats.overallPassRate.toFixed(1)}%</div>
                        <div className="text-xs text-slate-500">{overallStats.totalPassed} passed, {overallStats.totalFailed} failed</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Award className="w-4 h-4 text-amber-600" />
                            Avg Score
                        </div>
                        <div className="text-2xl font-bold text-amber-600">
                            {coursePerformance.length > 0 
                                ? (coursePerformance.reduce((sum, c) => sum + c.averageScore, 0) / coursePerformance.length).toFixed(1)
                                : '0'}
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <Badge status="warning" />
                            No Results
                        </div>
                        <div className="text-2xl font-bold text-amber-600">{overallStats.totalNoResults}</div>
                    </div>
                </div>
            )}

            {/* Course Performance Table */}
            {coursePerformance.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Program</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Students</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Passed</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Failed</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">No Results</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Pass Rate</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Avg Score</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {coursePerformance.map((course, idx) => {
                                    const isExpanded = expandedStudent === `course-${idx}`;
                                    return (
                                        <React.Fragment key={`${course.courseName}-${course.level}`}>
                                            <tr className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">
                                                    <div>{course.courseName}</div>
                                                    <div className="text-xs text-slate-500">Level {course.level}</div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{course.programName}</td>
                                                <td className="px-4 py-3 text-center font-medium">{course.totalStudents}</td>
                                                <td className="px-4 py-3 text-center text-emerald-600 font-medium">{course.passed}</td>
                                                <td className="px-4 py-3 text-center text-red-600 font-medium">{course.failed}</td>
                                                <td className="px-4 py-3 text-center text-amber-600">{course.noResults}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge status={course.passRate >= 70 ? 'success' : course.passRate >= 50 ? 'warning' : 'error'}>
                                                        {course.passRate.toFixed(1)}%
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-amber-600">{course.averageScore.toFixed(1)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => toggleExpand(`course-${idx}`)}
                                                        className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                                    >
                                                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={9} className="px-4 py-3 bg-slate-50">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Students</h4>
                                                            <Table 
                                                                headers={['Student', 'Reg Number', 'Program', 'Level', 'Marks', 'Grade', 'Status']} 
                                                                rowCount={course.students.length}
                                                            >
                                                                {course.students.map((s: any) => {
                                                                    const studentResults = getStudentResults(s.id, course.courseName);
                                                                    const latestResult = studentResults[studentResults.length - 1];
                                                                    return (
                                                                        <tr key={s.id} className="hover:bg-white">
                                                                            <td className="px-4 py-2 text-sm">{s.name}</td>
                                                                            <td className="px-4 py-2 text-xs font-mono">{s.regNumber}</td>
                                                                            <td className="px-4 py-2 text-sm">{s.program || '—'}</td>
                                                                            <td className="px-4 py-2 text-sm">{s.level || '—'}</td>
                                                                            <td className="px-4 py-2 text-sm text-center font-medium">
                                                                                {latestResult?.marks ?? '—'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm text-center">
                                                                                {latestResult ? (
                                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(latestResult.grade)}`}>
                                                                                        {latestResult.grade}
                                                                                    </span>
                                                                                ) : '—'}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-sm">
                                                                                {latestResult ? (
                                                                                    <Badge status={latestResult.status === 'approved' ? 'success' : 'warning'}>
                                                                                        {latestResult.status === 'approved' ? 'Published' : 'Pending'}
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge status="default">No Result</Badge>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </Table>
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
                </div>
            ) : (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No performance data found for your assigned courses</p>
                    <p className="text-sm text-slate-400">Students must be registered and have results</p>
                </div>
            )}
        </div>
    );
};

export default InstructorPerformanceReport;