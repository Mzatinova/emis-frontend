import React from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { StatCard, Badge, PageHeader, Table, Toast } from '@/components/shared/UI';
import { GraduationCap, CalendarDays, FileText, Users, UserCheck, Clock, Repeat, BookOpen, Upload, Hourglass } from 'lucide-react';

interface AdminDashboardProps {
    toast: string;
    setToast: (msg: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ toast, setToast }) => {
    const { students, users, courses, sessions, results, repeatersList, audits } = useEMIS();
    const { registrations, invoices } = useRegistration();

    const instructors = users.filter(u => u.role === 'instructor' && u.active);

    // Get current active session
    const currentSession = sessions.find(s => s.active === true);

    // Registration stat

    const totalRegisteredStudents = invoices.filter(i => String(i.academic_session_id) === String(currentSession?.id)).length;
const approvedStudents = invoices.filter(i => String(i.academic_session_id) === String(currentSession?.id) && i.status === 'approved').length;
const pendingStudents = invoices.filter(i => String(i.academic_session_id) === String(currentSession?.id) && (i.status === 'pending' || i.status === 'paid')).length;
    const repeaters = repeatersList.length;

    // Results stats
    const publishedExams = results.filter(r => r.status === 'approved').length;
    const resultsPending = results.filter(r => r.status === 'pending').length;

    // Results just uploaded (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const resultsJustUploaded = results.filter(r => new Date(r.createdAt) > sevenDaysAgo).length;

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader title="Administrator Dashboard" subtitle="Manage students, instructors, sessions, and results" />

            {!currentSession && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800">No Active Academic Session</p>
                            <p className="text-sm text-amber-600">Please create and activate a new session to start registration.</p>
                        </div>
                    </div>
                </div>
            )}
            {/* 6 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">

                <StatCard label="Total Students" value={students.length} icon={GraduationCap} color="bg-blue-600" sub={`${students.filter(s => s.active).length} active`} />

                <StatCard label="Total Instructors" value={instructors.length} icon={Users} color="bg-emerald-600" />

                <StatCard label="Total Registered" value={totalRegisteredStudents} icon={UserCheck} color="bg-purple-600" sub="Students who registered" />

                <StatCard label="Approved Students" value={approvedStudents} icon={UserCheck} color="bg-green-600" sub="Registration approved" />

                <StatCard label="Pending Students" value={pendingStudents} icon={Clock} color="bg-amber-600" sub="Awaiting approval" />
                <StatCard
                    label="Current Session"
                    value={currentSession ? currentSession.year : 'None'}
                    icon={CalendarDays}
                    color="bg-rose-600"
                    sub={currentSession && currentSession.start_date && currentSession.end_date
                        ? `${new Date(currentSession.start_date).toLocaleDateString()} - ${new Date(currentSession.end_date).toLocaleDateString()}`
                        : ''}
                />
            </div>

            {/* Pending Approval Alert */}
            {/* {pendingStudents > 0 && (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
                <p className="font-medium text-amber-800">{pendingStudents} student(s) pending registration approval</p>
                <p className="text-sm text-amber-600">Go to Registration Approval to review</p>
            </div>
        </div>
    </div>
)} */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recently Registered Students */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-900 mb-4">Recently Registered Students</h3>
                    <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status']} rowCount={Math.min(students.length, 5)}>
                        {students.slice(-5).reverse().map(s => (
                            <tr key={s.id}>
                                <td className="px-4 py-3 font-mono text-xs">{s.regNumber}</td>
                                <td className="px-4 py-3">{s.name}</td>
                                <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                                <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
                            </tr>
                        ))}
                    </Table>
                </div>

                {/* Exam Summary Box */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Exam Summary
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Repeat className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-medium">Repeaters</span>
                            </div>
                            <span className="text-lg font-bold text-orange-600">{repeaters}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium">Published Exams</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">{publishedExams}</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Hourglass className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-medium">Results Pending</span>
                            </div>
                            <span className="text-lg font-bold text-amber-600">{resultsPending}</span>
                        </div>

                        {/* <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Upload className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">Results Just Uploaded (7 days)</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">{resultsJustUploaded}</span>
                        </div> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;