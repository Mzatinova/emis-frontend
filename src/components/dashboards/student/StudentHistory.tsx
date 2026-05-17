// src/components/dashboard/student/StudentResultsHistory.tsx
import React from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge } from '@/components/shared/UI';

const StudentResultsHistory: React.FC = () => {
    const { currentUser, courses, results, sessions } = useEMIS();

    const myResults = results.filter(r => String(r.studentId) === String(currentUser?.id) && r.status === 'approved');

    // Group results by academic year using session
    const groupedByYear: { [key: string]: any[] } = {};

    myResults.forEach(r => {
        const session = sessions.find(s => s.id === r.sessionId);
        const year = session?.year || 'Unknown Year';
        if (!groupedByYear[year]) {
            groupedByYear[year] = [];
        }
        groupedByYear[year].push(r);
    });

    // Sort years descending (newest first)
    const sortedYears = Object.keys(groupedByYear).sort().reverse();

    return (
        <div>
            <PageHeader title="Result History" />

            {sortedYears.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
                    No results available
                </div>
            )}

            {sortedYears.map(year => (
                <div key={year} className="mb-6">
                    <div className="text-center text-sm text-slate-600">
                Academic Year: <span className="font-medium text-emerald-600">{sessions.find(s => s.active)?.year || 'None'}</span>
           
                    <p className="text-sm text-slate-500 mb-3 px-2">
                        Level: {[...new Set(groupedByYear[year].map(r => r.level))].join(', ')}
                        <span className="mx-3">|</span>
                        Status: {groupedByYear[year].every(r => r.grade !== 'F' && r.marks !== null) ? (
                            <span className="text-emerald-600 font-medium">PASS AND PROCEED</span>
                        ) : (
                            <span className="text-red-600 font-medium">FAILED - REPEAT</span>
                        )}
                    </p>
                     </div>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Course</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Score</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Grade</th>

                                </tr>
                            </thead>
                            <tbody>
                                {groupedByYear[year].map(r => {
                                    const course = courses.find(c => c.id === r.courseId);
                                    return (
                                        <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">

                                            <td className="px-4 py-3">
                                                <div className="font-medium text-sm text-slate-900">{course?.name || r.courseName}</div>
                                                <div className="text-xs text-slate-500">{course?.code}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">{r.marks ?? '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {r.grade}
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StudentResultsHistory;
