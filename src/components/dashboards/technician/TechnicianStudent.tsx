import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useEMIS, Student } from '@/contexts/EMISContext';
import { PageHeader, Badge, Modal, Field, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
import { Plus, Edit2, Power, Search, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export const TechnicianStudent: React.FC<{ toast: string; setToast: (msg: string) => void }> = ({ toast, setToast }) => {
    const { students, addStudent, updateStudent, apiRequest } = useEMIS();
    const [studentModal, setStudentModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [sForm, setSForm] = useState({ name: '', password: '', program: '', level: 'Level 1', active: true, email: '' });
    const [studentSearch, setStudentSearch] = useState('');
    const [programs, setPrograms] = useState<{ id: string, name: string }[]>([]);

    // Bulk upload state
    const [bulkModal, setBulkModal] = useState(false);
    const [csvText, setCsvText] = useState('name,program,level,email\nJohn Doe,Electrical Engineering,Year 1,john@example.com\nJane Smith,Mechanical Engineering,Year 2,jane@example.com');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fileName, setFileName] = useState('');


    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const response = await apiRequest('/programs');
                if (response.data) {
                    setPrograms(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch programs:', error);
            }
        };
        fetchPrograms();
    }, []);

    const openNewStudent = () => {
        setEditingStudent(null);
        setSForm({ name: '', password: '', program: '', level: 'Level 1', active: true, email: '' });
        setStudentModal(true);
    };

    const openEditStudent = (s: Student) => {
        setEditingStudent(s);
        setSForm({ name: s.name, password: '', program: s.program || '', level: s.level || 'Level 1', active: s.active, email: s.email || '' });
        setStudentModal(true);
    };

    const submitStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sForm.name) { setToast('Name required'); return; }
        if (editingStudent) {
            updateStudent(editingStudent.id, sForm);
            setToast('Student updated');
        } else {
            addStudent(sForm as any);
            setToast('Student registered with auto-generated reg number');
        }
        setStudentModal(false);
    };

    const toggleStudentActive = (s: Student) => {
        updateStudent(s.id, { active: !s.active });
        setToast(`Student ${!s.active ? 'activated' : 'deactivated'}`);
    };

    const handleBulkUpload = () => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Required headers check
        if (!headers.includes('name')) {
            setToast('CSV must have "name" column');
            return;
        }

        setUploading(true);
        let added = 0;
        let failed = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const studentData: any = {};

            headers.forEach((header, idx) => {
                if (header === 'name') studentData.name = values[idx];
                if (header === 'program') studentData.program = values[idx];
                if (header === 'level') studentData.level = values[idx];
                if (header === 'email') studentData.email = values[idx];
                if (header === 'password') studentData.password = values[idx];
            });

            if (studentData.name) {
                studentData.password = studentData.password || 'student123';
                studentData.active = true;
                try {
                    addStudent(studentData);
                    added++;
                } catch (err) {
                    failed++;
                }
            } else {
                failed++;
            }
        }

        setUploading(false);
        setBulkModal(false);
        setCsvText('name,program,level,email\nJohn Doe,Electrical Engineering,Year 1,john@example.com\nJane Smith,Mechanical Engineering,Year 2,jane@example.com');
        setToast(`Bulk upload complete: ${added} students added, ${failed} failed`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = evt.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            setPreviewData(XLSX.utils.sheet_to_json(sheet));
        };
        reader.readAsBinaryString(file);
    };

    const processBulkUpload = () => {
        if (previewData.length === 0) return;
        setUploading(true);
        let added = 0;
        previewData.forEach((row: any) => {
            const studentData = {
                name: row.name || row.Name || row.NAME,
                program: row.program || row.Program,
                level: row.level || row.Level,
                email: row.email || row.Email,
                password: row.password || 'student123',
                active: true
            };
            if (studentData.name) {
                addStudent(studentData);
                added++;
            }
        });
        setUploading(false);
        setBulkModal(false);
        setPreviewData([]);
        setFileName('');
        setToast(`${added} students added`);
    };

    const filteredStudents = useMemo(() =>
        students.filter(s =>
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.regNumber.toLowerCase().includes(studentSearch.toLowerCase())
        ), [students, studentSearch]
    );

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader title="Student Management" subtitle="Create and manage student accounts (Technician responsibility)"
                action={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setBulkModal(true)}>
                            <Upload className="w-4 h-4 inline mr-1" />Bulk Upload
                        </Button>
                        <Button onClick={openNewStudent}>
                            <Plus className="w-4 h-4 inline mr-1" />Register Student
                        </Button>
                    </div>
                } />

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                        placeholder="Search by name or registration number"
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status', 'Actions']} rowCount={filteredStudents.length}>
                {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                        <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
                        <td className="px-4 py-3">
                            <div className="flex gap-2">
                                <button onClick={() => openEditStudent(s)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => toggleStudentActive(s)} className="p-1.5 hover:bg-slate-100 rounded text-amber-600" title="Toggle active"><Power className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {/* Single Student Modal */}
            <Modal open={studentModal} onClose={() => setStudentModal(false)} title={editingStudent ? 'Edit Student' : 'Register New Student'}>
                <form onSubmit={submitStudent} className="space-y-4">
                    <Field label="Full Name" required><Input value={sForm.name} onChange={e => setSForm({ ...sForm, name: e.target.value })} /></Field>
                    <Field label="Email"><Input type="email" value={sForm.email} onChange={e => setSForm({ ...sForm, email: e.target.value })} placeholder="optional" /></Field>
                    <Field label="Program">
                        <Select value={sForm.program} onChange={e => setSForm({ ...sForm, program: e.target.value })}>
                            <option value="">-- Select Program --</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Level">
                        <Select value={sForm.level} onChange={e => setSForm({ ...sForm, level: e.target.value })}>
                            <option>Level 1</option><option>Level 2</option><option>Level 3</option><option>Level 4</option>
                        </Select>
                    </Field>
                    <Field label="Password" required={!editingStudent}><Input type="text" value={sForm.password} onChange={e => setSForm({ ...sForm, password: e.target.value })} placeholder={editingStudent ? 'Leave blank to keep current' : 'student123'} /></Field>
                    {!editingStudent && <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded">A registration number will be auto-generated.</p>}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sForm.active} onChange={e => setSForm({ ...sForm, active: e.target.checked })} />Active</label>
                    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setStudentModal(false)}>Cancel</Button><Button type="submit">{editingStudent ? 'Update' : 'Register'}</Button></div>
                </form>
            </Modal>



            {/* Bulk Upload Modal - Excel/CSV Support */}
            <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Bulk Upload Students (Excel/CSV)" size="lg">
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                        <p className="font-medium mb-1">Supported Files: <strong>.xlsx, .xls, .csv</strong></p>
                        <p className="text-xs text-slate-600">Required column: <strong>name</strong></p>
                        <p className="text-xs text-slate-600">Optional: program, level, email, password</p>
                        <p className="text-xs text-slate-600">Default password: student123</p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                    />

                    {fileName && (
                        <div className="text-sm text-slate-600">
                            File: {fileName} ({previewData.length} records)
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setBulkModal(false)}>Cancel</Button>
                        <Button onClick={processBulkUpload} disabled={uploading || previewData.length === 0}>
                            {uploading ? 'Uploading...' : 'Upload Students'}
                        </Button>
                    </div>
                </div>
            </Modal>


        </div>
    );
};

export default TechnicianStudent;
