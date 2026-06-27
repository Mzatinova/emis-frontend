import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Select, Badge, Table, Toast, Button, Input } from '@/components/shared/UI';
import { Search, Download, TrendingUp, TrendingDown, Award, User, ChevronDown, ChevronRight } from 'lucide-react';

interface StudentPerformanceReportProps {
    toast: string;
    setToast: (msg: string) => void;
}

const StudentPerformanceReport: React.FC<StudentPerformanceReportProps> = ({ toast, setToast }) => {
    const { students, results, sessions, repeatersList } = useEMIS();
    // const currentSession = sessions.find(s => s.active === true);
    // const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSession?.id || '');
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'average' | 'passed'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    // Get only approved results
    const approvedResults = results.filter(r => r.status === 'approved');

    // Get sessions with results
    const sessionsWithResults = useMemo(() => {
        const sessionIds = new Set(approvedResults.map(r => String(r.academic_session_id)).filter(Boolean));
        return sessions.filter(s => sessionIds.has(String(s.id)));
    }, [sessions, approvedResults]);

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

    // Filter results by session
    // Use all approved results (no session filter)
const sessionResults = approvedResults;
    // const sessionResults = useMemo(() => {
    //     if (!selectedSessionId) return approvedResults;
    //     return approvedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
    // }, [approvedResults, selectedSessionId]);

    // Further filter by program and level
    const filteredResults = useMemo(() => {
        let results = approvedResults;

        if (selectedProgram) {
            const studentIds = students.filter(s => s.program === selectedProgram).map(s => String(s.id));
            results = results.filter(r => studentIds.includes(String(r.studentId)));
        }

        if (selectedLevel) {
            const studentIds = students.filter(s => s.level === selectedLevel).map(s => String(s.id));
            results = results.filter(r => studentIds.includes(String(r.studentId)));
        }

        return results;
    }, [sessionResults, selectedProgram, selectedLevel, students]);

    // Build student performance data
    const studentPerformance = useMemo(() => {
        const studentMap: Record<string, any> = {};

        // Initialize all students with results
        filteredResults.forEach(r => {
            if (!studentMap[r.studentId]) {
                const student = students.find(s => String(s.id) === String(r.studentId));
                studentMap[r.studentId] = {
                    id: r.studentId,
                    name: student?.name || 'Unknown',
                    regNumber: student?.regNumber || 'N/A',
                    program: student?.program || 'N/A',
                    level: student?.level || 'N/A',
                    active: student?.active || false,
                    courses: [],
                    totalMarks: 0,
                    totalCourses: 0,
                    passed: 0,
                    failed: 0,
                   
                };
            }

            const studentData = studentMap[r.studentId];
            studentData.courses.push({
                id: r.id,
                courseName: r.courseName || 'Unknown',
                marks: r.marks,
                grade: r.grade,
                status: r.status,
                sessionId: r.academic_session_id,
            });

            if (r.marks !== null) {
                studentData.totalMarks += r.marks;
                studentData.totalCourses += 1;
                if (r.grade !== 'F') {
                    studentData.passed += 1;
                } else {
                    studentData.failed += 1;
                }
            
            }
        });

        // Calculate averages
        Object.values(studentMap).forEach((s: any) => {
            s.average = s.totalCourses > 0 ? s.totalMarks / s.totalCourses : 0;
         
            s.passRate = s.totalCourses > 0 ? (s.passed / s.totalCourses) * 100 : 0;
        });

        // Convert to array
        let result = Object.values(studentMap);

        // Apply search filter
        if (studentSearch) {
            const searchLower = studentSearch.toLowerCase();
            result = result.filter((s: any) =>
                s.name.toLowerCase().includes(searchLower) ||
                s.regNumber.toLowerCase().includes(searchLower)
            );
        }

        // Apply sorting
        result.sort((a: any, b: any) => {
            let compareA = a[sortBy];
            let compareB = b[sortBy];

            if (sortBy === 'name') {
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
            }

            if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [filteredResults, students, studentSearch, sortBy, sortOrder]);

    // Check if student is a repeater
    const isRepeater = (studentId: string) => {
        return repeatersList.some(r => String(r.student_id) === String(studentId));
    };

    // Get failed courses for a student
    const getFailedCourses = (studentId: string) => {
        const repeater = repeatersList.find(r => String(r.student_id) === String(studentId));
        return repeater?.failed_courses || [];
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

    // Get performance badge
    const getOverallStatus = (student: any) => {
        // Student passed if they have NO failed courses
        if (student.totalCourses === 0) {
            return <Badge status="default">No Results</Badge>;
        }
        if (student.failed === 0) {
            return <Badge status="success">Passed</Badge>;
        }
        return <Badge status="error">Failed</Badge>;
    };

    // Toggle student expand
    const toggleExpand = (studentId: string) => {
        setExpandedStudent(expandedStudent === studentId ? null : studentId);
    };

    // Download CSV
    const downloadReport = () => {
        // Calculate statistics
        const totalStudents = studentPerformance.length;
        const passedStudents = studentPerformance.filter((s: any) => s.failed === 0 && s.totalCourses > 0).length;
        const failedStudents = totalStudents - passedStudents;
        const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;

        // const selectedSession = sessions.find(s => String(s.id) === selectedSessionId);
        // const sessionYear = selectedSession?.year || 'All Sessions';

        let csv = `Report: Student Performance Report\n`;
        // csv += `Session: ${sessionYear}\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Total Students: ${totalStudents}\n`;
        csv += `Students Passed: ${passedStudents}\n`;
        csv += `Students Failed: ${failedStudents}\n`;
        csv += `Pass Rate: ${passRate.toFixed(1)}%\n`;
        csv += `\n`;
        csv += 'Student,Reg Number,Program,Level,Average,Passed,Failed,Pass Rate,Status\n';

        studentPerformance.forEach((s: any) => {
            csv += `${s.name},${s.regNumber},${s.program},${s.level},${s.average.toFixed(1)},${s.passed},${s.failed},${s.passRate.toFixed(1)}%,${s.active ? 'Active' : 'Inactive'}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // a.download = `student_performance_${selectedSessionId || 'all'}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setToast('Report downloaded');
    };

    // Sort handler
    const handleSort = (field: 'name' | 'average' | 'passed') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Get top performers (top 3)
    const topPerformers = useMemo(() => {
        return [...studentPerformance]
            .sort((a: any, b: any) => b.average - a.average)
            .slice(0, 3);
    }, [studentPerformance]);

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Student Performance Report"
                subtitle="Individual student grades, progress, and ranking"
                action={
                    <Button onClick={downloadReport} disabled={studentPerformance.length === 0}>
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
                        <Select
                            value={selectedSessionId}
                            onChange={e => setSelectedSessionId(e.target.value)}
                        >
                            <option value="">All Sessions</option>
                            {sessionsWithResults.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.year}
                                </option>
                            ))}
                        </Select>
                    </div> */}
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
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <Input
                                placeholder="Search student..."
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            {topPerformers.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {topPerformers.map((student: any, index: number) => (
                        <div key={student.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-amber-500' :
                                    index === 1 ? 'bg-slate-400' :
                                        'bg-amber-700'
                                    }`}>
                                    #{index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-900">{student.name}</div>
                                    <div className="text-xs text-slate-500">{student.program} - {student.level}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-emerald-600">{student.average.toFixed(1)}%</div>
                                    <div className="text-xs text-slate-500">Avg Score</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Student Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Program</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Level</th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:text-slate-800"
                                    onClick={() => handleSort('average')}
                                >
                                    Avg Score {sortBy === 'average' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase cursor-pointer hover:text-slate-800"
                                    onClick={() => handleSort('passed')}
                                >
                                    Passed {sortBy === 'passed' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Failed</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Pass Rate</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {studentPerformance.map((student: any) => {
                                const isExpanded = expandedStudent === student.id;
                                const failedCourses = getFailedCourses(student.id);
                                const isRepeaterStudent = isRepeater(student.id);

                                return (
                                    <React.Fragment key={student.id}>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900">{student.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{student.regNumber}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{student.program}</td>
                                            <td className="px-4 py-3 text-slate-600">{student.level}</td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                <span className={student.average >= 70 ? 'text-emerald-600' : student.average >= 50 ? 'text-amber-600' : 'text-red-600'}>
                                                    {student.average.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-emerald-600">{student.passed}</td>
                                            <td className="px-4 py-3 text-center text-red-600">{student.failed}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge status={student.passRate >= 70 ? 'success' : student.passRate >= 50 ? 'warning' : 'error'}>
                                                    {student.passRate.toFixed(1)}%
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    {getOverallStatus(student)}
                                                    {isRepeaterStudent && (
                                                        <Badge status="error">Repeater</Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleExpand(student.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                                                >
                                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={9} className="px-4 py-3 bg-slate-50">
                                                    <div className="space-y-3">
                                                        {/* Course Details */}
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Course Results</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                {student.courses.map((course: any, idx: number) => (
                                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200 flex justify-between items-center">
                                                                        <span className="text-sm">{course.courseName}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium">{course.marks ?? '—'}</span>
                                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeColor(course.grade)}`}>
                                                                                {course.grade || '—'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Failed Courses if repeater */}
                                                        {failedCourses.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-red-700 mb-2">Failed Courses (Repeater)</h4>
                                                                <div className="space-y-1">
                                                                    {failedCourses.map((course: any, idx: number) => (
                                                                        <div key={idx} className="bg-red-50 rounded-lg p-2 text-sm text-red-700 border border-red-200">
                                                                            {course.course_name} - Marks: {course.marks} (Required: {course.required_pass})
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Progress summary */}
                                                  
<div className="text-xs text-slate-500">
    Total Courses: {student.totalCourses} |
    Passed: {student.passed} |
    Failed: {student.failed} |
    Status: {student.active ? 'Active' : 'Inactive'}
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

                {studentPerformance.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        No student performance data found for the selected filters
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPerformanceReport;