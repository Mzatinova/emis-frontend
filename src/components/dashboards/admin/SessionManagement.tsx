import React, { useEffect, useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge, Modal, Field, Input, Button, Table, Toast } from '@/components/shared/UI';
import { Plus, Edit2, X, Loader2 } from 'lucide-react';

const SessionManagement: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
    const { sessions, addSession, updateSession, apiRequest, refresh } = useEMIS();
    const [sessModal, setSessModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);
    const [regModal, setRegModal] = useState(false);
    const [regSession, setRegSession] = useState<any>(null);
    const [regStartDate, setRegStartDate] = useState('');
    const [regEndDate, setRegEndDate] = useState('');
    const [editYear, setEditYear] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [sessForm, setSessForm] = useState({ year: '', start_date: '', end_date: '', active: true });

    const [showCloseRegModal, setShowCloseRegModal] = useState(false);
    const [closeRegSession, setCloseRegSession] = useState<any>(null);
    const [showEndSessionModal, setShowEndSessionModal] = useState(false);
    const [endSessionTarget, setEndSessionTarget] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const convertToYMD = (dateStr: string) => {
        if (!dateStr) return '';
        let parts = dateStr.split('/');
        if (parts.length !== 3) {
            parts = dateStr.split('-');
        }
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return dateStr;
    };

    const submitSession = async (e: React.FormEvent) => {
        e.preventDefault();

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
            start_date: convertToYMD(sessForm.start_date),
            end_date: convertToYMD(sessForm.end_date),
            active: true
        });
        await refresh();
        setSessModal(false);
        setSessForm({ year: '', start_date: '', end_date: '', active: true });
        setToast('Session created');
    };

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
        setEditStartDate(session.start_date ? new Date(session.start_date).toLocaleDateString('en-GB') : '');
        setEditEndDate(session.end_date ? new Date(session.end_date).toLocaleDateString('en-GB') : '');
        setEditModal(true);
    };

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        const updates: any = {};
        if (editYear) updates.year = editYear;
        if (editStartDate) updates.start_date = convertToYMD(editStartDate);
        if (editEndDate) updates.end_date = convertToYMD(editEndDate);
        await updateSession(editingSession.id, updates);
        await refresh();
        setEditModal(false);
        setToast('Session updated');
    };

    const openRegModal = (session: any) => {
        setRegSession(session);
        setRegStartDate(session.registration_start_date ? new Date(session.registration_start_date).toLocaleDateString('en-GB') : '');
        setRegEndDate(session.registration_end_date ? new Date(session.registration_end_date).toLocaleDateString('en-GB') : '');
        setRegModal(true);
    };

    const submitRegDates = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!regStartDate || !regEndDate) {
            setToast('Please enter both start and end dates');
            return;
        }

        // Convert input dates to YYYY-MM-DD for comparison
        const startYMD = convertToYMD(regStartDate);
        const endYMD = convertToYMD(regEndDate);
        const sessionStart = regSession.start_date;
        const sessionEnd = regSession.end_date;

        // Validate registration dates are within academic session dates
        if (startYMD < sessionStart) {
            setToast(`Registration start date cannot be before session start date (${new Date(sessionStart).toLocaleDateString('en-GB')})`);
            return;
        }

        if (endYMD > sessionEnd) {
            setToast(`Registration end date cannot be after session end date (${new Date(sessionEnd).toLocaleDateString('en-GB')})`);
            return;
        }

        if (startYMD > endYMD) {
            setToast('Registration start date must be before end date');
            return;
        }

        try {
            await apiRequest(`/sessions/${regSession.id}/open-registration`, 'POST', {
                start_date: startYMD,
                end_date: endYMD
            });
            setToast('Registration opened successfully');
            setRegModal(false);
            await refresh();

        } catch (error) {
            setToast('Failed to open registration');
        }
    };

    const openCloseRegModal = (session: any) => {
        setCloseRegSession(session);
        setShowCloseRegModal(true);
    };

    const confirmCloseRegistration = async () => {
        if (!closeRegSession) return;
        setProcessing(true);
        try {
            await apiRequest(`/sessions/${closeRegSession.id}/close-registration`, 'POST');
            await refresh();
            setToast('Registration closed successfully');
            setShowCloseRegModal(false);
            setCloseRegSession(null);
        } catch (error) {
            setToast('Failed to close registration');
        } finally {
            setProcessing(false);
        }
    };

    const openEndSessionModal = (session: any) => {
        setEndSessionTarget(session);
        setShowEndSessionModal(true);
    };

  const confirmEndSession = async () => {
    if (!endSessionTarget) return;
    setProcessing(true);
    try {
        // If registration is open, close it first
        if (endSessionTarget.registration_open) {
            await apiRequest(`/sessions/${endSessionTarget.id}/close-registration`, 'POST');
            setToast('Registration closed automatically');
        }
        
        // Then end the session
        await updateSession(endSessionTarget.id, { active: false });
        await refresh();
        setToast('Session ended');
        setShowEndSessionModal(false);
        setEndSessionTarget(null);
    } catch (error) {
        setToast('Failed to end session');
    } finally {
        setProcessing(false);
    }
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
            />

            <Table headers={['Academic Year', 'Start Date', 'End Date', 'Session Status', 'Registration Open', 'Reg Start Date', 'Reg End Date', 'Actions']} rowCount={sessions.length}>
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
                            {s.registration_open ? (
                                <Badge status="success">Open</Badge>
                            ) : (
                                <Badge status="inactive">Closed</Badge>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                            {s.registration_start_date ? new Date(s.registration_start_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                            {s.registration_end_date ? new Date(s.registration_end_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                            {s.active ? (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => openEditModal(s)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                    >
                                        Edit
                                    </button>
                                    {/* Close Registration Button */}
                                    {s.registration_open ? (
                                        <button
                                            onClick={() => openCloseRegModal(s)}
                                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium"
                                        >
                                            Close Registration
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => openRegModal(s)}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium"
                                        >
                                            Open Registration
                                        </button>
                                    )}

                                    {/* End Session Button */}
                                    <button
                                        onClick={() => openEndSessionModal(s)}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
                                    >
                                        End Session
                                    </button>
                                </div>
                            ) : (
                                <span className="text-slate-400 text-xs">Inactive</span>
                            )}
                        </td>
                        {/* <td className="px-4 py-3">
                            {s.active ? (
                                <div className="flex gap-2">
                                    <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Session">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (confirm('End this session? You can start a new one after.')) {
                                                updateSession(s.id, { active: false });
                                                await refresh();
                                                setToast('Session ended');
                                            }
                                        }}
                                        className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                        title="End Session"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    {s.registration_open ? (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Close registration for this session?')) {
                                                    await apiRequest(`/sessions/${s.id}/close-registration`, 'POST');
                                                    await refresh();
                                                    setToast('Registration closed');
                                                }
                                            }}
                                            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                                        >
                                            Close Reg
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => openRegModal(s)}
                                            className="px-2 py-1 bg-emerald-500 text-white rounded text-xs"
                                        >
                                            Open Reg
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span className="text-slate-300 text-xs">Closed</span>
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
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={sessForm.start_date}
                            onChange={e => setSessForm({ ...sessForm, start_date: e.target.value })}
                        />
                    </Field>
                    <Field label="End Date" required>
                        <Input
                            type="text"
                            placeholder="DD/MM/YYYY"
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
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={editStartDate}
                            onChange={e => setEditStartDate(e.target.value)}
                        />
                    </Field>
                    <Field label="End Date">
                        <Input
                            type="text"
                            placeholder="DD/MM/YYYY"
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

            <Modal open={regModal} onClose={() => setRegModal(false)} title="Open Registration Period">
                <form onSubmit={submitRegDates} className="space-y-4">
                    <Field label="Registration Start Date" required>
                        <Input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={regStartDate}
                            onChange={e => setRegStartDate(e.target.value)}
                        />
                    </Field>
                    <Field label="Registration End Date" required>
                        <Input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={regEndDate}
                            onChange={e => setRegEndDate(e.target.value)}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setRegModal(false)}>Cancel</Button>
                        <Button type="submit">Open Registration</Button>
                    </div>
                </form>
            </Modal>
            {/* Close Registration Confirmation Modal */}
            <Modal open={showCloseRegModal} onClose={() => !processing && setShowCloseRegModal(false)} title="Confirm Close Registration" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to close registration for <strong>{closeRegSession?.year}</strong>?
                    </p>
                    <div className="bg-amber-50 p-4 rounded-lg">
                        <p className="text-sm text-amber-800">
                            Students will not be able to register for this session after registration is closed.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowCloseRegModal(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmCloseRegistration} disabled={processing}>
                            {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                            Confirm Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* End Session Confirmation Modal */}
          <Modal open={showEndSessionModal} onClose={() => !processing && setShowEndSessionModal(false)} title="Confirm End Session" size="md">
    <div className="space-y-4">
        <p className="text-sm text-slate-600">
            Are you sure you want to end <strong>{endSessionTarget?.year}</strong>?
        </p>
        <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
                This will deactivate the session. A new session can be created after ending this one.
                {endSessionTarget?.registration_open && (
                    <span className="block mt-2 font-semibold">
                        Note: Registration is currently open and will be closed automatically.
                    </span>
                )}
            </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowEndSessionModal(false)} disabled={processing}>
                Cancel
            </Button>
            <Button variant="danger" onClick={confirmEndSession} disabled={processing}>
                {processing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                Confirm End
            </Button>
        </div>
    </div>
</Modal>
        </div>
    );
};

export default SessionManagement;