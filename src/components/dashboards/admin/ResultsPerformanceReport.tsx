import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Select, Badge, Table, Toast, Button } from '@/components/shared/UI';
import { Download, TrendingUp, TrendingDown, Users, Award, BookOpen } from 'lucide-react';

interface ResultsPerformanceReportProps {
    toast: string;
    setToast: (msg: string) => void;
}

const ResultsPerformanceReport: React.FC<ResultsPerformanceReportProps> = ({ toast, setToast }) => {
    const { results, students, sessions, courses } = useEMIS();
  // Get current session
// const currentSession = sessions.find(s => s.active === true);
// const [selectedSessionId, setSelectedSessionId] = useState<string>(currentSession?.id || '');
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [viewType, setViewType] = useState<'program' | 'level' | 'overall'>('overall');

    // Get approved results only
    const approvedResults = results.filter(r => r.status === 'approved');

    // Get sessions with results
    const sessionsWithResults = useMemo(() => {
        const sessionIds = new Set(approvedResults.map(r => String(r.academic_session_id)).filter(Boolean));
        return sessions.filter(s => sessionIds.has(String(s.id)));
    }, [sessions, approvedResults]);

    // Get unique programs from students with results
    const programsWithResults = useMemo(() => {
        const programSet = new Set();
        const studentIds = new Set(approvedResults.map(r => String(r.studentId)));
        students.filter(s => studentIds.has(String(s.id))).forEach(s => {
            if (s.program) programSet.add(s.program);
        });
        return Array.from(programSet);
    }, [approvedResults, students]);

    // Get unique levels from students with results
    const levelsWithResults = useMemo(() => {
        const levelSet = new Set();
        const studentIds = new Set(approvedResults.map(r => String(r.studentId)));
        students.filter(s => studentIds.has(String(s.id))).forEach(s => {
            if (s.level) levelSet.add(s.level);
        });
        return Array.from(levelSet).sort();
    }, [approvedResults, students]);

    // Filter results by selected session
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

    // Calculate overall statistics
    const overallStats = useMemo(() => {
        // Count unique students
        const uniqueStudents = new Set(filteredResults.map(r => String(r.studentId)));
        const totalStudents = uniqueStudents.size;
        const totalResults = filteredResults.length;

        // Count course-level passes/fails
        const coursePassed = filteredResults.filter(r => r.grade !== 'F').length;
        const courseFailed = filteredResults.filter(r => r.grade === 'F').length;

        // Calculate how many students passed ALL their courses (same logic as ResultsManagement)
        const studentPassStatus: Record<string, boolean> = {};
        filteredResults.forEach(r => {
            const studentId = String(r.studentId);
            // If student has any 'F', they fail overall
            if (r.grade === 'F') {
                studentPassStatus[studentId] = false;
            } else if (!studentPassStatus.hasOwnProperty(studentId)) {
                studentPassStatus[studentId] = true;
            }
        });

        const passedCount = Object.values(studentPassStatus).filter(Boolean).length;
        const failedCount = Object.values(studentPassStatus).filter(v => v === false).length;

        // Pass rate based on students who passed ALL courses
        const passRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;

        // Grade distribution
        // Grade distribution - only count valid grades
        const gradeCounts: Record<string, number> = {};
        filteredResults.forEach(r => {
            // Only count if grade exists and is not null/undefined/empty
            if (r.grade && r.grade.trim() !== '') {
                gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
            }
        });

        return {
            totalStudents,
            totalResults,
            coursePassed,
            courseFailed,
            passedCount,
            failedCount,
            passRate,
            gradeCounts
        };
    }, [filteredResults]);

    // Calculate statistics by program
    const programStats = useMemo(() => {
        const stats: Record<string, any> = {};

        programsWithResults.forEach(program => {
            const programStudents = students.filter(s => s.program === program);
            const programStudentIds = programStudents.map(s => String(s.id));

            // Count students who passed ALL their courses
            let totalStudents = 0;
            let passedStudents = 0;

            programStudents.forEach(student => {
                const studentResults = filteredResults.filter(r => String(r.studentId) === String(student.id));
                if (studentResults.length > 0) {
                    totalStudents++;
                    const hasFail = studentResults.some(r => r.grade === 'F');
                    if (!hasFail) {
                        passedStudents++;
                    }
                }
            });

            const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
            const failedStudents = totalStudents - passedStudents;

            stats[program as string] = {
                total: totalStudents,
                passed: passedStudents,
                failed: failedStudents,
                passRate
            };
        });

        return stats;
    }, [filteredResults, programsWithResults, students]);

    // Calculate statistics by level
    const levelStats = useMemo(() => {
        const stats: Record<string, any> = {};

        levelsWithResults.forEach(level => {
            const levelStudents = students.filter(s => s.level === level);

            let totalStudents = 0;
            let passedStudents = 0;

            levelStudents.forEach(student => {
                const studentResults = filteredResults.filter(r => String(r.studentId) === String(student.id));
                if (studentResults.length > 0) {
                    totalStudents++;
                    const hasFail = studentResults.some(r => r.grade === 'F');
                    if (!hasFail) {
                        passedStudents++;
                    }
                }
            });

            const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
            const failedStudents = totalStudents - passedStudents;

            stats[level as string] = {
                total: totalStudents,
                passed: passedStudents,
                failed: failedStudents,
                passRate
            };
        });

        return stats;
    }, [filteredResults, levelsWithResults, students]);

    // Get grade color
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-emerald-600';
            case 'B': return 'text-blue-600';
            case 'C': return 'text-amber-600';
            case 'D': return 'text-orange-600';
            case 'F': return 'text-red-600';
            default: return 'text-slate-600';
        }
    };

    // Download report

    const downloadReport = () => {
    // Calculate statistics based on STUDENTS (not courses)
    const totalStudents = new Set(filteredResults.map(r => String(r.studentId))).size;
    const totalResults = filteredResults.length;
    
    // Count students who passed ALL courses
    const studentPassStatus: Record<string, boolean> = {};
    filteredResults.forEach(r => {
        const studentId = String(r.studentId);
        if (r.grade === 'F') {
            studentPassStatus[studentId] = false;
        } else if (!studentPassStatus.hasOwnProperty(studentId)) {
            studentPassStatus[studentId] = true;
        }
    });
    
    const passedCount = Object.values(studentPassStatus).filter(Boolean).length;
    const failedCount = Object.values(studentPassStatus).filter(v => v === false).length;
    
    // Pass rate based on STUDENTS
    const passRate = totalStudents > 0 ? (passedCount / totalStudents) * 100 : 0;
    
    // Get session info
  // Get session info - use current session if selectedSessionId is empty
// const selectedSession = sessions.find(s => String(s.id) === selectedSessionId) || sessions.find(s => s.active === true);
// const sessionYear = selectedSession?.year || 'All Sessions';
    
    // CSV content with statistics
    let csv = `Report: Results Performance Report\n`;
    // csv += `Session: ${sessionYear}\n`;
    csv += `Generated: ${new Date().toLocaleString()}\n`;
    csv += `Total Students: ${totalStudents}\n`;
    csv += `Total Results: ${totalResults}\n`;
    csv += `Students Passed: ${passedCount}\n`;
    csv += `Students Failed: ${failedCount}\n`;
    csv += `Pass Rate: ${passRate.toFixed(1)}%\n`;
    csv += `\n`; // Empty line before data
    
    // Group results by student
    const studentMap: Record<string, any> = {};
    
    filteredResults.forEach(r => {
        if (!studentMap[r.studentId]) {
            const student = students.find(s => String(s.id) === String(r.studentId));
            studentMap[r.studentId] = {
                name: student?.name || 'Unknown',
                program: student?.program || 'N/A',
                level: student?.level || 'N/A',
                courses: {},
                hasFail: false,
                hasResults: false,
            };
        }
        
        studentMap[r.studentId].courses[r.courseName || 'Unknown'] = {
            marks: r.marks ?? 'N/A',
            grade: r.grade || 'N/A',
        };
        
        if (r.grade === 'F') {
            studentMap[r.studentId].hasFail = true;
        }
        if (r.marks !== null && r.marks !== undefined) {
            studentMap[r.studentId].hasResults = true;
        }
    });

    // Add headers
    csv += 'Student,Program,Level,Practical,Occupation,Fundamentals,Overall Status\n';
    
    // Build CSV rows
    Object.values(studentMap).forEach((s: any) => {
        const practical = s.courses['Practical'] || { marks: 'N/A', grade: 'N/A' };
        const occupation = s.courses['Occupation'] || { marks: 'N/A', grade: 'N/A' };
        const fundamentals = s.courses['Fundamentals'] || { marks: 'N/A', grade: 'N/A' };
        const overallStatus = s.hasResults ? (s.hasFail ? 'Failed' : 'Passed') : 'No Results';
        
        csv += `"${s.name}","${s.program}","${s.level}","${practical.marks} (${practical.grade})","${occupation.marks} (${occupation.grade})","${fundamentals.marks} (${fundamentals.grade})","${overallStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // a.download = `performance_report_${selectedSessionId || 'all'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setToast('Report downloaded');
};
// const downloadReport = () => {
//     // CSV export - Group by student
//     let csv = 'Student,Program,Level,Practical,Occupation,Fundamentals,Overall Status\n';

//     // Group results by student
//     const studentMap: Record<string, any> = {};
    
//     filteredResults.forEach(r => {
//         if (!studentMap[r.studentId]) {
//             const student = students.find(s => String(s.id) === String(r.studentId));
//             studentMap[r.studentId] = {
//                 name: student?.name || 'Unknown',
//                 program: student?.program || 'N/A',
//                 level: student?.level || 'N/A',
//                 courses: {},
//                 hasFail: false,
//                 hasResults: false,
//             };
//         }
        
//         studentMap[r.studentId].courses[r.courseName || 'Unknown'] = {
//             marks: r.marks ?? 'N/A',
//             grade: r.grade || 'N/A',
//         };
        
//         if (r.grade === 'F') {
//             studentMap[r.studentId].hasFail = true;
//         }
//         if (r.marks !== null && r.marks !== undefined) {
//             studentMap[r.studentId].hasResults = true;
//         }
//     });

//     // Build CSV rows
//     Object.values(studentMap).forEach((s: any) => {
//         const practical = s.courses['Practical'] || { marks: 'N/A', grade: 'N/A' };
//         const occupation = s.courses['Occupation'] || { marks: 'N/A', grade: 'N/A' };
//         const fundamentals = s.courses['Fundamentals'] || { marks: 'N/A', grade: 'N/A' };
//         const overallStatus = s.hasResults ? (s.hasFail ? 'Failed' : 'Passed') : 'No Results';
        
//         csv += `${s.name},${s.program},${s.level},${practical.marks} (${practical.grade}),${occupation.marks} (${occupation.grade}),${fundamentals.marks} (${fundamentals.grade}),${overallStatus}\n`;
//     });

//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `performance_report_${selectedSessionId || 'all'}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//     setToast('Report downloaded');
// };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Results Performance Report"
                subtitle="Analyze student performance by program, level, and session"
                action={
                    <Button onClick={downloadReport} disabled={filteredResults.length === 0}>
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
                        <Select
                            value={selectedSessionId}
                            onChange={e => setSelectedSessionId(e.target.value)}
                        >
                            <option value="">All Sessions</option>
                            {sessionsWithResults.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.year} ({s.start_date ? new Date(s.start_date).toLocaleDateString() : '?'})
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
                            {programsWithResults.map(p => (
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
                            {levelsWithResults.map(l => (
                                <option key={l as string} value={l as string}>{l as string}</option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => setViewType('overall')}
                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewType === 'overall' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        Overall
                    </button>
                    <button
                        onClick={() => setViewType('program')}
                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewType === 'program' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        By Program
                    </button>
                    <button
                        onClick={() => setViewType('level')}
                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewType === 'level' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        By Level
                    </button>
                </div>
            </div>

            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Users className="w-4 h-4" />
                        Students
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{overallStats.totalStudents}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <BookOpen className="w-4 h-4" />
                        Total Results
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{overallStats.totalResults}</div>
                    <div className="text-xs text-slate-400">across all courses</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Pass Rate
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{overallStats.passRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500">{overallStats.passedCount} students passed, {overallStats.failedCount} failed</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Award className="w-4 h-4 text-amber-600" />
                        Top Grade
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                        {Object.entries(overallStats.gradeCounts).sort((a, b) => a[0].localeCompare(b[0]))[0]?.[1] || 0}
                        <span className="text-sm font-normal text-slate-500"> A's</span>
                    </div>
                </div>
            </div>

            {/* Grade Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Grade Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {['A', 'B', 'C', 'D', 'F'].map(grade => {
                        const count = overallStats.gradeCounts[grade] || 0;
                        const percentage = overallStats.totalResults > 0 ? (count / overallStats.totalResults) * 100 : 0;
                        return (
                            <div key={grade} className="bg-slate-50 rounded-lg p-3 text-center">
                                <div className={`text-xl font-bold ${getGradeColor(grade)}`}>{grade}</div>
                                <div className="text-sm text-slate-600">{count}</div>
                                <div className="text-xs text-slate-400">{percentage.toFixed(1)}%</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* View by Program or Level */}
            {viewType === 'program' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Performance by Program</h3>
                    <Table headers={['Program', 'Students', 'Passed', 'Failed', 'Pass Rate']} rowCount={Object.keys(programStats).length}>
                        {Object.entries(programStats).map(([program, stats]) => (
                            <tr key={program} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{program}</td>
                                <td className="px-4 py-3">{stats.total}</td>
                                <td className="px-4 py-3 text-emerald-600">{stats.passed}</td>
                                <td className="px-4 py-3 text-red-600">{stats.failed}</td>
                                <td className="px-4 py-3">
                                    <Badge status={stats.passRate >= 70 ? 'success' : stats.passRate >= 50 ? 'warning' : 'error'}>
                                        {stats.passRate.toFixed(1)}%
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {viewType === 'level' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Performance by Level</h3>
                    <Table headers={['Program', 'Students', 'Passed', 'Failed', 'Pass Rate']} rowCount={Object.keys(levelStats).length}>
                        {Object.entries(levelStats).map(([level, stats]) => (
                            <tr key={level} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{level}</td>
                                <td className="px-4 py-3">{stats.total}</td>
                                <td className="px-4 py-3 text-emerald-600">{stats.passed}</td>
                                <td className="px-4 py-3 text-red-600">{stats.failed}</td>
                                <td className="px-4 py-3">
                                    <Badge status={stats.passRate >= 70 ? 'success' : stats.passRate >= 50 ? 'warning' : 'error'}>
                                        {stats.passRate.toFixed(1)}%
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Detailed Results Table */}
            {/* Detailed Results Table - Group by Student */}
            {viewType === 'overall' && filteredResults.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Student Performance Summary</h3>

                    {/* Group results by student */}
                    {(() => {
                        const studentMap: Record<string, any> = {};

                        filteredResults.forEach(r => {
                            if (!studentMap[r.studentId]) {
                                const student = students.find(s => String(s.id) === String(r.studentId));
                                studentMap[r.studentId] = {
                                    studentId: r.studentId,
                                    name: student?.name || 'Unknown',
                                    program: student?.program || '—',
                                    level: student?.level || '—',
                                    courses: [],
                                    totalMarks: 0,
                                    passed: 0,
                                    failed: 0,
                                };
                            }

                            studentMap[r.studentId].courses.push({
                                courseName: r.courseName || '—',
                                marks: r.marks,
                                grade: r.grade,
                                status: r.status,
                            });

                            if (r.marks !== null && r.marks !== undefined) {
                                studentMap[r.studentId].totalMarks += r.marks;
                                if (r.grade !== 'F') {
                                    studentMap[r.studentId].passed += 1;
                                } else {
                                    studentMap[r.studentId].failed += 1;
                                }
                            }
                        });

                        const groupedStudents = Object.values(studentMap);
                        const displayStudents = groupedStudents.slice(0, 20);

                        return (
                            <Table
                                headers={['Student', 'Program', 'Level', 'Courses Passed/Failed', 'Avg Score', 'Status']}
                                rowCount={displayStudents.length}
                            >
                                {displayStudents.map((s: any) => {
                                    const total = s.passed + s.failed;
                                    const avg = total > 0 ? s.totalMarks / total : 0;
                                    const overallPass = s.failed === 0 && total > 0;

                                    return (
                                        <tr key={s.studentId} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                                            <td className="px-4 py-3 text-sm">{s.program}</td>
                                            <td className="px-4 py-3 text-sm">{s.level}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="text-emerald-600 font-medium">{s.passed}</span>
                                                <span className="text-slate-400"> / </span>
                                                <span className="text-red-600 font-medium">{s.failed}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-amber-600">
                                                {total > 0 ? avg.toFixed(1) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge status={overallPass ? 'success' : 'error'}>
                                                    {overallPass ? 'Passed' : 'Failed'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </Table>
                        );
                    })()}

                    {filteredResults.length > 20 && (
                        <p className="text-sm text-slate-500 mt-2">Showing 20 of {new Set(filteredResults.map(r => r.studentId)).size} students</p>
                    )}
                </div>
            )}

            {filteredResults.length === 0 && (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500">No results found for the selected filters</p>
                </div>
            )}
        </div>
    );
};

export default ResultsPerformanceReport;