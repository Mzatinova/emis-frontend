import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Select, Badge, Table, Toast, Input } from '@/components/shared/UI';
import { BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface ResultHistoryProps {
    toast: string;
    setToast: (msg: string) => void;
}

const ResultHistory: React.FC<ResultHistoryProps> = ({ toast, setToast }) => {
    const { students, results, sessions, programsList } = useEMIS();
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
    const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
    
    // Search states
    const [sessionSearch, setSessionSearch] = useState('');
    const [programSearch, setProgramSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    
    // Pagination state for each level
    const [pageSize, setPageSize] = useState(50);
    const [currentPages, setCurrentPages] = useState<Record<string, number>>({});
    
    // Session pagination
    const [sessionPage, setSessionPage] = useState(1);
    const sessionPageSize = 20;

    // Get only published results
    const publishedResults = results.filter(r => r.status === 'approved');

    // Get sessions that have results
    const sessionsWithResults = useMemo(() => {
        const sessionIds = new Set(publishedResults.map(r => String(r.academic_session_id)).filter(Boolean));
        return sessions.filter(s => sessionIds.has(String(s.id)));
    }, [sessions, publishedResults]);

    // Filter sessions by search
    const filteredSessions = useMemo(() => {
        let filtered = sessionsWithResults;
        if (sessionSearch) {
            const searchLower = sessionSearch.toLowerCase();
            filtered = filtered.filter(s => 
                s.year.toLowerCase().includes(searchLower) ||
                (s.start_date && new Date(s.start_date).toLocaleDateString('en-GB').includes(searchLower)) ||
                (s.end_date && new Date(s.end_date).toLocaleDateString('en-GB').includes(searchLower))
            );
        }
        return filtered;
    }, [sessionsWithResults, sessionSearch]);

    const paginatedSessions = useMemo(() => {
        const start = (sessionPage - 1) * sessionPageSize;
        return filteredSessions.slice(start, start + sessionPageSize);
    }, [filteredSessions, sessionPage]);

    const totalSessionPages = Math.ceil(filteredSessions.length / sessionPageSize);

    // Get programs that have students with results in selected session
    const allProgramsWithResults = useMemo(() => {
        if (!selectedSessionId) return [];
        
        const programSet = new Set();
        const sessionResults = publishedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
        
        sessionResults.forEach(result => {
            const student = students.find(s => String(s.id) === String(result.studentId));
            if (student?.program) {
                programSet.add(student.program);
            }
        });
        
        return Array.from(programSet);
    }, [selectedSessionId, publishedResults, students]);

    // Filter programs by search
    const programsWithResults = useMemo(() => {
        if (!programSearch) return allProgramsWithResults;
        const searchLower = programSearch.toLowerCase();
        return allProgramsWithResults.filter(program => 
            (program as string).toLowerCase().includes(searchLower)
        );
    }, [allProgramsWithResults, programSearch]);

    // Get students for a specific program and level in the selected session
    const getStudentsForProgramLevel = (programName: string, level: string) => {
        let programStudents = students.filter(s => s.program === programName && s.level === level);
        
        // Filter by student search if provided
        if (studentSearch) {
            const searchLower = studentSearch.toLowerCase();
            programStudents = programStudents.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                s.regNumber.toLowerCase().includes(searchLower)
            );
        }
        
        const sessionResults = publishedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
        
        return programStudents.map(student => {
            const studentResults = sessionResults.filter(r => String(r.studentId) === String(student.id));
            const practical = studentResults.find(r => r.courseName === 'Practical');
            const occupation = studentResults.find(r => r.courseName === 'Occupation');
            const fundamentals = studentResults.find(r => r.courseName === 'Fundamentals');
            
            const allPassed = practical?.grade !== 'F' && occupation?.grade !== 'F' && fundamentals?.grade !== 'F';
            const hasResults = practical || occupation || fundamentals;
            
            return {
                student,
                practical,
                occupation,
                fundamentals,
                allPassed,
                hasResults
            };
        });
    };

    // Get levels for a program
    const getLevelsForProgram = (programName: string) => {
        let programStudents = students.filter(s => s.program === programName);
        
        // Filter by student search for level extraction
        if (studentSearch) {
            const searchLower = studentSearch.toLowerCase();
            programStudents = programStudents.filter(s => 
                s.name.toLowerCase().includes(searchLower) ||
                s.regNumber.toLowerCase().includes(searchLower)
            );
        }
        
        const levels = [...new Set(programStudents.map(s => s.level).filter(Boolean))];
        return levels.sort();
    };

    // Get stats for a program level
    const getLevelStats = (programName: string, level: string) => {
        const studentsData = getStudentsForProgramLevel(programName, level);
        const withResults = studentsData.filter(s => s.hasResults);
        const passed = withResults.filter(s => s.allPassed).length;
        const failed = withResults.filter(s => !s.allPassed).length;
        const noResults = studentsData.filter(s => !s.hasResults).length;
        const passRate = withResults.length > 0 ? (passed / withResults.length) * 100 : 0;
        
        return { passed, failed, noResults, passRate, total: studentsData.length };
    };

    // Get paginated students
    const getPaginatedStudents = (programName: string, level: string) => {
        const allStudents = getStudentsForProgramLevel(programName, level);
        const pageKey = `${programName}-${level}`;
        const currentPage = currentPages[pageKey] || 1;
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        
        return {
            students: allStudents.slice(start, end),
            total: allStudents.length,
            currentPage,
            totalPages: Math.ceil(allStudents.length / pageSize)
        };
    };

    const changePage = (programName: string, level: string, newPage: number) => {
        const pageKey = `${programName}-${level}`;
        const totalStudents = getStudentsForProgramLevel(programName, level).length;
        const totalPages = Math.ceil(totalStudents / pageSize);
        
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPages(prev => ({ ...prev, [pageKey]: newPage }));
        }
    };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader 
                title="Result History" 
                subtitle="View past results by session, program, and level"
            />

            {/* Search Bar - Session, Program, Student */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Session Search */}
                    <div>
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
                        {/* Session dropdown */}
                        <Select 
                            value={selectedSessionId}
                            onChange={e => {
                                setSelectedSessionId(e.target.value);
                                setExpandedProgram(null);
                                setExpandedLevel(null);
                                setCurrentPages({});
                            }}
                            className="w-full mt-2"
                        >
                            <option value="">-- Select a Session --</option>
                            {paginatedSessions.map(session => {
                                const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
                                const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
                                return (
                                    <option key={session.id} value={session.id}>
                                        {session.year} ({start} - {end})
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

                    {/* Program Search */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Search Program
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                placeholder="Type to search programs..."
                                value={programSearch}
                                onChange={e => setProgramSearch(e.target.value)}
                                className="pl-9"
                                disabled={!selectedSessionId}
                            />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {programsWithResults.length} program(s) found
                        </div>
                    </div>

                    {/* Student Search */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Search Student
                        </label>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <Input
                                placeholder="Search by name or reg number..."
                                value={studentSearch}
                                onChange={e => setStudentSearch(e.target.value)}
                                className="pl-9"
                                disabled={!selectedSessionId}
                            />
                        </div>
                        <div className="flex justify-end items-center gap-2 mt-1">
                            <label className="text-sm text-slate-600">Rows per page:</label>
                            <Select 
                                value={pageSize.toString()}
                                onChange={e => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPages({});
                                }}
                                className="w-20"
                            >
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="200">200</option>
                            </Select>
                        </div>
                    </div>
                </div>

                {sessionsWithResults.length === 0 && (
                    <p className="text-sm text-amber-600 mt-4">No published results found in any session</p>
                )}
            </div>

            {/* Programs Grid */}
            {selectedSessionId && (
                <div className="space-y-4">
                    {programsWithResults.map(program => {
                        const levels = getLevelsForProgram(program as string);
                        const isProgramExpanded = expandedProgram === program;
                        
                        // Check if this program has any matching students
                        let hasMatchingStudents = false;
                        for (const level of levels) {
                            if (getStudentsForProgramLevel(program as string, level).length > 0) {
                                hasMatchingStudents = true;
                                break;
                            }
                        }
                        
                        if (!hasMatchingStudents && studentSearch) return null;
                        
                        return (
                            <div key={program as string} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                {/* Program Header */}
                                <button
                                    onClick={() => setExpandedProgram(isProgramExpanded ? null : program as string)}
                                    className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex justify-between items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-slate-600" />
                                        <h3 className="font-semibold text-slate-900">{program as string}</h3>
                                        {studentSearch && (
                                            <Badge status="info">Filtered</Badge>
                                        )}
                                    </div>
                                    <span className="text-slate-400">{isProgramExpanded ? '▼' : '▶'}</span>
                                </button>

                                {/* Levels */}
                                {isProgramExpanded && (
                                    <div className="p-4 space-y-3">
                                        {levels.map(level => {
                                            const stats = getLevelStats(program as string, level);
                                            const isLevelExpanded = expandedLevel === level;
                                            const { students: paginatedStudents, total, currentPage, totalPages } = getPaginatedStudents(program as string, level);
                                            
                                            if (total === 0) return null;
                                            
                                            return (
                                                <div key={level} className="border border-slate-200 rounded-lg overflow-hidden">
                                                    {/* Level Header */}
                                                    <button
                                                        onClick={() => setExpandedLevel(isLevelExpanded ? null : level)}
                                                        className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex justify-between items-center"
                                                    >
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="font-medium text-slate-800">{level}</span>
                                                            <div className="flex gap-2 text-xs">
                                                                <span className="text-green-600"> Passed: {stats.passed}</span>
                                                                <span className="text-red-600"> Failed: {stats.failed}</span>
                                                                <span className="text-slate-400">No Results: {stats.noResults}</span>
                                                            </div>
                                                            <Badge status={stats.passRate >= 70 ? 'success' : stats.passRate >= 50 ? 'warning' : 'error'}>
                                                                {Math.round(stats.passRate)}% Pass Rate
                                                            </Badge>
                                                            <span className="text-xs text-slate-400">({total} students)</span>
                                                        </div>
                                                        <span className="text-slate-400 text-sm">{isLevelExpanded ? '▲' : '▼'}</span>
                                                    </button>

                                                    {/* Students Table */}
                                                    {isLevelExpanded && (
                                                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                                                            <Table 
                                                                headers={['Student Name', 'Reg Number', 'Practical', 'Occupation', 'Fundamentals', 'Status']}
                                                                rowCount={paginatedStudents.length}
                                                            >
                                                                {paginatedStudents.map(({ student, practical, occupation, fundamentals, allPassed, hasResults }) => (
                                                                    <tr key={student.id} className="hover:bg-white">
                                                                        <td className="px-4 py-3 text-sm">{student.name}</td>
                                                                        <td className="px-4 py-3 text-xs font-mono">{student.regNumber}</td>
                                                                        <td className="px-4 py-3 text-center text-sm">
                                                                            {practical ? `${practical.marks} (${practical.grade})` : '—'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-sm">
                                                                            {occupation ? `${occupation.marks} (${occupation.grade})` : '—'}
                                                                        </td>
                                                                        <td className="px-4 py-3 text-center text-sm">
                                                                            {fundamentals ? `${fundamentals.marks} (${fundamentals.grade})` : '—'}
                                                                        </td>
                                                                        <td className="px-4 py-3">
                                                                            {!hasResults ? (
                                                                                <Badge status="default">No Results</Badge>
                                                                            ) : allPassed ? (
                                                                                <Badge status="success">Passed</Badge>
                                                                            ) : (
                                                                                <Badge status="error">Failed</Badge>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </Table>
                                                            
                                                            {/* Pagination Controls */}
                                                            {totalPages > 1 && (
                                                                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
                                                                    <div className="text-sm text-slate-500">
                                                                        Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} of {total} students
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => changePage(program as string, level, currentPage - 1)}
                                                                            disabled={currentPage === 1}
                                                                            className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <ChevronLeft className="w-4 h-4" />
                                                                        </button>
                                                                        <span className="px-3 py-1 text-sm">
                                                                            Page {currentPage} of {totalPages}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => changePage(program as string, level, currentPage + 1)}
                                                                            disabled={currentPage === totalPages}
                                                                            className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            <ChevronRight className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {programsWithResults.length === 0 && programSearch && (
                        <div className="text-center py-8 text-slate-500">
                            No programs found matching "{programSearch}"
                        </div>
                    )}
                    
                    {programsWithResults.length === 0 && !programSearch && (
                        <div className="text-center py-8 text-slate-500">
                            No results found for this session
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResultHistory;

// import React, { useState, useMemo } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Select, Badge, Table, Toast } from '@/components/shared/UI';
// import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

// interface ResultHistoryProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const ResultHistory: React.FC<ResultHistoryProps> = ({ toast, setToast }) => {
//     const { students, results, sessions, programsList } = useEMIS();
//     const [selectedSessionId, setSelectedSessionId] = useState<string>('');
//     const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
//     const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
    
//     // Pagination state for each level
//     const [pageSize, setPageSize] = useState(50);
//     const [currentPages, setCurrentPages] = useState<Record<string, number>>({});

//     // Get only published results
//     const publishedResults = results.filter(r => r.status === 'approved');

//     // Get sessions that have results
//     const sessionsWithResults = useMemo(() => {
//         const sessionIds = new Set(publishedResults.map(r => String(r.academic_session_id)).filter(Boolean));
//         return sessions.filter(s => sessionIds.has(String(s.id)));
//     }, [sessions, publishedResults]);

//     // Get programs that have students with results in selected session
//     const programsWithResults = useMemo(() => {
//         if (!selectedSessionId) return [];
        
//         const programSet = new Set();
//         const sessionResults = publishedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
        
//         sessionResults.forEach(result => {
//             const student = students.find(s => String(s.id) === String(result.studentId));
//             if (student?.program) {
//                 programSet.add(student.program);
//             }
//         });
        
//         return Array.from(programSet);
//     }, [selectedSessionId, publishedResults, students]);

//     // Get students for a specific program and level in the selected session
//     const getStudentsForProgramLevel = (programName: string, level: string) => {
//         const programStudents = students.filter(s => s.program === programName && s.level === level);
//         const sessionResults = publishedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
        
//         return programStudents.map(student => {
//             const studentResults = sessionResults.filter(r => String(r.studentId) === String(student.id));
//             const practical = studentResults.find(r => r.courseName === 'Practical');
//             const occupation = studentResults.find(r => r.courseName === 'Occupation');
//             const fundamentals = studentResults.find(r => r.courseName === 'Fundamentals');
            
//             const allPassed = practical?.grade !== 'F' && occupation?.grade !== 'F' && fundamentals?.grade !== 'F';
//             const hasResults = practical || occupation || fundamentals;
            
//             return {
//                 student,
//                 practical,
//                 occupation,
//                 fundamentals,
//                 allPassed,
//                 hasResults
//             };
//         });
//     };

//     // Get levels for a program
//     const getLevelsForProgram = (programName: string) => {
//         const programStudents = students.filter(s => s.program === programName);
//         const levels = [...new Set(programStudents.map(s => s.level).filter(Boolean))];
//         return levels.sort();
//     };

//     // Get stats for a program level
//     const getLevelStats = (programName: string, level: string) => {
//         const studentsData = getStudentsForProgramLevel(programName, level);
//         const withResults = studentsData.filter(s => s.hasResults);
//         const passed = withResults.filter(s => s.allPassed).length;
//         const failed = withResults.filter(s => !s.allPassed).length;
//         const noResults = studentsData.filter(s => !s.hasResults).length;
//         const passRate = withResults.length > 0 ? (passed / withResults.length) * 100 : 0;
        
//         return { passed, failed, noResults, passRate, total: studentsData.length };
//     };

//     // Get paginated students
//     const getPaginatedStudents = (programName: string, level: string) => {
//         const allStudents = getStudentsForProgramLevel(programName, level);
//         const pageKey = `${programName}-${level}`;
//         const currentPage = currentPages[pageKey] || 1;
//         const start = (currentPage - 1) * pageSize;
//         const end = start + pageSize;
        
//         return {
//             students: allStudents.slice(start, end),
//             total: allStudents.length,
//             currentPage,
//             totalPages: Math.ceil(allStudents.length / pageSize)
//         };
//     };

//     const changePage = (programName: string, level: string, newPage: number) => {
//         const pageKey = `${programName}-${level}`;
//         const totalStudents = getStudentsForProgramLevel(programName, level).length;
//         const totalPages = Math.ceil(totalStudents / pageSize);
        
//         if (newPage >= 1 && newPage <= totalPages) {
//             setCurrentPages(prev => ({ ...prev, [pageKey]: newPage }));
//         }
//     };

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader 
//                 title="Result History" 
//                 subtitle="View past results by session, program, and level"
//             />

//             {/* Session Selector */}
//             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
//                 <div className="flex justify-between items-center">
//                     <label className="block text-sm font-medium text-slate-700 mb-2">
//                         Select Academic Session
//                     </label>
//                     <div className="flex items-center gap-2">
//                         <label className="text-sm text-slate-600">Show:</label>
//                         <Select 
//                             value={pageSize.toString()}
//                             onChange={e => {
//                                 setPageSize(Number(e.target.value));
//                                 setCurrentPages({});
//                             }}
//                             className="w-24"
//                         >
//                             <option value="20">20</option>
//                             <option value="50">50</option>
//                             <option value="100">100</option>
//                             <option value="200">200</option>
//                         </Select>
//                         <span className="text-sm text-slate-600">per page</span>
//                     </div>
//                 </div>
//                 <Select 
//                     value={selectedSessionId}
//                     onChange={e => {
//                         setSelectedSessionId(e.target.value);
//                         setExpandedProgram(null);
//                         setExpandedLevel(null);
//                         setCurrentPages({});
//                     }}
//                     className="max-w-md"
//                 >
//                     <option value="">-- Select a Session --</option>
//                     {sessionsWithResults.map(session => {
//                         const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
//                         const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
//                         return (
//                             <option key={session.id} value={session.id}>
//                                 {session.year} ({start} - {end})
//                             </option>
//                         );
//                     })}
//                 </Select>
//                 {sessionsWithResults.length === 0 && (
//                     <p className="text-sm text-amber-600 mt-2">No published results found in any session</p>
//                 )}
//             </div>

//             {/* Programs Grid */}
//             {selectedSessionId && (
//                 <div className="space-y-4">
//                     {programsWithResults.map(program => {
//                         const levels = getLevelsForProgram(program as string);
//                         const isProgramExpanded = expandedProgram === program;
                        
//                         return (
//                             <div key={program as string} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                                 {/* Program Header */}
//                                 <button
//                                     onClick={() => setExpandedProgram(isProgramExpanded ? null : program as string)}
//                                     className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex justify-between items-center"
//                                 >
//                                     <div className="flex items-center gap-3">
//                                         <BookOpen className="w-5 h-5 text-slate-600" />
//                                         <h3 className="font-semibold text-slate-900">{program as string}</h3>
//                                     </div>
//                                     <span className="text-slate-400">{isProgramExpanded ? '▼' : '▶'}</span>
//                                 </button>

//                                 {/* Levels */}
//                                 {isProgramExpanded && (
//                                     <div className="p-4 space-y-3">
//                                         {levels.map(level => {
//                                             const stats = getLevelStats(program as string, level);
//                                             const isLevelExpanded = expandedLevel === level;
//                                             const { students: paginatedStudents, total, currentPage, totalPages } = getPaginatedStudents(program as string, level);
                                            
//                                             return (
//                                                 <div key={level} className="border border-slate-200 rounded-lg overflow-hidden">
//                                                     {/* Level Header */}
//                                                     <button
//                                                         onClick={() => setExpandedLevel(isLevelExpanded ? null : level)}
//                                                         className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex justify-between items-center"
//                                                     >
//                                                         <div className="flex items-center gap-3">
//                                                             <span className="font-medium text-slate-800">Level {level}</span>
//                                                             <div className="flex gap-2 text-xs">
//                                                                 <span className="text-green-600">✓ {stats.passed}</span>
//                                                                 <span className="text-red-600">✗ {stats.failed}</span>
//                                                                 <span className="text-slate-400">No Results: {stats.noResults}</span>
//                                                             </div>
//                                                             <Badge status={stats.passRate >= 70 ? 'success' : stats.passRate >= 50 ? 'warning' : 'error'}>
//                                                                 {Math.round(stats.passRate)}% Pass Rate
//                                                             </Badge>
//                                                             <span className="text-xs text-slate-400">({total} students)</span>
//                                                         </div>
//                                                         <span className="text-slate-400 text-sm">{isLevelExpanded ? '▲' : '▼'}</span>
//                                                     </button>

//                                                     {/* Students Table */}
//                                                     {isLevelExpanded && (
//                                                         <div className="p-4 bg-slate-50 border-t border-slate-200">
//                                                             <Table 
//                                                                 headers={['Student Name', 'Reg Number', 'Practical', 'Occupation', 'Fundamentals', 'Status']}
//                                                                 rowCount={paginatedStudents.length}
//                                                             >
//                                                                 {paginatedStudents.map(({ student, practical, occupation, fundamentals, allPassed, hasResults }) => (
//                                                                     <tr key={student.id} className="hover:bg-white">
//                                                                         <td className="px-4 py-3 text-sm">{student.name}</td>
//                                                                         <td className="px-4 py-3 text-xs font-mono">{student.regNumber}</td>
//                                                                         <td className="px-4 py-3 text-center text-sm">
//                                                                             {practical ? `${practical.marks} (${practical.grade})` : '—'}
//                                                                         </td>
//                                                                         <td className="px-4 py-3 text-center text-sm">
//                                                                             {occupation ? `${occupation.marks} (${occupation.grade})` : '—'}
//                                                                         </td>
//                                                                         <td className="px-4 py-3 text-center text-sm">
//                                                                             {fundamentals ? `${fundamentals.marks} (${fundamentals.grade})` : '—'}
//                                                                         </td>
//                                                                         <td className="px-4 py-3">
//                                                                             {!hasResults ? (
//                                                                                 <Badge status="default">No Results</Badge>
//                                                                             ) : allPassed ? (
//                                                                                 <Badge status="success">Passed</Badge>
//                                                                             ) : (
//                                                                                 <Badge status="error">Failed</Badge>
//                                                                             )}
//                                                                         </td>
//                                                                     </tr>
//                                                                 ))}
//                                                             </Table>
                                                            
//                                                             {/* Pagination Controls */}
//                                                             {totalPages > 1 && (
//                                                                 <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
//                                                                     <div className="text-sm text-slate-500">
//                                                                         Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} of {total} students
//                                                                     </div>
//                                                                     <div className="flex gap-2">
//                                                                         <button
//                                                                             onClick={() => changePage(program as string, level, currentPage - 1)}
//                                                                             disabled={currentPage === 1}
//                                                                             className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                                                                         >
//                                                                             <ChevronLeft className="w-4 h-4" />
//                                                                         </button>
//                                                                         <span className="px-3 py-1 text-sm">
//                                                                             Page {currentPage} of {totalPages}
//                                                                         </span>
//                                                                         <button
//                                                                             onClick={() => changePage(program as string, level, currentPage + 1)}
//                                                                             disabled={currentPage === totalPages}
//                                                                             className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                                                                         >
//                                                                             <ChevronRight className="w-4 h-4" />
//                                                                         </button>
//                                                                     </div>
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             );
//                                         })}
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ResultHistory;

//import React, { useState, useMemo } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Select, Badge, Table, Toast, Input } from '@/components/shared/UI';
// import { BookOpen, ChevronLeft, ChevronRight, Search } from 'lucide-react';

// interface ResultHistoryProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const ResultHistory: React.FC<ResultHistoryProps> = ({ toast, setToast }) => {
//     const { students, results, sessions, programsList } = useEMIS();
//     const [selectedSessionId, setSelectedSessionId] = useState<string>('');
//     const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
//     const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
    
//     // Pagination state for each level
//     const [pageSize, setPageSize] = useState(50);
//     const [currentPages, setCurrentPages] = useState<Record<string, number>>({});
    
//     // Session search and pagination
//     const [sessionSearch, setSessionSearch] = useState('');
//     const [sessionPage, setSessionPage] = useState(1);
//     const sessionPageSize = 20;

//     // Get only published results
//     const publishedResults = results.filter(r => r.status === 'approved');

//     // Get sessions that have results
//     const sessionsWithResults = useMemo(() => {
//         const sessionIds = new Set(publishedResults.map(r => String(r.academic_session_id)).filter(Boolean));
//         return sessions.filter(s => sessionIds.has(String(s.id)));
//     }, [sessions, publishedResults]);

//     // Filter and paginate sessions
//     const filteredSessions = useMemo(() => {
//         let filtered = sessionsWithResults;
//         if (sessionSearch) {
//             const searchLower = sessionSearch.toLowerCase();
//             filtered = filtered.filter(s => 
//                 s.year.toLowerCase().includes(searchLower) ||
//                 (s.start_date && new Date(s.start_date).toLocaleDateString('en-GB').includes(searchLower)) ||
//                 (s.end_date && new Date(s.end_date).toLocaleDateString('en-GB').includes(searchLower))
//             );
//         }
//         return filtered;
//     }, [sessionsWithResults, sessionSearch]);

//     const paginatedSessions = useMemo(() => {
//         const start = (sessionPage - 1) * sessionPageSize;
//         return filteredSessions.slice(start, start + sessionPageSize);
//     }, [filteredSessions, sessionPage]);

//     const totalSessionPages = Math.ceil(filteredSessions.length / sessionPageSize);

//     // Get programs that have students with results in selected session
//     const programsWithResults = useMemo(() => {
//         if (!selectedSessionId) return [];
        
//         const programSet = new Set();
//         const sessionResults = publishedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
        
//         sessionResults.forEach(result => {
//             const student = students.find(s => String(s.id) === String(result.studentId));
//             if (student?.program) {
//                 programSet.add(student.program);
//             }
//         });
        
//         return Array.from(programSet);
//     }, [selectedSessionId, publishedResults, students]);

//     // Get students for a specific program and level in the selected session
//     const getStudentsForProgramLevel = (programName: string, level: string) => {
//         const programStudents = students.filter(s => s.program === programName && s.level === level);
//         const sessionResults = publishedResults.filter(r => String(r.academic_session_id) === selectedSessionId);
        
//         return programStudents.map(student => {
//             const studentResults = sessionResults.filter(r => String(r.studentId) === String(student.id));
//             const practical = studentResults.find(r => r.courseName === 'Practical');
//             const occupation = studentResults.find(r => r.courseName === 'Occupation');
//             const fundamentals = studentResults.find(r => r.courseName === 'Fundamentals');
            
//             const allPassed = practical?.grade !== 'F' && occupation?.grade !== 'F' && fundamentals?.grade !== 'F';
//             const hasResults = practical || occupation || fundamentals;
            
//             return {
//                 student,
//                 practical,
//                 occupation,
//                 fundamentals,
//                 allPassed,
//                 hasResults
//             };
//         });
//     };

//     // Get levels for a program
//     const getLevelsForProgram = (programName: string) => {
//         const programStudents = students.filter(s => s.program === programName);
//         const levels = [...new Set(programStudents.map(s => s.level).filter(Boolean))];
//         return levels.sort();
//     };

//     // Get stats for a program level
//     const getLevelStats = (programName: string, level: string) => {
//         const studentsData = getStudentsForProgramLevel(programName, level);
//         const withResults = studentsData.filter(s => s.hasResults);
//         const passed = withResults.filter(s => s.allPassed).length;
//         const failed = withResults.filter(s => !s.allPassed).length;
//         const noResults = studentsData.filter(s => !s.hasResults).length;
//         const passRate = withResults.length > 0 ? (passed / withResults.length) * 100 : 0;
        
//         return { passed, failed, noResults, passRate, total: studentsData.length };
//     };

//     // Get paginated students
//     const getPaginatedStudents = (programName: string, level: string) => {
//         const allStudents = getStudentsForProgramLevel(programName, level);
//         const pageKey = `${programName}-${level}`;
//         const currentPage = currentPages[pageKey] || 1;
//         const start = (currentPage - 1) * pageSize;
//         const end = start + pageSize;
        
//         return {
//             students: allStudents.slice(start, end),
//             total: allStudents.length,
//             currentPage,
//             totalPages: Math.ceil(allStudents.length / pageSize)
//         };
//     };

//     const changePage = (programName: string, level: string, newPage: number) => {
//         const pageKey = `${programName}-${level}`;
//         const totalStudents = getStudentsForProgramLevel(programName, level).length;
//         const totalPages = Math.ceil(totalStudents / pageSize);
        
//         if (newPage >= 1 && newPage <= totalPages) {
//             setCurrentPages(prev => ({ ...prev, [pageKey]: newPage }));
//         }
//     };

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader 
//                 title="Result History" 
//                 subtitle="View past results by session, program, and level"
//             />

//             {/* Session Selector with Search & Pagination */}
//             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
//                 <div className="flex justify-between items-center mb-3">
//                     <label className="block text-sm font-medium text-slate-700">
//                         Select Academic Session
//                     </label>
//                     <div className="flex items-center gap-2">
//                         <label className="text-sm text-slate-600">Students per page:</label>
//                         <Select 
//                             value={pageSize.toString()}
//                             onChange={e => {
//                                 setPageSize(Number(e.target.value));
//                                 setCurrentPages({});
//                             }}
//                             className="w-24"
//                         >
//                             <option value="20">20</option>
//                             <option value="50">50</option>
//                             <option value="100">100</option>
//                             <option value="200">200</option>
//                         </Select>
//                     </div>
//                 </div>

//                 {/* Search input */}
//                 <div className="relative mb-3">
//                     <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
//                     <Input
//                         placeholder="Search sessions by year or date..."
//                         value={sessionSearch}
//                         onChange={e => {
//                             setSessionSearch(e.target.value);
//                             setSessionPage(1);
//                         }}
//                         className="pl-9"
//                     />
//                 </div>

//                 {/* Session count info */}
//                 {filteredSessions.length > 0 && (
//                     <div className="text-sm text-slate-500 mb-2">
//                         Found {filteredSessions.length} session(s)
//                     </div>
//                 )}

//                 {/* Sessions dropdown */}
//                 <Select 
//                     value={selectedSessionId}
//                     onChange={e => {
//                         setSelectedSessionId(e.target.value);
//                         setExpandedProgram(null);
//                         setExpandedLevel(null);
//                         setCurrentPages({});
//                     }}
//                     className="w-full mb-3"
//                 >
//                     <option value="">-- Select a Session --</option>
//                     {paginatedSessions.map(session => {
//                         const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
//                         const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
//                         return (
//                             <option key={session.id} value={session.id}>
//                                 {session.year} ({start} - {end})
//                             </option>
//                         );
//                     })}
//                 </Select>

//                 {/* Session pagination controls */}
//                 {totalSessionPages > 1 && (
//                     <div className="flex justify-center gap-2 mt-3">
//                         <button
//                             onClick={() => setSessionPage(p => Math.max(1, p - 1))}
//                             disabled={sessionPage === 1}
//                             className="px-3 py-1 text-sm bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             <ChevronLeft className="w-4 h-4" />
//                         </button>
//                         <span className="px-3 py-1 text-sm">
//                             Page {sessionPage} of {totalSessionPages}
//                         </span>
//                         <button
//                             onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))}
//                             disabled={sessionPage === totalSessionPages}
//                             className="px-3 py-1 text-sm bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             <ChevronRight className="w-4 h-4" />
//                         </button>
//                     </div>
//                 )}

//                 {sessionsWithResults.length === 0 && (
//                     <p className="text-sm text-amber-600 mt-2">No published results found in any session</p>
//                 )}
//             </div>

//             {/* Programs Grid */}
//             {selectedSessionId && (
//                 <div className="space-y-4">
//                     {programsWithResults.map(program => {
//                         const levels = getLevelsForProgram(program as string);
//                         const isProgramExpanded = expandedProgram === program;
                        
//                         return (
//                             <div key={program as string} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                                 {/* Program Header */}
//                                 <button
//                                     onClick={() => setExpandedProgram(isProgramExpanded ? null : program as string)}
//                                     className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex justify-between items-center"
//                                 >
//                                     <div className="flex items-center gap-3">
//                                         <BookOpen className="w-5 h-5 text-slate-600" />
//                                         <h3 className="font-semibold text-slate-900">{program as string}</h3>
//                                     </div>
//                                     <span className="text-slate-400">{isProgramExpanded ? '▼' : '▶'}</span>
//                                 </button>

//                                 {/* Levels */}
//                                 {isProgramExpanded && (
//                                     <div className="p-4 space-y-3">
//                                         {levels.map(level => {
//                                             const stats = getLevelStats(program as string, level);
//                                             const isLevelExpanded = expandedLevel === level;
//                                             const { students: paginatedStudents, total, currentPage, totalPages } = getPaginatedStudents(program as string, level);
                                            
//                                             return (
//                                                 <div key={level} className="border border-slate-200 rounded-lg overflow-hidden">
//                                                     {/* Level Header */}
//                                                     <button
//                                                         onClick={() => setExpandedLevel(isLevelExpanded ? null : level)}
//                                                         className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex justify-between items-center"
//                                                     >
//                                                         <div className="flex items-center gap-3">
//                                                             <span className="font-medium text-slate-800">Level {level}</span>
//                                                             <div className="flex gap-2 text-xs">
//                                                                 <span className="text-green-600">✓ {stats.passed}</span>
//                                                                 <span className="text-red-600">✗ {stats.failed}</span>
//                                                                 <span className="text-slate-400">No Results: {stats.noResults}</span>
//                                                             </div>
//                                                             <Badge status={stats.passRate >= 70 ? 'success' : stats.passRate >= 50 ? 'warning' : 'error'}>
//                                                                 {Math.round(stats.passRate)}% Pass Rate
//                                                             </Badge>
//                                                             <span className="text-xs text-slate-400">({total} students)</span>
//                                                         </div>
//                                                         <span className="text-slate-400 text-sm">{isLevelExpanded ? '▲' : '▼'}</span>
//                                                     </button>

//                                                     {/* Students Table */}
//                                                     {isLevelExpanded && (
//                                                         <div className="p-4 bg-slate-50 border-t border-slate-200">
//                                                             <Table 
//                                                                 headers={['Student Name', 'Reg Number', 'Practical', 'Occupation', 'Fundamentals', 'Status']}
//                                                                 rowCount={paginatedStudents.length}
//                                                             >
//                                                                 {paginatedStudents.map(({ student, practical, occupation, fundamentals, allPassed, hasResults }) => (
//                                                                     <tr key={student.id} className="hover:bg-white">
//                                                                         <td className="px-4 py-3 text-sm">{student.name}</td>
//                                                                         <td className="px-4 py-3 text-xs font-mono">{student.regNumber}</td>
//                                                                         <td className="px-4 py-3 text-center text-sm">
//                                                                             {practical ? `${practical.marks} (${practical.grade})` : '—'}
//                                                                         </td>
//                                                                         <td className="px-4 py-3 text-center text-sm">
//                                                                             {occupation ? `${occupation.marks} (${occupation.grade})` : '—'}
//                                                                         </td>
//                                                                         <td className="px-4 py-3 text-center text-sm">
//                                                                             {fundamentals ? `${fundamentals.marks} (${fundamentals.grade})` : '—'}
//                                                                         </td>
//                                                                         <td className="px-4 py-3">
//                                                                             {!hasResults ? (
//                                                                                 <Badge status="default">No Results</Badge>
//                                                                             ) : allPassed ? (
//                                                                                 <Badge status="success">Passed</Badge>
//                                                                             ) : (
//                                                                                 <Badge status="error">Failed</Badge>
//                                                                             )}
//                                                                         </td>
//                                                                     </tr>
//                                                                 ))}
//                                                             </Table>
                                                            
//                                                             {/* Pagination Controls */}
//                                                             {totalPages > 1 && (
//                                                                 <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-200">
//                                                                     <div className="text-sm text-slate-500">
//                                                                         Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} of {total} students
//                                                                     </div>
//                                                                     <div className="flex gap-2">
//                                                                         <button
//                                                                             onClick={() => changePage(program as string, level, currentPage - 1)}
//                                                                             disabled={currentPage === 1}
//                                                                             className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                                                                         >
//                                                                             <ChevronLeft className="w-4 h-4" />
//                                                                         </button>
//                                                                         <span className="px-3 py-1 text-sm">
//                                                                             Page {currentPage} of {totalPages}
//                                                                         </span>
//                                                                         <button
//                                                                             onClick={() => changePage(program as string, level, currentPage + 1)}
//                                                                             disabled={currentPage === totalPages}
//                                                                             className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                                                                         >
//                                                                             <ChevronRight className="w-4 h-4" />
//                                                                         </button>
//                                                                     </div>
//                                                                 </div>
//                                                             )}
//                                                         </div>
//                                                     )}
//                                                 </div>
//                                             );
//                                         })}
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ResultHistory;
