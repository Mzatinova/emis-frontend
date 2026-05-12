// src/components/dashboard/student/StudentHistory.tsx
import React from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge } from '@/components/shared/UI';

const StudentHistory: React.FC = () => {
    const { currentUser, courses, results } = useEMIS();

    const myResults = results.filter(r => r.studentId === currentUser?.id && r.status === 'approved');
    const sorted = [...myResults].sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());

    return (
        <div>
            <PageHeader title="Result History" subtitle="Timeline of all approved results" />
            <div className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="space-y-4">
                    {sorted.length === 0 && <p className="text-center py-12 text-slate-400">No history yet</p>}
                    {sorted.map(r => {
                        const c = courses.find(x => x.id === r.courseId);
                        return (
                            <div key={r.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${r.grade === 'F' ? 'bg-red-500' : 'bg-emerald-600'}`}>
                                    {r.grade}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between flex-wrap">
                                        <p className="font-medium text-slate-900">{c?.code} - {c?.name}</p>
                                        <Badge status="approved" />
                                    </div>
                                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                        <span>Exam: {r.exam ?? '—'}</span>
                                        <span>Grade: {r.grade}</span>
                                        <span>Approved: {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString() : '—'}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StudentHistory;