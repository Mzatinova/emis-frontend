import React, { useState } from 'react';
import { useEMIS, Role, User } from '@/contexts/EMISContext';
import { PageHeader, Badge, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export const TechnicianStaff: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
    const { users, addUser, updateUser, deleteUser } = useEMIS();
    const [modalOpen, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [deletingUserName, setDeletingUserName] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [editing, setEditing] = useState<User | null>(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'administrator' as Role, active: true });

    // const staffUsers = users.filter(u => u.role !== 'technician');

    const allStaffUsers = users.filter(u => u.role !== 'technician');

    const staffUsers = allStaffUsers.filter(u => {
        // Filter by name search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            if (!u.name.toLowerCase().includes(term)) return false;
        }
        // Filter by role
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        return true;
    });

    // const allStaffUsers = users.filter(u => u.role !== 'technician');

    // const staffUsers = allStaffUsers.filter(u => {
    //     if (!searchTerm) return true;
    //     const term = searchTerm.toLowerCase();
    //     return u.name.toLowerCase().includes(term) || u.role.toLowerCase().includes(term);
    // });
    const openNew = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'administrator', active: true }); setModalOpen(true); };
    const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email || '', password: '', role: u.role, active: u.active }); setModalOpen(true); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email) { setToast('Please fill name and email'); return; }

        // For new user, password is required
        if (!editing && !form.password) { setToast('Password is required for new users'); return; }

        // For editing, only include password if provided
        const submitData = { ...form };
        if (editing && !submitData.password) {
            delete submitData.password;
        }

        if (editing) {
            updateUser(editing.id, submitData);
            setToast('User updated');
        }
        else {
            addUser(submitData);
            setToast('User created');
        }
        setModalOpen(false);
    };
    // const submit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!form.name || !form.email || !form.password) { setToast('Please fill all fields'); return; }
    //     if (editing) { updateUser(editing.id, form); setToast('User updated'); }
    //     else { addUser(form); setToast('User created'); }
    //     setModalOpen(false);
    // };

    // const handleDelete = (id: string) => { if (confirm('Delete this user?')) { deleteUser(id); setToast('User deleted'); } };
    const openDeleteModal = (id: string, name: string) => {
        setDeletingUserId(id);
        setDeletingUserName(name);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingUserId) return;
        setDeleting(true);
        try {
            await deleteUser(deletingUserId);
            setToast('User deleted');
            setShowDeleteModal(false);
            setDeletingUserId(null);
            setDeletingUserName('');
        } catch (error) {
            setToast('Failed to delete user');
        } finally {
            setDeleting(false);
        }
    };
    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            {/* <PageHeader title="Staff User Management" subtitle="Create and manage staff accounts (Admin, Instructor, Accounts)"

                action={<Button onClick={openNew}><Plus className="w-4 h-4 inline mr-1" />
                
                New Staff User</Button>} /> */}
            <PageHeader title="Staff User Management" subtitle="Create and manage staff accounts (Admin, Instructor, Accounts)"
                action={<Button onClick={openNew}><Plus className="w-4 h-4 inline mr-1" />New Staff User</Button>} />

            <div className="mb-4 flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by name..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-48">
                    <Select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="administrator">Administrator</option>
                        <option value="instructor">Instructor</option>
                        <option value="accounts">Accounts</option>
                    </Select>
                </div>
            </div>

            {/* <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by name or role..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div> */}
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
                                {/* <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button> */}
                                <button onClick={() => openDeleteModal(u.id, u.name)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff User' : 'Create Staff User'}>
                <form onSubmit={submit} className="space-y-4">
                    <Field label="Full Name" required><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                    <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
                    {/* <Field label="Password" required><Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field> */}
                    <Field label="Password" required={!editing}>
                        <Input
                            type="text"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder={editing ? 'Leave blank to keep current' : 'Enter password'}
                        />
                    </Field>
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
            {/* Delete Confirmation Modal */}
            <Modal open={showDeleteModal} onClose={() => !deleting && setShowDeleteModal(false)} title="Confirm Delete" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Are you sure you want to delete <strong>{deletingUserName}</strong>?
                    </p>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-800">
                            This action cannot be undone. The user will be permanently removed from the system.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-1" /> : null}
                            Confirm Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TechnicianStaff;