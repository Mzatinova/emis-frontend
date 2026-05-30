import React, { useState } from 'react';
import { useEMIS, Role, User } from '@/contexts/EMISContext';
import { PageHeader, Badge, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const TechnicianStaff: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
    const { users, addUser, updateUser, deleteUser } = useEMIS();
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'administrator' as Role, active: true });

    const staffUsers = users.filter(u => u.role !== 'technician');

    const openNew = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'administrator', active: true }); setModalOpen(true); };
    const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email || '', password: '', role: u.role, active: u.active }); setModalOpen(true); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password) { setToast('Please fill all fields'); return; }
        if (editing) { updateUser(editing.id, form); setToast('User updated'); }
        else { addUser(form); setToast('User created'); }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => { if (confirm('Delete this user?')) { deleteUser(id); setToast('User deleted'); } };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader title="Staff User Management" subtitle="Create and manage staff accounts (Admin, Instructor, Accounts)"
                action={<Button onClick={openNew}><Plus className="w-4 h-4 inline mr-1" />New Staff User</Button>} />
            <Table headers={['Name', 'Email', 'Role', 'Status', 'Created', 'Actions']} rowCount={staffUsers.length}>
                {staffUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3"><Badge status={u.role}>{u.role}</Badge></td>
                        <td className="px-4 py-3"><Badge status={u.active ? 'active' : 'inactive'} /></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-4 py-3">
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff User' : 'Create Staff User'}>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Full Name" required><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                    <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
                    <Field label="Password" required><Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
                    <Field label="Role" required>
                        <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                            <option value="administrator">Administrator</option>
                            <option value="instructor">Instructor</option>
                            <option value="accounts">Accounts</option>
                        </Select>
                    </Field>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                        Active
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default TechnicianStaff;