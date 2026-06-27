import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Select, Badge, Table, Toast, Button } from '@/components/shared/UI';
import { Download, Users, CheckCircle, Clock, XCircle, TrendingUp, Calendar } from 'lucide-react';

interface RegistrationReportProps {
    toast: string;
    setToast: (msg: string) => void;
}

const RegistrationReport: React.FC<RegistrationReportProps> = ({ toast, setToast }) => {
    const { students, sessions, programsList } = useEMIS();
    const { invoices } = useRegistration();
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [viewType, setViewType] = useState<'overview' | 'program' | 'level' | 'trend'>('overview');

    // Get sessions with invoices
    const sessionsWithInvoices = useMemo(() => {
        const sessionIds = new Set(invoices.map(inv => String(inv.academic_session_id)).filter(Boolean));
        return sessions.filter(s => sessionIds.has(String(s.id)));
    }, [sessions, invoices]);

    // Get unique programs from students with invoices
    const programsWithInvoices = useMemo(() => {
       const programSet = new Set();
const studentIds = new Set(invoices.map(inv => String(inv.studentId)));
students.filter(s => studentIds.has(String(s.id))).forEach(s => {
            if (s.program) programSet.add(s.program);
        });
        return Array.from(programSet);
    }, [invoices, students]);

    // Get unique levels from students with invoices
    const levelsWithInvoices = useMemo(() => {
      const levelSet = new Set();
const studentIds = new Set(invoices.map(inv => String(inv.studentId)));
students.filter(s => studentIds.has(String(s.id))).forEach(s => {
            if (s.level) levelSet.add(s.level);
        });
        return Array.from(levelSet).sort();
    }, [invoices, students]);

    // Filter invoices by session
    const sessionInvoices = useMemo(() => {
        if (!selectedSessionId) return invoices;
        return invoices.filter(inv => String(inv.academic_session_id) === selectedSessionId);
    }, [invoices, selectedSessionId]);

    // Further filter by program and level
    const filteredInvoices = useMemo(() => {
        let result = sessionInvoices;
        
      if (selectedProgram) {
    const studentIds = students.filter(s => s.program === selectedProgram).map(s => String(s.id));
    result = result.filter(inv => studentIds.includes(String(inv.studentId)));
}

if (selectedLevel) {
    const studentIds = students.filter(s => s.level === selectedLevel).map(s => String(s.id));
    result = result.filter(inv => studentIds.includes(String(inv.studentId)));
}
        
        return result;
    }, [sessionInvoices, selectedProgram, selectedLevel, students]);

    // Overview statistics
    const overviewStats = useMemo(() => {
        const total = filteredInvoices.length;
        const approved = filteredInvoices.filter(inv => inv.status === 'approved').length;
        const pending = filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'paid').length;
        // const rejected = filteredInvoices.filter(inv => inv.status === 'rejected').length;
       const uniqueStudents = new Set(filteredInvoices.map(inv => String(inv.studentId))).size;
        
        return { total, approved, pending, uniqueStudents };
    }, [filteredInvoices]);

    // Statistics by program
    const programStats = useMemo(() => {
        const stats: Record<string, any> = {};
        
        programsWithInvoices.forEach(program => {
           const studentIds = students.filter(s => s.program === program).map(s => String(s.id));
const programInvoices = filteredInvoices.filter(inv => studentIds.includes(String(inv.studentId)));
            
            const total = programInvoices.length;
            const approved = programInvoices.filter(inv => inv.status === 'approved').length;
            const pending = programInvoices.filter(inv => inv.status === 'pending' || inv.status === 'paid').length;
            const rejected = programInvoices.filter(inv => inv.status === 'rejected').length;
            const approvalRate = total > 0 ? (approved / total) * 100 : 0;
            
            stats[program as string] = { total, approved, pending, rejected, approvalRate };
        });
        
        return stats;
    }, [filteredInvoices, programsWithInvoices, students]);

    // Statistics by level
    const levelStats = useMemo(() => {
        const stats: Record<string, any> = {};
        
        levelsWithInvoices.forEach(level => {
      const studentIds = students.filter(s => s.level === level).map(s => String(s.id));
const levelInvoices = filteredInvoices.filter(inv => studentIds.includes(String(inv.studentId)));
            
            const total = levelInvoices.length;
            const approved = levelInvoices.filter(inv => inv.status === 'approved').length;
            const pending = levelInvoices.filter(inv => inv.status === 'pending' || inv.status === 'paid').length;
            const rejected = levelInvoices.filter(inv => inv.status === 'rejected').length;
            const approvalRate = total > 0 ? (approved / total) * 100 : 0;
            
            stats[level as string] = { total, approved, pending, rejected, approvalRate };
        });
        
        return stats;
    }, [filteredInvoices, levelsWithInvoices, students]);

    // Trend data (by registration date)
    const trendData = useMemo(() => {
        const trends: Record<string, { date: string, total: number, approved: number, pending: number }> = {};
        
        filteredInvoices.forEach(inv => {
            const date = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Unknown';
            if (!trends[date]) {
                trends[date] = { date, total: 0, approved: 0, pending: 0 };
            }
            trends[date].total += 1;
            if (inv.status === 'approved') trends[date].approved += 1;
            if (inv.status === 'pending' || inv.status === 'paid') trends[date].pending += 1;
        });
        
        // Sort by date
        return Object.values(trends).sort((a, b) => {
            if (a.date === 'Unknown') return 1;
            if (b.date === 'Unknown') return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
    }, [filteredInvoices]);

    // Download CSV
    const downloadReport = () => {
        let csv = 'Student,Reg Number,Program,Level,Amount,Status,Date\n';
        
        filteredInvoices.forEach(inv => {
            const student = students.find(s => String(s.id) === String(inv.studentId));
            
            csv += `${student?.name || 'Unknown'},${inv.studentReg || 'N/A'},${inv.programName || 'N/A'},${inv.level || 'N/A'},${inv.amount || 0},${inv.status},${inv.createdAt || ''}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `registration_report_${selectedSessionId || 'all'}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        setToast('Report downloaded');
    };

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge status="success">Approved</Badge>;
            case 'pending': return <Badge status="warning">Pending</Badge>;
            case 'paid': return <Badge status="info">Paid</Badge>;
            case 'rejected': return <Badge status="error">Rejected</Badge>;
            default: return <Badge status="default">{status}</Badge>;
        }
    };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader 
                title="Registration Report" 
                subtitle="Analyze student registrations by session, program, and level"
                action={
                    <Button onClick={downloadReport} disabled={filteredInvoices.length === 0}>
                        <Download className="w-4 h-4 mr-1" />
                        Export CSV
                    </Button>
                }
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
                        <Select 
                            value={selectedSessionId}
                            onChange={e => setSelectedSessionId(e.target.value)}
                        >
                            <option value="">All Sessions</option>
                            {sessionsWithInvoices.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.year} ({s.start_date ? new Date(s.start_date).toLocaleDateString() : '?'})
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
                        <Select 
                            value={selectedProgram}
                            onChange={e => setSelectedProgram(e.target.value)}
                        >
                            <option value="">All Programs</option>
                            {programsWithInvoices.map(p => (
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
                            {levelsWithInvoices.map(l => (
                                <option key={l as string} value={l as string}>{l as string}</option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => setViewType('overview')}
                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewType === 'overview' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <Users className="w-4 h-4 inline mr-1" />
                        Overview
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
                    <button
                        onClick={() => setViewType('trend')}
                        className={`px-3 py-1.5 rounded text-sm font-medium ${viewType === 'trend' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Trend
                    </button>
                </div>
            </div>

            {/* Overview Statistics */}
            {viewType === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Users className="w-4 h-4" />
                                Total Registrations
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{overviewStats.total}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                Approved
                            </div>
                            <div className="text-2xl font-bold text-emerald-600">{overviewStats.approved}</div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Clock className="w-4 h-4 text-amber-600" />
                                Pending
                            </div>
                            <div className="text-2xl font-bold text-amber-600">{overviewStats.pending}</div>
                        </div>
                        {/* <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <XCircle className="w-4 h-4 text-red-600" />
                                Rejected
                            </div>
                            <div className="text-2xl font-bold text-red-600">{overviewStats.rejected}</div>
                        </div> */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                <Users className="w-4 h-4 text-blue-600" />
                                Unique Students
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{overviewStats.uniqueStudents}</div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-900 mb-3">Registration Details</h3>
                        <Table 
                            headers={['Student', 'Reg Number', 'Program', 'Level', 'Amount', 'Status', 'Date']} 
                            rowCount={Math.min(filteredInvoices.length, 20)}
                        >
                            {filteredInvoices.slice(0, 20).map(inv => {
                               const student = students.find(s => String(s.id) === String(inv.studentId));
                                return (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm">{student?.name || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-sm font-mono">{inv.studentReg || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm">{inv.programName || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm">{inv.level || 'N/A'}</td>
                                        <td className="px-4 py-3 text-sm font-medium">K{inv.amount?.toLocaleString() || 0}</td>
                                        <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                                        <td className="px-4 py-3 text-sm">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                );
                            })}
                        </Table>
                        {filteredInvoices.length > 20 && (
                            <p className="text-sm text-slate-500 mt-2">Showing 20 of {filteredInvoices.length} registrations</p>
                        )}
                    </div>
                </>
            )}

            {/* By Program */}
            {viewType === 'program' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Registrations by Program</h3>
                    <Table headers={['Program', 'Total', 'Approved', 'Pending', 'Rejected', 'Approval Rate']} rowCount={Object.keys(programStats).length}>
                        {Object.entries(programStats).map(([program, stats]) => (
                            <tr key={program} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{program}</td>
                                <td className="px-4 py-3">{stats.total}</td>
                                <td className="px-4 py-3 text-emerald-600">{stats.approved}</td>
                                <td className="px-4 py-3 text-amber-600">{stats.pending}</td>
                                <td className="px-4 py-3 text-red-600">{stats.rejected}</td>
                                <td className="px-4 py-3">
                                    <Badge status={stats.approvalRate >= 70 ? 'success' : stats.approvalRate >= 50 ? 'warning' : 'error'}>
                                        {stats.approvalRate.toFixed(1)}%
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* By Level */}
            {viewType === 'level' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Registrations by Level</h3>
                    <Table headers={['Level', 'Total', 'Approved', 'Pending', 'Rejected', 'Approval Rate']} rowCount={Object.keys(levelStats).length}>
                        {Object.entries(levelStats).map(([level, stats]) => (
                            <tr key={level} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{level}</td>
                                <td className="px-4 py-3">{stats.total}</td>
                                <td className="px-4 py-3 text-emerald-600">{stats.approved}</td>
                                <td className="px-4 py-3 text-amber-600">{stats.pending}</td>
                                <td className="px-4 py-3 text-red-600">{stats.rejected}</td>
                                <td className="px-4 py-3">
                                    <Badge status={stats.approvalRate >= 70 ? 'success' : stats.approvalRate >= 50 ? 'warning' : 'error'}>
                                        {stats.approvalRate.toFixed(1)}%
                                    </Badge>
                                </td>
                            </tr>
                        ))}
                    </Table>
                </div>
            )}

            {/* Trend */}
            {viewType === 'trend' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Registration Trend
                    </h3>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {trendData.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-2 border-b border-slate-100 hover:bg-slate-50">
                                <div className="w-32 text-sm font-medium text-slate-700">{item.date}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-slate-500">Total:</span>
                                                <span className="font-medium">{item.total}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-emerald-600">Approved:</span>
                                                <span className="font-medium text-emerald-600">{item.approved}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-amber-600">Pending:</span>
                                                <span className="font-medium text-amber-600">{item.pending}</span>
                                            </div>
                                        </div>
                                        <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                                            <div 
                                                className="h-full bg-emerald-500" 
                                                style={{ width: `${item.total > 0 ? (item.approved / item.total) * 100 : 0}%` }}
                                            />
                                            <div 
                                                className="h-full bg-amber-500" 
                                                style={{ width: `${item.total > 0 ? (item.pending / item.total) * 100 : 0}%` }}
                                            />
                                            <div 
                                                className="h-full bg-red-500" 
                                                style={{ width: `${item.total > 0 ? ((item.total - item.approved - item.pending) / item.total) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {trendData.length === 0 && (
                        <p className="text-center py-8 text-slate-500">No registration data available</p>
                    )}
                </div>
            )}

            {filteredInvoices.length === 0 && viewType !== 'trend' && (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                    <p className="text-slate-500">No registrations found for the selected filters</p>
                </div>
            )}
        </div>
    );
};

export default RegistrationReport;