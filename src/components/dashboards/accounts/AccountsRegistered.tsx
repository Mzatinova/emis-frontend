import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Table, Badge, Button, Input, Select } from '@/components/shared/UI';
import { Search, History, ChevronLeft, ChevronRight } from 'lucide-react';

const AccountsRegistered: React.FC<{ initialFilter?: 'all' | 'approved' | 'pending' }> = ({ initialFilter = 'all' }) => {
    const { students, sessions } = useEMIS();
    const { invoices } = useRegistration();
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>(initialFilter);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [studentSearch, setStudentSearch] = useState('');
    const pageSize = 20;

    // Session search and pagination for history
    const [sessionSearch, setSessionSearch] = useState('');
    const [sessionPage, setSessionPage] = useState(1);
    const sessionPageSize = 20;
    const [selectedHistorySessionId, setSelectedHistorySessionId] = useState<string>('');

    const currentSession = sessions.find(s => s.active === true);

    // Filter invoices by current session
    const currentSessionInvoices = useMemo(() => {
        if (!currentSession) return [];
        return invoices.filter(inv => String(inv.academic_session_id) === String(currentSession.id));
    }, [invoices, currentSession]);

    // Get all history sessions (previous sessions)
    const historySessions = useMemo(() => {
        if (!currentSession) return sessions;
        return sessions.filter(s => String(s.id) !== String(currentSession.id));
    }, [sessions, currentSession]);

    // Filter sessions by search
    const filteredHistorySessions = useMemo(() => {
        let filtered = historySessions;
        if (sessionSearch) {
            const searchLower = sessionSearch.toLowerCase();
            filtered = filtered.filter(s => 
                s.year.toLowerCase().includes(searchLower) ||
                (s.start_date && new Date(s.start_date).toLocaleDateString('en-GB').includes(searchLower)) ||
                (s.end_date && new Date(s.end_date).toLocaleDateString('en-GB').includes(searchLower))
            );
        }
        return filtered;
    }, [historySessions, sessionSearch]);

    const paginatedSessions = useMemo(() => {
        const start = (sessionPage - 1) * sessionPageSize;
        return filteredHistorySessions.slice(start, start + sessionPageSize);
    }, [filteredHistorySessions, sessionPage]);

    const totalSessionPages = Math.ceil(filteredHistorySessions.length / sessionPageSize);

    // Get invoices for selected history session
    const selectedSessionInvoices = useMemo(() => {
        if (!selectedHistorySessionId) return [];
        return invoices.filter(inv => String(inv.academic_session_id) === selectedHistorySessionId);
    }, [invoices, selectedHistorySessionId]);

    // Apply student search to selected session invoices
    const filteredSelectedSessionInvoices = useMemo(() => {
        if (!studentSearch) return selectedSessionInvoices;
        const term = studentSearch.toLowerCase();
        return selectedSessionInvoices.filter(inv => {
            const student = students.find(s => String(s.id) === String(inv.studentId));
            const studentName = student?.name?.toLowerCase() || '';
            return studentName.includes(term) || inv.studentReg?.toLowerCase().includes(term);
        });
    }, [selectedSessionInvoices, studentSearch, students]);

    // Pagination for selected session invoices
    const paginatedInvoices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSelectedSessionInvoices.slice(start, start + pageSize);
    }, [filteredSelectedSessionInvoices, currentPage]);

    const totalInvoicePages = Math.ceil(filteredSelectedSessionInvoices.length / pageSize);

    const getDisplayInvoices = () => {
        if (activeTab === 'current') {
            let filtered = currentSessionInvoices;
            
            if (filter === 'approved') {
                filtered = filtered.filter(inv => inv.status === 'approved');
            } else if (filter === 'pending') {
                filtered = filtered.filter(inv => inv.status === 'pending' || inv.status === 'paid');
            }
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filtered = filtered.filter(inv => {
                    const student = students.find(s => String(s.id) === String(inv.studentId));
                    const studentName = student?.name?.toLowerCase() || '';
                    return studentName.includes(term) || inv.studentReg?.toLowerCase().includes(term);
                });
            }
            
            const start = (currentPage - 1) * pageSize;
            const paginated = filtered.slice(start, start + pageSize);
            return { data: paginated, total: filtered.length };
        }
        
        return { data: paginatedInvoices, total: filteredSelectedSessionInvoices.length };
    };

    const displayData = getDisplayInvoices();
    const totalPages = Math.ceil(displayData.total / pageSize);

    const getStudentName = (studentId: string) => {
        const student = students.find(s => String(s.id) === String(studentId));
        return student?.name || 'Unknown';
    };

    const counts = {
        all: currentSessionInvoices.length,
        approved: currentSessionInvoices.filter(i => i.status === 'approved').length,
        pending: currentSessionInvoices.filter(i => i.status === 'pending' || i.status === 'paid').length
    };

    const selectedSession = sessions.find(s => String(s.id) === selectedHistorySessionId);

    return (
        <div>
            <PageHeader 
                title="Student Registrations" 
                subtitle={activeTab === 'current' ? `Current Session: ${currentSession?.year || 'No active session'}` : "Previous Sessions History"} 
            />

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 mb-4">
                <button
                    onClick={() => {
                        setActiveTab('current');
                        setCurrentPage(1);
                        setSearchTerm('');
                    }}
                    className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'current'
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Current Session {currentSession ? `(${currentSession.year})` : ''}
                </button>
                <button
                    onClick={() => {
                        setActiveTab('history');
                        setCurrentPage(1);
                        setSelectedHistorySessionId('');
                        setStudentSearch('');
                    }}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'history'
                        ? 'border-b-2 border-emerald-600 text-emerald-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <History className="w-4 h-4" />
                    History
                </button>
            </div>

            {/* Current Session View */}
            {activeTab === 'current' && (
                <>
                    <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
                        <div className="flex gap-2">
                            <Button 
                                variant={filter === 'all' ? 'primary' : 'secondary'}
                                onClick={() => {
                                    setFilter('all');
                                    setCurrentPage(1);
                                }}
                            >
                                All ({counts.all})
                            </Button>
                            <Button 
                                variant={filter === 'approved' ? 'primary' : 'secondary'}
                                onClick={() => {
                                    setFilter('approved');
                                    setCurrentPage(1);
                                }}
                            >
                                Approved ({counts.approved})
                            </Button>
                            <Button 
                                variant={filter === 'pending' ? 'primary' : 'secondary'}
                                onClick={() => {
                                    setFilter('pending');
                                    setCurrentPage(1);
                                }}
                            >
                                Pending ({counts.pending})
                            </Button>
                        </div>
                        
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                type="text"
                                placeholder="Search by name or reg number..."
                                className="pl-9 w-64"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Date']} rowCount={(displayData.data as any[]).length}>
                            {(displayData.data as any[]).map(inv => {
                                const student = students.find(s => String(s.id) === String(inv.studentId));
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
                                        <td className="px-4 py-3">{inv.programName}</td>
                                        <td className="px-4 py-3 text-center">Level {inv.level}</td>
                                        <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <Badge status={inv.status === 'approved' ? 'success' : 'warning'}>
                                                {inv.status === 'approved' ? 'Approved' : inv.status === 'paid' ? 'Pending Review' : 'Pending'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </Table>
                        
                        {totalPages > 1 && (
                            <div className="flex justify-between items-center p-4 border-t border-slate-200">
                                <div className="text-sm text-slate-500">
                                    Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, displayData.total)} of {displayData.total}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* History View - Session Dropdown Pattern */}
            {activeTab === 'history' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                    {/* Session Search */}
                    <div className="mb-4">
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
                        
                        {/* Session Dropdown */}
                        <Select 
                            value={selectedHistorySessionId}
                            onChange={e => {
                                setSelectedHistorySessionId(e.target.value);
                                setCurrentPage(1);
                                setStudentSearch('');
                            }}
                            className="w-full mt-2"
                        >
                            <option value="">-- Select a Session --</option>
                            {paginatedSessions.map(session => {
                                const start = session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '?';
                                const end = session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '?';
                                const invoiceCount = invoices.filter(inv => String(inv.academic_session_id) === String(session.id)).length;
                                return (
                                    <option key={session.id} value={session.id}>
                                        {session.year} ({start} - {end}) - {invoiceCount} registrations
                                    </option>
                                );
                            })}
                        </Select>
                        
                        {/* Session Pagination */}
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

                    {/* Student Search for selected session */}
                    {selectedHistorySessionId && (
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                <Input 
                                    type="text"
                                    placeholder="Search students by name or reg number..."
                                    className="pl-9"
                                    value={studentSearch}
                                    onChange={(e) => {
                                        setStudentSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Results */}
                    {!selectedHistorySessionId && (
                        <div className="text-center py-8 text-slate-500">
                            Select a session to view registrations
                        </div>
                    )}

                    {selectedHistorySessionId && filteredSelectedSessionInvoices.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            No registrations found for {selectedSession?.year}
                            {studentSearch && ` matching "${studentSearch}"`}
                        </div>
                    )}

                    {selectedHistorySessionId && filteredSelectedSessionInvoices.length > 0 && (
                        <div>
                            <div className="mb-3 text-sm text-slate-600">
                                Showing {filteredSelectedSessionInvoices.length} registration(s) for {selectedSession?.year}
                                {studentSearch && ` matching "${studentSearch}"`}
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Date']} rowCount={paginatedInvoices.length}>
                                    {paginatedInvoices.map(inv => {
                                        const student = students.find(s => String(s.id) === String(inv.studentId));
                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
                                                <td className="px-4 py-3">{inv.programName}</td>
                                                <td className="px-4 py-3 text-center">Level {inv.level}</td>
                                                <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <Badge status={inv.status === 'approved' ? 'success' : 'warning'}>
                                                        {inv.status === 'approved' ? 'Approved' : inv.status === 'paid' ? 'Pending Review' : 'Pending'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                </Table>
                                
                                {/* Pagination for invoices */}
                                {totalInvoicePages > 1 && (
                                    <div className="flex justify-between items-center p-4 border-t border-slate-200">
                                        <div className="text-sm text-slate-500">
                                            Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredSelectedSessionInvoices.length)} of {filteredSelectedSessionInvoices.length}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 py-1 text-sm">Page {currentPage} of {totalInvoicePages}</span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalInvoicePages, p + 1))}
                                                disabled={currentPage === totalInvoicePages}
                                                className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountsRegistered;

// import React, { useState, useMemo } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Table, Badge, Button, Input } from '@/components/shared/UI';
// import { Search, History, ChevronLeft, ChevronRight } from 'lucide-react';

// const AccountsRegistered: React.FC<{ initialFilter?: 'all' | 'approved' | 'pending' }> = ({ initialFilter = 'all' }) => {
//     const { students, sessions } = useEMIS();
//     const { invoices } = useRegistration();
//     const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>(initialFilter);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    
//     // Pagination
//     const [currentPage, setCurrentPage] = useState(1);
//     const [historySearchTerm, setHistorySearchTerm] = useState('');
//     const [expandedSession, setExpandedSession] = useState<string | null>(null);
//     const pageSize = 20;

//     const currentSession = sessions.find(s => s.active === true);

//     // Filter invoices by current session
//     const currentSessionInvoices = useMemo(() => {
//         if (!currentSession) return [];
//         return invoices.filter(inv => String(inv.academic_session_id) === String(currentSession.id));
//     }, [invoices, currentSession]);

//     // Group history invoices by session
//     const historyInvoicesBySession = useMemo(() => {
//         if (!currentSession) {
//             // Group all invoices by session
//             const grouped: { [key: string]: any[] } = {};
//             invoices.forEach(inv => {
//                 const sessionId = String(inv.academic_session_id);
//                 if (!grouped[sessionId]) grouped[sessionId] = [];
//                 grouped[sessionId].push(inv);
//             });
//             return grouped;
//         }
        
//         const grouped: { [key: string]: any[] } = {};
//         const historyInv = invoices.filter(inv => String(inv.academic_session_id) !== String(currentSession.id));
        
//         historyInv.forEach(inv => {
//             const sessionId = String(inv.academic_session_id);
//             if (!grouped[sessionId]) grouped[sessionId] = [];
//             grouped[sessionId].push(inv);
//         });
        
//         return grouped;
//     }, [invoices, currentSession]);

//     // Apply search to history
//     const filteredHistorySessions = useMemo(() => {
//         if (!historySearchTerm) return historyInvoicesBySession;
        
//         const term = historySearchTerm.toLowerCase();
//         const filtered: { [key: string]: any[] } = {};
        
//         Object.entries(historyInvoicesBySession).forEach(([sessionId, sessionInvoices]) => {
//             const matchedInvoices = sessionInvoices.filter(inv => {
//                 const student = students.find(s => String(s.id) === String(inv.studentId));
//                 const studentName = student?.name?.toLowerCase() || '';
//                 return studentName.includes(term) || inv.studentReg?.toLowerCase().includes(term);
//             });
            
//             if (matchedInvoices.length > 0) {
//                 filtered[sessionId] = matchedInvoices;
//             }
//         });
        
//         return filtered;
//     }, [historyInvoicesBySession, historySearchTerm, students]);

//     const getDisplayInvoices = () => {
//         if (activeTab === 'current') {
//             let filtered = currentSessionInvoices;
            
//             if (filter === 'approved') {
//                 filtered = filtered.filter(inv => inv.status === 'approved');
//             } else if (filter === 'pending') {
//                 filtered = filtered.filter(inv => inv.status === 'pending' || inv.status === 'paid');
//             }
            
//             if (searchTerm) {
//                 const term = searchTerm.toLowerCase();
//                 filtered = filtered.filter(inv => {
//                     const student = students.find(s => String(s.id) === String(inv.studentId));
//                     const studentName = student?.name?.toLowerCase() || '';
//                     return studentName.includes(term) || inv.studentReg?.toLowerCase().includes(term);
//                 });
//             }
            
//             // Pagination for current session
//             const start = (currentPage - 1) * pageSize;
//             const paginated = filtered.slice(start, start + pageSize);
//             return { data: paginated, total: filtered.length };
//         }
        
//         // For history, return sessions grouped
//         return { data: filteredHistorySessions, total: Object.keys(filteredHistorySessions).length };
//     };

//     const displayData = getDisplayInvoices();
//     const totalPages = Math.ceil(displayData.total / pageSize);

//     const getStudentName = (studentId: string) => {
//         const student = students.find(s => String(s.id) === String(studentId));
//         return student?.name || 'Unknown';
//     };

//     const counts = {
//         all: currentSessionInvoices.length,
//         approved: currentSessionInvoices.filter(i => i.status === 'approved').length,
//         pending: currentSessionInvoices.filter(i => i.status === 'pending' || i.status === 'paid').length
//     };

//     const historyCounts = {
//         all: invoices.filter(i => !currentSession || String(i.academic_session_id) !== String(currentSession.id)).length
//     };

//     return (
//         <div>
//             <PageHeader 
//                 title="Student Registrations" 
//                 subtitle={activeTab === 'current' ? `Current Session: ${currentSession?.year || 'No active session'}` : "Previous Sessions History"} 
//             />

//             {/* Tabs */}
//             <div className="flex gap-2 border-b border-slate-200 mb-4">
//                 <button
//                     onClick={() => {
//                         setActiveTab('current');
//                         setCurrentPage(1);
//                     }}
//                     className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'current'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                     }`}
//                 >
//                     Current Session {currentSession ? `(${currentSession.year})` : ''}
//                 </button>
//                 <button
//                     onClick={() => {
//                         setActiveTab('history');
//                         setExpandedSession(null);
//                     }}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'history'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                     }`}
//                 >
//                     <History className="w-4 h-4" />
//                     History ({historyCounts.all})
//                 </button>
//             </div>

//             {/* Current Session View */}
//             {activeTab === 'current' && (
//                 <>
//                     <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
//                         <div className="flex gap-2">
//                             <Button 
//                                 variant={filter === 'all' ? 'primary' : 'secondary'}
//                                 onClick={() => {
//                                     setFilter('all');
//                                     setCurrentPage(1);
//                                 }}
//                             >
//                                 All ({counts.all})
//                             </Button>
//                             <Button 
//                                 variant={filter === 'approved' ? 'primary' : 'secondary'}
//                                 onClick={() => {
//                                     setFilter('approved');
//                                     setCurrentPage(1);
//                                 }}
//                             >
//                                 Approved ({counts.approved})
//                             </Button>
//                             <Button 
//                                 variant={filter === 'pending' ? 'primary' : 'secondary'}
//                                 onClick={() => {
//                                     setFilter('pending');
//                                     setCurrentPage(1);
//                                 }}
//                             >
//                                 Pending ({counts.pending})
//                             </Button>
//                         </div>
                        
//                         <div className="relative">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                             <Input 
//                                 type="text"
//                                 placeholder="Search by name or reg number..."
//                                 className="pl-9 w-64"
//                                 value={searchTerm}
//                                 onChange={(e) => {
//                                     setSearchTerm(e.target.value);
//                                     setCurrentPage(1);
//                                 }}
//                             />
//                         </div>
//                     </div>

//                     <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                         <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Date']} rowCount={(displayData.data as any[]).length}>
//                             {(displayData.data as any[]).map(inv => {
//                                 const student = students.find(s => String(s.id) === String(inv.studentId));
//                                 return (
//                                     <tr key={inv.id} className="hover:bg-slate-50">
//                                         <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
//                                         <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
//                                         <td className="px-4 py-3">{inv.programName}</td>
//                                         <td className="px-4 py-3 text-center">Level {inv.level}</td>
//                                         <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
//                                         <td className="px-4 py-3">
//                                             <Badge status={inv.status === 'approved' ? 'success' : 'warning'}>
//                                                 {inv.status === 'approved' ? 'Approved' : inv.status === 'paid' ? 'Pending Review' : 'Pending'}
//                                             </Badge>
//                                         </td>
//                                         <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
//                                     </tr>
//                                 );
//                             })}
//                         </Table>
                        
//                         {/* Pagination */}
//                         {totalPages > 1 && (
//                             <div className="flex justify-between items-center p-4 border-t border-slate-200">
//                                 <div className="text-sm text-slate-500">
//                                     Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, displayData.total)} of {displayData.total}
//                                 </div>
//                                 <div className="flex gap-2">
//                                     <button
//                                         onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//                                         disabled={currentPage === 1}
//                                         className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
//                                     >
//                                         <ChevronLeft className="w-4 h-4" />
//                                     </button>
//                                     <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
//                                     <button
//                                         onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
//                                         disabled={currentPage === totalPages}
//                                         className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
//                                     >
//                                         <ChevronRight className="w-4 h-4" />
//                                     </button>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </>
//             )}

//             {/* History View - Grouped by Session */}
//             {activeTab === 'history' && (
//                 <>
//                     {/* Search for history */}
//                     <div className="mb-4">
//                         <div className="relative max-w-md">
//                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                             <Input 
//                                 type="text"
//                                 placeholder="Search history by student name or reg number..."
//                                 className="pl-9"
//                                 value={historySearchTerm}
//                                 onChange={(e) => setHistorySearchTerm(e.target.value)}
//                             />
//                         </div>
//                     </div>

//                     {Object.keys(displayData.data).length === 0 && (
//                         <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
//                             No previous session registrations found
//                         </div>
//                     )}

//                     {/* Sessions grouped */}
//                     {Object.entries(displayData.data as { [key: string]: any[] }).map(([sessionId, sessionInvoices]) => {
//                         const session = sessions.find(s => String(s.id) === sessionId);
//                         const isExpanded = expandedSession === sessionId;
//                         const sessionCounts = {
//                             all: sessionInvoices.length,
//                             approved: sessionInvoices.filter(i => i.status === 'approved').length,
//                             pending: sessionInvoices.filter(i => i.status === 'pending' || i.status === 'paid').length
//                         };
                        
//                         return (
//                             <div key={sessionId} className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
//                                 {/* Session Header */}
//                                 <button
//                                     onClick={() => setExpandedSession(isExpanded ? null : sessionId)}
//                                     className="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex justify-between items-center"
//                                 >
//                                     <div>
//                                         <h3 className="font-semibold text-slate-900">{session?.year || 'Unknown Session'}</h3>
//                                         <div className="flex gap-3 text-sm text-slate-500 mt-1">
//                                             <span>Total: {sessionCounts.all}</span>
//                                             <span className="text-green-600">Approved: {sessionCounts.approved}</span>
//                                             <span className="text-amber-600">Pending: {sessionCounts.pending}</span>
//                                         </div>
//                                     </div>
//                                     <span className="text-slate-400 text-xl">{isExpanded ? '▲' : '▼'}</span>
//                                 </button>
                                
//                                 {/* Session Details */}
//                                 {isExpanded && (
//                                     <div className="p-4 border-t border-slate-200">
//                                         <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Date']} rowCount={sessionInvoices.length}>
//                                             {sessionInvoices.map(inv => {
//                                                 const student = students.find(s => String(s.id) === String(inv.studentId));
//                                                 return (
//                                                     <tr key={inv.id} className="hover:bg-slate-50">
//                                                         <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
//                                                         <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
//                                                         <td className="px-4 py-3">{inv.programName}</td>
//                                                         <td className="px-4 py-3 text-center">Level {inv.level}</td>
//                                                         <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
//                                                         <td className="px-4 py-3">
//                                                             <Badge status={inv.status === 'approved' ? 'success' : 'warning'}>
//                                                                 {inv.status === 'approved' ? 'Approved' : inv.status === 'paid' ? 'Pending Review' : 'Pending'}
//                                                             </Badge>
//                                                         </td>
//                                                         <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
//                                                     </tr>
//                                                 );
//                                             })}
//                                         </Table>
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })}
//                 </>
//             )}
//         </div>
//     );
// };

// export default AccountsRegistered;

// import React, { useState, useMemo } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Table, Badge, Button, Input } from '@/components/shared/UI';
// import { Search, History } from 'lucide-react';

// const AccountsRegistered: React.FC<{ initialFilter?: 'all' | 'approved' | 'pending' }> = ({ initialFilter = 'all' }) => {
//     const { students, sessions } = useEMIS();
//     const { invoices } = useRegistration();
//     const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>(initialFilter);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

//     const currentSession = sessions.find(s => s.active === true);

//     // Filter invoices by current session
//     const currentSessionInvoices = useMemo(() => {
//         if (!currentSession) return [];
//         return invoices.filter(inv => String(inv.academic_session_id) === String(currentSession.id));
//     }, [invoices, currentSession]);

//     // Filter invoices by previous sessions (not current)
//     const historyInvoices = useMemo(() => {
//         if (!currentSession) return invoices;
//         return invoices.filter(inv => String(inv.academic_session_id) !== String(currentSession.id));
//     }, [invoices, currentSession]);

//     const getDisplayInvoices = () => {
//         const source = activeTab === 'current' ? currentSessionInvoices : historyInvoices;
        
//         let filtered = source;
        
//         // Apply status filter
//         if (filter === 'approved') {
//             filtered = filtered.filter(inv => inv.status === 'approved');
//         } else if (filter === 'pending') {
//             filtered = filtered.filter(inv => inv.status === 'pending' || inv.status === 'paid');
//         }
        
//         // Apply search filter
//         if (searchTerm) {
//             const term = searchTerm.toLowerCase();
//             filtered = filtered.filter(inv => {
//                 const student = students.find(s => String(s.id) === String(inv.studentId));
//                 const studentName = student?.name?.toLowerCase() || '';
//                 return studentName.includes(term) || inv.studentReg?.toLowerCase().includes(term);
//             });
//         }
        
//         return filtered;
//     };

//     const displayInvoices = getDisplayInvoices();

//     const counts = {
//         all: currentSessionInvoices.length,
//         approved: currentSessionInvoices.filter(i => i.status === 'approved').length,
//         pending: currentSessionInvoices.filter(i => i.status === 'pending' || i.status === 'paid').length
//     };

//     const historyCounts = {
//         all: historyInvoices.length,
//         approved: historyInvoices.filter(i => i.status === 'approved').length,
//         pending: historyInvoices.filter(i => i.status === 'pending' || i.status === 'paid').length
//     };

//     const getStudentName = (studentId: string) => {
//         const student = students.find(s => String(s.id) === String(studentId));
//         return student?.name || 'Unknown';
//     };

//     return (
//         <div>
//             <PageHeader 
//                 title="Student Registrations" 
//                 subtitle={activeTab === 'current' ? `Current Session: ${currentSession?.year || 'No active session'}` : "Previous Sessions History"} 
//             />

//             {/* Tabs */}
//             <div className="flex gap-2 border-b border-slate-200 mb-4">
//                 <button
//                     onClick={() => setActiveTab('current')}
//                     className={`px-4 py-2 text-sm font-medium transition ${activeTab === 'current'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                     }`}
//                 >
//                     Current Session {currentSession ? `(${currentSession.year})` : ''}
//                 </button>
//                 <button
//                     onClick={() => setActiveTab('history')}
//                     className={`px-4 py-2 text-sm font-medium flex items-center gap-2 transition ${activeTab === 'history'
//                         ? 'border-b-2 border-emerald-600 text-emerald-600'
//                         : 'text-slate-500 hover:text-slate-700'
//                     }`}
//                 >
//                     <History className="w-4 h-4" />
//                     History ({historyCounts.all})
//                 </button>
//             </div>

//             {/* Search and Filter Bar - Only show for Current Session */}
//             {activeTab === 'current' && (
//                 <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
//                     <div className="flex gap-2">
//                         <Button 
//                             variant={filter === 'all' ? 'primary' : 'secondary'}
//                             onClick={() => setFilter('all')}
//                         >
//                             All ({counts.all})
//                         </Button>
//                         <Button 
//                             variant={filter === 'approved' ? 'primary' : 'secondary'}
//                             onClick={() => setFilter('approved')}
//                         >
//                             Approved ({counts.approved})
//                         </Button>
//                         <Button 
//                             variant={filter === 'pending' ? 'primary' : 'secondary'}
//                             onClick={() => setFilter('pending')}
//                         >
//                             Pending ({counts.pending})
//                         </Button>
//                     </div>
                    
//                     <div className="relative">
//                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                         <Input 
//                             type="text"
//                             placeholder="Search by name or reg number..."
//                             className="pl-9 w-64"
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                     </div>
//                 </div>
//             )}

//             {/* History Info Banner */}
//             {activeTab === 'history' && historyInvoices.length === 0 && (
//                 <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 mb-4">
//                     No previous session registrations found
//                 </div>
//             )}

//             {activeTab === 'history' && historyInvoices.length > 0 && (
//                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 text-sm text-slate-600">
//                     Showing {historyInvoices.length} registration(s) from previous academic sessions
//                 </div>
//             )}

//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                 <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Session', 'Date']} rowCount={displayInvoices.length}>
//                     {displayInvoices.map(inv => {
//                         const student = students.find(s => String(s.id) === String(inv.studentId));
//                         const session = sessions.find(s => String(s.id) === String(inv.academic_session_id));
//                         return (
//                             <tr key={inv.id} className="hover:bg-slate-50">
//                                 <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
//                                 <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
//                                 <td className="px-4 py-3">{inv.programName}</td>
//                                 <td className="px-4 py-3 text-center">Level {inv.level}</td>
//                                 <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
//                                 <td className="px-4 py-3">
//                                     <Badge status={inv.status === 'approved' ? 'success' : 'warning'}>
//                                         {inv.status === 'approved' ? 'Approved' : inv.status === 'paid' ? 'Pending Review' : 'Pending'}
//                                     </Badge>
//                                 </td>
//                                 <td className="px-4 py-3 text-sm">{session?.year || 'N/A'}</td>
//                                 <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
//                             </tr>
//                         );
//                     })}
//                 </Table>
//             </div>
//         </div>
//     );
// };

// export default AccountsRegistered;

// import React, { useState } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Table, Badge, Button, Input } from '@/components/shared/UI';
// import { Search } from 'lucide-react';

// // const AccountsRegistered: React.FC = () => {
// const AccountsRegistered: React.FC<{ initialFilter?: 'all' | 'approved' | 'pending' }> = ({ initialFilter = 'all' }) => {
//     const { students } = useEMIS();
//     const { invoices } = useRegistration();
//     // const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
//     const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>(initialFilter);
//     const [searchTerm, setSearchTerm] = useState('');

//     const filteredInvoices = invoices.filter(inv => {
//         // Apply status filter
//         if (filter === 'approved') return inv.status === 'approved';
//         if (filter === 'pending') return inv.status === 'pending' || inv.status === 'paid';
        
//         // Apply search filter
//         const student = students.find(s => String(s.id) === String(inv.studentId));
//         const studentName = student?.name?.toLowerCase() || '';
//         const studentReg = inv.studentReg?.toLowerCase() || '';
//         const search = searchTerm.toLowerCase();
        
//         if (searchTerm) {
//             return studentName.includes(search) || studentReg.includes(search);
//         }
        
//         return true;
//     }).filter(inv => {
//         // Re-apply status filter after search (simplified)
//         if (filter === 'approved') return inv.status === 'approved';
//         if (filter === 'pending') return inv.status === 'pending' || inv.status === 'paid';
//         return true;
//     });

//     const counts = {
//         all: invoices.length,
//         approved: invoices.filter(i => i.status === 'approved').length,
//         pending: invoices.filter(i => i.status === 'pending' || i.status === 'paid').length
//     };

//     const getStudentName = (studentId: string) => {
//         const student = students.find(s => String(s.id) === String(studentId));
//         return student?.name || 'Unknown';
//     };

//     return (
//         <div>
//             <PageHeader title="Student Registrations" subtitle="View all registration attempts" />

//             {/* Search and Filter Bar */}
//             <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
//                 <div className="flex gap-2">
//                     <Button 
//                         variant={filter === 'all' ? 'primary' : 'secondary'}
//                         onClick={() => setFilter('all')}
//                     >
//                         All ({counts.all})
//                     </Button>
//                     <Button 
//                         variant={filter === 'approved' ? 'primary' : 'secondary'}
//                         onClick={() => setFilter('approved')}
//                     >
//                         Approved ({counts.approved})
//                     </Button>
//                     <Button 
//                         variant={filter === 'pending' ? 'primary' : 'secondary'}
//                         onClick={() => setFilter('pending')}
//                     >
//                         Pending ({counts.pending})
//                     </Button>
//                 </div>
                
//                 <div className="relative">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
//                     <Input 
//                         type="text"
//                         placeholder="Search by name or reg number..."
//                         className="pl-9 w-64"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>
//             </div>

//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
//                 <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Date']} rowCount={filteredInvoices.length}>
//                     {filteredInvoices.map(inv => {
//                         const student = students.find(s => String(s.id) === String(inv.studentId));
//                         return (
//                             <tr key={inv.id} className="hover:bg-slate-50">
//                                 <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
//                                 <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
//                                 <td className="px-4 py-3">{inv.programName}</td>
//                                 <td className="px-4 py-3 text-center">Level {inv.level}</td>
//                                 <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
//                                 <td className="px-4 py-3">
//                                     <Badge status={inv.status === 'approved' ? 'approved' : 'pending'}>
//                                         {inv.status}
//                                     </Badge>
//                                 </td>
//                                 <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
//                             </tr>
//                         );
//                     })}
//                 </Table>
//             </div>
//         </div>
//     );
// };

// export default AccountsRegistered;