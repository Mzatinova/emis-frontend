import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Modal, Field, Input, Select, Button, Table, Toast, Badge } from '@/components/shared/UI';
import { Search, Upload, Edit2, Plus } from 'lucide-react';

interface InstructorResultsProps {
    toast: string;
    setToast: (msg: string) => void;
    myAssignedCourses: { programName: string; level: number; courseName: string }[];
}

const InstructorResults: React.FC<InstructorResultsProps> = ({ toast, setToast, myAssignedCourses }) => {
    const { currentUser, students, courses, results, sessions, addResult, updateResult } = useEMIS();

    const [resultModal, setResultModal] = useState(false);
    const [editingResult, setEditingResult] = useState<any>(null);
    const [rForm, setRForm] = useState({ studentId: '', courseId: '', sessionId: '', exam: '' });
    const [csvOpen, setCsvOpen] = useState(false);
    const [csvText, setCsvText] = useState('regNumber,courseName,exam\nTC/2025/003,Practical,55');
    const [filters, setFilters] = useState({ search: '' });

    // Get course IDs that this instructor teaches (from myAssignedCourses)
    const myCourseIds = useMemo(() => {
        const ids: string[] = [];
        myAssignedCourses.forEach(assigned => {
            const course = courses.find(c =>
                c.name === assigned.courseName ||
                c.name?.toLowerCase().includes(assigned.courseName.toLowerCase())
            );
            if (course && !ids.includes(course.id)) {
                ids.push(course.id);
            }
        });
        return ids;
    }, [courses, myAssignedCourses]);

    // Filter results for this instructor's courses
    const myResults = useMemo(() => {
        return results.filter(r => myCourseIds.includes(r.courseId));
    }, [results, myCourseIds]);

    const openNewResult = () => {
        setEditingResult(null);
        setRForm({ studentId: '', courseId: '', sessionId: sessions[0]?.id || '', exam: '' });
        setResultModal(true);
    };

    const openEditResult = (r: any) => {
        if (r.status === 'approved') { setToast('Cannot edit approved (locked) result'); return; }
        setEditingResult(r);
        setRForm({ studentId: r.studentId, courseId: r.courseId, sessionId: r.sessionId, exam: r.exam?.toString() || '' });
        setResultModal(true);
    };

    const submitResult = (e: React.FormEvent) => {
        e.preventDefault();
        const student = students.find(s => s.id === rForm.studentId);
        const course = courses.find(c => c.id === rForm.courseId);
        if (!student || !course || !rForm.sessionId) { setToast('Fill all fields'); return; }
        const exam = rForm.exam === '' ? null : parseFloat(rForm.exam);

        if (editingResult) {
            updateResult(editingResult.id, { exam });
            setToast('Result updated');
        } else {
            const existing = results.find(r => r.studentId === student.id && r.courseId === course.id && r.sessionId === rForm.sessionId);
            if (existing) {
                setToast('Result already exists for this student, course, and session');
                return;
            }
            addResult({
                studentId: student.id,
                studentReg: student.regNumber,
                courseId: course.id,
                moduleId: '',
                sessionId: rForm.sessionId,
                ca: null,
                exam,
                createdBy: currentUser!.id
            });
            setToast('Result entered');
        }
        setResultModal(false);
    };

    const handleCsv = () => {
        const lines = csvText.trim().split('\n').slice(1);
        let added = 0;
        lines.forEach(line => {
            const [reg, courseName, examS] = line.split(',').map(s => s.trim());
            const stu = students.find(s => s.regNumber === reg);
            const cou = courses.find(c => c.name?.toLowerCase().includes(courseName.toLowerCase()));
            if (stu && cou) {
                const existing = results.find(r => r.studentId === stu.id && r.courseId === cou.id && r.sessionId === sessions[0]?.id);
                if (!existing) {
                    addResult({
                        studentId: stu.id, studentReg: stu.regNumber, courseId: cou.id, moduleId: '',
                        sessionId: sessions[0]?.id || '', ca: null, exam: examS ? parseFloat(examS) : null,
                        createdBy: currentUser!.id
                    });
                    added++;
                }
            }
        });
        setCsvOpen(false);
        setToast(`${added} results entered from CSV`);
    };

    const filteredResults = useMemo(() => myResults.filter(r => {
        const student = students.find(s => s.id === r.studentId);
        const course = courses.find(c => c.id === r.courseId);
        const searchTerm = filters.search.toLowerCase();
        return (
            !filters.search ||
            r.studentReg.toLowerCase().includes(searchTerm) ||
            (student?.name || '').toLowerCase().includes(searchTerm) ||
            (course?.name || '').toLowerCase().includes(searchTerm)
        );
    }), [myResults, filters, students, courses]);

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Results Management"
                subtitle="Enter and edit exam results for your students (locked after approval)"
                action={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setCsvOpen(true)}>
                            <Upload className="w-4 h-4 inline mr-1" />CSV Upload
                        </Button>
                        <Button onClick={openNewResult}>
                            <Plus className="w-4 h-4 inline mr-1" />Enter Result
                        </Button>
                    </div>
                }
            />

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                        placeholder="Search by name, reg number or course"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                        className="pl-9"
                    />
                </div>
            </div>

            <Table headers={['Student', 'Course', 'Level', 'Exam Mark', 'Grade', 'Status', 'Actions']} rowCount={filteredResults.length}>
                {filteredResults.map(r => {
                    const stu = students.find(s => s.id === r.studentId);
                    const cou = courses.find(c => c.id === r.courseId);
                    const assignedCourse = myAssignedCourses.find(c =>
                        cou?.name?.toLowerCase().includes(c.courseName.toLowerCase())
                    );
                    return (
                        <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                                <div className="font-medium text-slate-900 text-xs">{stu?.name}</div>
                                <div className="font-mono text-xs text-slate-500">{r.studentReg}</div>
                            </td>
                            <td className="px-4 py-3 text-xs">{cou?.name || '—'}</td>
                            <td className="px-4 py-3 text-xs">{assignedCourse ? `Level ${assignedCourse.level}` : '—'}</td>
                            <td className="px-4 py-3 text-center font-medium">{r.exam ?? '—'}</td>
                            <td className="px-4 py-3 text-center">
                                <span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : r.grade === 'INC' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {r.grade}
                                </span>
                            </td>
                            <td className="px-4 py-3"><Badge status={r.status} /></td>
                            <td className="px-4 py-3">
                                {r.status === 'pending' ? (
                                    <button onClick={() => openEditResult(r)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                ) : <span className="text-xs text-slate-400">Locked</span>}
                            </td>
                        </tr>
                    );
                })}
            </Table>

            <Modal open={resultModal} onClose={() => setResultModal(false)} title={editingResult ? 'Edit Result' : 'Enter Result'}>
                <form onSubmit={submitResult} className="space-y-4">
                    <Field label="Student" required>
                        <Select value={rForm.studentId} onChange={e => setRForm({ ...rForm, studentId: e.target.value })} disabled={!!editingResult}>
                            <option value="">Select student</option>
                            {students.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.regNumber} - {s.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Course" required>
                        <Select value={rForm.courseId} onChange={e => setRForm({ ...rForm, courseId: e.target.value })} disabled={!!editingResult}>
                            <option value="">Select course</option>
                            {courses.filter(c => myCourseIds.includes(c.id)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Session" required>
                        <Select value={rForm.sessionId} onChange={e => setRForm({ ...rForm, sessionId: e.target.value })} disabled={!!editingResult}>
                            <option value="">Select session</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.year} </option>)}
                        </Select>
                    </Field>
                    <Field label="Exam Mark (0-100)">
                        <Input type="number" min="0" max="100" value={rForm.exam} onChange={e => setRForm({ ...rForm, exam: e.target.value })} />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setResultModal(false)}>Cancel</Button>
                        <Button type="submit">{editingResult ? 'Update' : 'Submit'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={csvOpen} onClose={() => setCsvOpen(false)} title="CSV Bulk Upload" size="lg">
                <p className="text-sm text-slate-600 mb-2">Format: <code className="bg-slate-100 px-1 rounded">regNumber,courseName,exam</code></p>
                <p className="text-xs text-slate-500 mb-2">Example: TC/2025/001,Practical,75</p>
                <textarea
                    value={csvText}
                    onChange={e => setCsvText(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
                <div className="flex justify-end gap-2 mt-3">
                    <Button variant="secondary" onClick={() => setCsvOpen(false)}>Cancel</Button>
                    <Button onClick={handleCsv}>Process CSV</Button>
                </div>
            </Modal>
        </div>
    );
};

export default InstructorResults;