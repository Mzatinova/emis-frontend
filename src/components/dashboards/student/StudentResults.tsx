// src/components/dashboard/student/StudentResults.tsx
import React, { useMemo, useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Button, Table, Select, Badge } from '@/components/shared/UI';
import { Download, Search } from 'lucide-react';

interface StudentResultsProps {
    downloadPDF: () => void;
}

const StudentResults: React.FC<StudentResultsProps> = ({ downloadPDF }) => {
    const { currentUser, courses, results, sessions } = useEMIS();

    const myResults = results.filter(r => r.studentId === currentUser?.id && r.status === 'approved');

    const [filters, setFilters] = useState({ courseId: '', sessionId: '' });

    const filtered = useMemo(() => myResults.filter(r =>
        (!filters.courseId || r.courseId === filters.courseId) &&
        (!filters.sessionId || r.sessionId === filters.sessionId)
    ), [myResults, filters]);

    return (
        <div>
            <PageHeader
                title="My Results"
                subtitle="Showing only approved (official) results"
                action={<Button onClick={downloadPDF}><Download className="w-4 h-4 inline mr-1" />Download PDF</Button>}
            />

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select value={filters.courseId} onChange={e => setFilters({ ...filters, courseId: e.target.value })}>
                    <option value="">All courses</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </Select>
                <Select value={filters.sessionId} onChange={e => setFilters({ ...filters, sessionId: e.target.value })}>
                    <option value="">All sessions</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.year} {s.semester}</option>)}
                </Select>
            </div>

            <Table headers={['Course', 'Session', 'Exam', 'Grade']} rowCount={filtered.length}>
                {filtered.map(r => {
                    const cou = courses.find(c => c.id === r.courseId);
                    const sess = sessions.find(s => s.id === r.sessionId);
                    return (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-xs">{cou?.code}</div>
                                <div className="text-xs text-slate-500">{cou?.name}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">{sess?.year} {sess?.semester}</td>
                            <td className="px-4 py-3 text-center font-medium">{r.exam ?? '—'}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                    {r.grade}
                                </span>
                            </td>
                        </tr>
                    );
                })}
            </Table>
        </div>
    );
};

export default StudentResults;