import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Select, Badge, Table, Toast, Button } from '@/components/shared/UI';
import { Download, DollarSign, TrendingUp, TrendingDown, Users, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RevenueReportProps {
    toast: string;
    setToast: (msg: string) => void;
}

const RevenueReport: React.FC<RevenueReportProps> = ({ toast, setToast }) => {
    const { students, sessions } = useEMIS();
    const { invoices } = useRegistration();
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [selectedLevel, setSelectedLevel] = useState<string>('');

    // Get sessions with invoices
    const sessionsWithInvoices = useMemo(() => {
        const sessionIds = new Set(invoices.map(inv => String(inv.academic_session_id)).filter(Boolean));
        return sessions.filter(s => sessionIds.has(String(s.id)));
    }, [sessions, invoices]);

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

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let result = invoices;

        if (selectedSessionId) {
            result = result.filter(inv => String(inv.academic_session_id) === selectedSessionId);
        }

        if (selectedProgram) {
            const studentIds = students.filter(s => s.program === selectedProgram).map(s => String(s.id));
            result = result.filter(inv => studentIds.includes(String(inv.studentId)));
        }

        if (selectedLevel) {
            const studentIds = students.filter(s => s.level === selectedLevel).map(s => String(s.id));
            result = result.filter(inv => studentIds.includes(String(inv.studentId)));
        }

        return result;
    }, [invoices, selectedSessionId, selectedProgram, selectedLevel, students]);

    // Revenue statistics
    const revenueStats = useMemo(() => {
        const totalInvoices = filteredInvoices.length;
        const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const approvedRevenue = filteredInvoices
            .filter(inv => inv.status === 'approved')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const pendingRevenue = filteredInvoices
            .filter(inv => inv.status === 'pending' || inv.status === 'paid')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const rejectedRevenue = filteredInvoices
            .filter(inv => inv.status === 'rejected')
            .reduce((sum, inv) => sum + (inv.amount || 0), 0);

        const approvedCount = filteredInvoices.filter(inv => inv.status === 'approved').length;
        const pendingCount = filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'paid').length;
        const rejectedCount = filteredInvoices.filter(inv => inv.status === 'rejected').length;
       const uniqueStudents = new Set(filteredInvoices.map(inv => String(inv.studentId))).size;

        return {
            totalInvoices,
            totalRevenue,
            approvedRevenue,
            pendingRevenue,
            rejectedRevenue,
            approvedCount,
            pendingCount,
            rejectedCount,
            uniqueStudents,
        };
    }, [filteredInvoices]);

    // Revenue by program
    const revenueByProgram = useMemo(() => {
        const stats: Record<string, any> = {};

        programs.forEach(program => {
           const studentIds = students.filter(s => s.program === program).map(s => String(s.id));
const programInvoices = filteredInvoices.filter(inv => studentIds.includes(String(inv.studentId)));

            const total = programInvoices.length;
            const revenue = programInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            const approved = programInvoices.filter(inv => inv.status === 'approved').length;
            const approvedRevenue = programInvoices
                .filter(inv => inv.status === 'approved')
                .reduce((sum, inv) => sum + (inv.amount || 0), 0);

            stats[program as string] = { total, revenue, approved, approvedRevenue };
        });

        return stats;
    }, [filteredInvoices, programs, students]);

    // Revenue by level
    const revenueByLevel = useMemo(() => {
        const stats: Record<string, any> = {};

        levels.forEach(level => {
        const studentIds = students.filter(s => s.level === level).map(s => String(s.id));
const levelInvoices = filteredInvoices.filter(inv => studentIds.includes(String(inv.studentId)));

            const total = levelInvoices.length;
            const revenue = levelInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            const approved = levelInvoices.filter(inv => inv.status === 'approved').length;
            const approvedRevenue = levelInvoices
                .filter(inv => inv.status === 'approved')
                .reduce((sum, inv) => sum + (inv.amount || 0), 0);

            stats[level as string] = { total, revenue, approved, approvedRevenue };
        });

        return stats;
    }, [filteredInvoices, levels, students]);

    // Get selected session name
    const selectedSession = sessions.find(s => String(s.id) === selectedSessionId);

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
        a.download = `revenue_report_${selectedSessionId || 'all'}.csv`;
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
                title="Revenue Report"
                subtitle="Track revenue from student registrations"
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
                                    {s.year}
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

            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        Total Revenue
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                        K{revenueStats.totalRevenue.toLocaleString()}
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Approved Revenue
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">
                        K{revenueStats.approvedRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">{revenueStats.approvedCount} registrations</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Pending Revenue
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                        K{revenueStats.pendingRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">{revenueStats.pendingCount} registrations</div>
                </div>
                {/* <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <XCircle className="w-4 h-4 text-red-600" />
                        Rejected Revenue
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                        K{revenueStats.rejectedRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">{revenueStats.rejectedCount} registrations</div>
                </div> */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Users className="w-4 h-4 text-blue-600" />
                        Unique Students
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{revenueStats.uniqueStudents}</div>
                    <div className="text-xs text-slate-500">Total registrations: {revenueStats.totalInvoices}</div>
                </div>
            </div>

            {/* Revenue by Program */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Revenue by Program</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(revenueByProgram)
                            .sort((a, b) => b[1].revenue - a[1].revenue)
                            .map(([program, data]) => (
                                <div key={program} className="flex justify-between items-center p-2 border-b border-slate-100">
                                    <div>
                                        <span className="text-sm font-medium">{program}</span>
                                        <span className="text-xs text-slate-400 ml-2">({data.total} regs)</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-emerald-600">K{data.revenue.toLocaleString()}</span>
                                        <span className="text-xs text-slate-400 block">{data.approved} approved</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Revenue by Level */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-3">Revenue by Level</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {Object.entries(revenueByLevel)
                            .sort((a, b) => b[1].revenue - a[1].revenue)
                            .map(([level, data]) => (
                                <div key={level} className="flex justify-between items-center p-2 border-b border-slate-100">
                                    <div>
                                        <span className="text-sm font-medium">{level}</span>
                                        <span className="text-xs text-slate-400 ml-2">({data.total} regs)</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-emerald-600">K{data.revenue.toLocaleString()}</span>
                                        <span className="text-xs text-slate-400 block">{data.approved} approved</span>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            {/* Detailed Revenue Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3">Revenue Details</h3>
                <Table
                    headers={['Student', 'Program', 'Level', 'Amount', 'Status', 'Date']}
                    rowCount={Math.min(filteredInvoices.length, 20)}
                >
                    {filteredInvoices.slice(0, 20).map(inv => {
                     const student = students.find(s => String(s.id) === String(inv.studentId));
                        return (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm">
                                    <div className="font-medium">{student?.name || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500 font-mono">{inv.studentReg}</div>
                                </td>
                                <td className="px-4 py-3 text-sm">{inv.programName || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm">{inv.level || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm font-bold text-emerald-600">K{inv.amount?.toLocaleString() || 0}</td>
                                <td className="px-4 py-3">{getStatusBadge(inv.status)}</td>
                                <td className="px-4 py-3 text-sm">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}</td>
                            </tr>
                        );
                    })}
                </Table>
                {filteredInvoices.length > 20 && (
                    <p className="text-sm text-slate-500 mt-2">Showing 20 of {filteredInvoices.length} invoices</p>
                )}
            </div>

            {filteredInvoices.length === 0 && (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
                    <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No revenue data found for the selected filters</p>
                </div>
            )}
        </div>
    );
};

export default RevenueReport;