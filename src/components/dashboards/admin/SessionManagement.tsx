import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge, Modal, Field, Input, Button, Table, Toast } from '@/components/shared/UI';
import { Plus, Edit2 } from 'lucide-react';

const SessionManagement: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
    const { sessions, addSession, updateSession } = useEMIS();
    const [sessModal, setSessModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);
    const [editYear, setEditYear] = useState('');
    const [sessForm, setSessForm] = useState({ year: '', active: true });

    const submitSession = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sessForm.year) { setToast('All fields required'); return; }

        // Deactivate all existing sessions first
        sessions.forEach(session => {
            if (session.active) {
                updateSession(session.id, { active: false });
            }
        });

        addSession({ year: sessForm.year, active: true });
        setSessModal(false);
        setSessForm({ year: '', active: true });
        setToast('Session created and set as current period');
    };

    const openEditModal = (session: any) => {
        setEditingSession(session);
        setEditYear(session.year);
        setEditModal(true);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editYear) { setToast('Year required'); return; }
        updateSession(editingSession.id, { year: editYear });
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
                    <Button onClick={() => setSessModal(true)}>
                        <Plus className="w-4 h-4 inline mr-1" />New Session
                    </Button>
                }
            />

            <Table headers={['Academic Year', 'Status', 'Actions']} rowCount={sessions.length}>
                {sessions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium">{s.year}</td>
                        <td className="px-4 py-3">
                            {s.active ? (
                                <Badge status="success">Active (Current Period)</Badge>
                            ) : (
                                <Badge status="inactive">Inactive</Badge>
                            )}
                        </td>
                        <td className="px-4 py-3">
                            {s.active ? (
                                <button onClick={() => openEditModal(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Edit Year">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            ) : (
                                <span className="text-slate-300 text-xs">—</span>
                            )}
                        </td>
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
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setSessModal(false)}>Cancel</Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Session Year">
                <form onSubmit={submitEdit} className="space-y-4">
                    <Field label="Academic Year" required>
                        <Input
                            value={editYear}
                            onChange={e => setEditYear(e.target.value)}
                            placeholder="e.g. 2025/2026"
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

// import React, { useState } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Badge, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
// import { Plus, Power } from 'lucide-react';

// const SessionManagement: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
//     const { sessions, addSession, updateSession } = useEMIS();
//     const [sessModal, setSessModal] = useState(false);
//     const [sessForm, setSessForm] = useState({ year: '', active: true });



//     const submitSession = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!sessForm.year) { setToast('All fields required'); return; }
//         addSession(sessForm);
//         setSessModal(false);
//         setSessForm({ year: '', active: true });
//         setToast('Session created');
//     };

//     const toggleSessionActive = (id: string) => {
//         const session = sessions.find(s => s.id === id);
//         if (session) {
//             updateSession(id, { active: !session.active });
//             setToast(`Session ${!session.active ? 'activated' : 'deactivated'}`);
//         }
//     };

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}
//             <PageHeader
//                 title="Academic Sessions"
//                 subtitle="Manage academic years and exam periods"
//                 action={
//                     <Button onClick={() => setSessModal(true)}>
//                         <Plus className="w-4 h-4 inline mr-1" />New Session
//                     </Button>
//                 }
//             />

//             <Table headers={['Academic Year', 'Status', 'Actions']} rowCount={sessions.length}>
//                 {sessions.map(s => (
//                     <tr key={s.id} className="hover:bg-slate-50">
//                         <td className="px-4 py-3 font-medium">{s.year}</td>
//                         <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
//                         <td className="px-4 py-3">
//                             <button onClick={() => toggleSessionActive(s.id)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600">
//                                 <Power className="w-4 h-4" />
//                             </button>
//                         </td>
//                     </tr>
//                 ))}
//             </Table>

//             <Modal open={sessModal} onClose={() => setSessModal(false)} title="Create Academic Session">
//                 <form onSubmit={submitSession} className="space-y-4">
//                     <Field label="Academic Year" required>
//                         <Input
//                             value={sessForm.year}
//                             onChange={e => setSessForm({ ...sessForm, year: e.target.value })}
//                             placeholder="e.g. 2025/2026"
//                         />
//                     </Field>


//                     <label className="flex items-center gap-2 text-sm">
//                         <input
//                             type="checkbox"
//                             checked={sessForm.active}
//                             onChange={e => setSessForm({ ...sessForm, active: e.target.checked })}
//                         />
//                         Active
//                     </label>
//                     <div className="flex justify-end gap-2">
//                         <Button type="button" variant="secondary" onClick={() => setSessModal(false)}>Cancel</Button>
//                         <Button type="submit">Create</Button>
//                     </div>
//                 </form>
//             </Modal>
//         </div>
//     );
// };

// export default SessionManagement;