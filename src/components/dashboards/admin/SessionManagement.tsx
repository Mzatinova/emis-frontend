import React, { useEffect, useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge, Modal, Field, Input, Button, Table, Toast } from '@/components/shared/UI';
import { Plus, Edit2, X } from 'lucide-react';

const SessionManagement: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
    const { sessions, addSession, updateSession } = useEMIS();
    const [sessModal, setSessModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);
    const [editYear, setEditYear] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [sessForm, setSessForm] = useState({ year: '', start_date: '', end_date: '', active: true });
    const submitSession = (e: React.FormEvent) => {
        e.preventDefault();
        // if (!sessForm.year || !sessForm.start_date || !sessForm.end_date) {
        //     setToast('All fields required');
        //     return;
        // }
        // Check if active session exists
        if (sessions.some(s => s.active)) {
            setToast('Cannot create new session. End the current session first.');
            setSessModal(false);
            return;
        }

        if (!sessForm.year || !sessForm.start_date || !sessForm.end_date) {
            setToast('All fields required');
            return;
        }

        addSession({
            year: sessForm.year,
            start_date: sessForm.start_date,
            end_date: sessForm.end_date,
            active: true
        });
        setSessModal(false);
        setSessForm({ year: '', start_date: '', end_date: '', active: true });
        setToast('Session created');
    };

    // useEffect(() => {
    //     const today = new Date();
    //     sessions.forEach(session => {
    //         if (session.active && session.end_date && new Date(session.end_date) < today) {
    //             updateSession(session.id, { active: false });
    //         }
    //     });
    // }, [sessions, updateSession]);

    useEffect(() => {
        const today = new Date();
        const checkAndEndSessions = async () => {
            for (const session of sessions) {
                if (session.active && session.end_date && new Date(session.end_date) < today) {
                    await updateSession(session.id, { active: false });
                }
            }
        };
        checkAndEndSessions();
    }, [sessions, updateSession]);

    const openEditModal = (session: any) => {
        setEditingSession(session);
        setEditYear(session.year);
        setEditStartDate(session.start_date || '');
        setEditEndDate(session.end_date || '');
        setEditModal(true);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        const updates: any = {};
        if (editYear) updates.year = editYear;
        if (editStartDate) updates.start_date = editStartDate;
        if (editEndDate) updates.end_date = editEndDate;

        updateSession(editingSession.id, updates);
        setEditModal(false);
        setToast('Session updated');
    };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Academic Sessions"
                subtitle="Only one active session allowed (current period)"
                action={
                    sessions.some(s => s.active) ? (
                        <Button disabled className="opacity-50 cursor-not-allowed" title="Cannot create new session while current session is active">
                            <Plus className="w-4 h-4 inline mr-1" />New Session
                        </Button>
                    ) : (
                        <Button onClick={() => setSessModal(true)}>
                            <Plus className="w-4 h-4 inline mr-1" />New Session
                        </Button>
                    )
                }
            // action={
            //     <Button onClick={() => setSessModal(true)}>
            //         <Plus className="w-4 h-4 inline mr-1" />New Session
            //     </Button>
            // }
            />

            <Table headers={['Academic Year', 'Start Date', 'End Date', 'Status', 'Actions']} rowCount={sessions.length}>
                {sessions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{s.year}</td>
                        <td className="px-4 py-3">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">{s.end_date ? new Date(s.end_date).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">
                            {s.active ? (
                                <Badge status="success">Active (Current Period)</Badge>
                            ) : (
                                <Badge status="inactive">Inactive</Badge>
                            )}
                        </td>
                        <td className="px-4 py-3">
                            {s.active ? (
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('End this session? You can start a new one after.')) {
                                                updateSession(s.id, { active: false });
                                                setToast('Session ended');
                                            }
                                        }}
                                        className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                        title="End Session"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <span className="text-slate-300 text-xs">—</span>
                            )}
                        </td>
                        {/* <td className="px-4 py-3">
                            {s.active ? (
                                <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-slate-300 text-xs">—</span>
                            )}
                        </td> */}
                    </tr>
                ))}
            </Table>

            <Modal open={sessModal} onClose={() => setSessModal(false)} title="Create Academic Session">
                <form onSubmit={submitSession} className="space-y-4">
                    <Field label="Academic Year" required>
                        <Input
                            value={sessForm.year}
                            onChange={e => setSessForm({ ...sessForm, year: e.target.value })}
                            placeholder="e.g. 2025/2026"
                        />
                    </Field>
                    <Field label="Start Date" required>
                        <Input
                            type="date"
                            value={sessForm.start_date}
                            onChange={e => setSessForm({ ...sessForm, start_date: e.target.value })}
                        />
                    </Field>
                    <Field label="End Date" required>
                        <Input
                            type="date"
                            value={sessForm.end_date}
                            onChange={e => setSessForm({ ...sessForm, end_date: e.target.value })}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setSessModal(false)}>Cancel</Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Session">
                <form onSubmit={submitEdit} className="space-y-4">
                    <Field label="Academic Year">
                        <Input
                            value={editYear}
                            onChange={e => setEditYear(e.target.value)}
                            placeholder="e.g. 2025/2026"
                        />
                    </Field>
                    <Field label="Start Date">
                        <Input
                            type="date"
                            value={editStartDate}
                            onChange={e => setEditStartDate(e.target.value)}
                        />
                    </Field>
                    <Field label="End Date">
                        <Input
                            type="date"
                            value={editEndDate}
                            onChange={e => setEditEndDate(e.target.value)}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SessionManagement;