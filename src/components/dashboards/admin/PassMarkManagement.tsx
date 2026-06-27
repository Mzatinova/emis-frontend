import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Table, Button, Modal, Field, Input, Toast, Badge } from '@/components/shared/UI';
import { Edit2, Save, Loader2, Search } from 'lucide-react';

interface PassMarkManagementProps {
    toast: string;
    setToast: (msg: string) => void;
}

const PassMarkManagement: React.FC<PassMarkManagementProps> = ({ toast, setToast }) => {
    const { programsList, apiRequest, refresh } = useEMIS();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCourse, setEditingCourse] = useState<any>(null);
    const [editModal, setEditModal] = useState(false);
    const [passMarkValue, setPassMarkValue] = useState<number>(50);
    const [saving, setSaving] = useState(false);

    // Get unique courses from first program (all programs have same courses)
    const courseList = useMemo(() => {
        let list: any[] = [];
        
        if (programsList && programsList.length > 0) {
            const firstProgram = programsList[0];
            if (firstProgram.courses) {
                const uniqueCourses = new Map();
                firstProgram.courses.forEach((course: any) => {
                    if (!uniqueCourses.has(course.courseName)) {
                        uniqueCourses.set(course.courseName, {
                            id: course.courseName,
                            name: course.courseName,
                            pass_mark: course.pass_mark || (course.courseName === 'Practical' ? 75 : 50),
                        });
                    }
                });
                list = Array.from(uniqueCourses.values());
            }
        }
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(c => c.name.toLowerCase().includes(term));
        }

        return list;
    }, [programsList, searchTerm]);

    const openEditModal = (course: any) => {
        setEditingCourse(course);
        setPassMarkValue(course.pass_mark || (course.name === 'Practical' ? 75 : 50));
        setEditModal(true);
    };

    const handleSavePassMark = async () => {
        if (!editingCourse) return;
        if (passMarkValue < 0 || passMarkValue > 100) {
            setToast('Pass mark must be between 0 and 100');
            return;
        }

        setSaving(true);
        try {
            await apiRequest('/pass-marks/bulk-update', 'POST', {
                course_name: editingCourse.name,
                pass_mark: passMarkValue
            });
            await refresh();
            setToast(`Pass mark for ${editingCourse.name} updated to ${passMarkValue}%`);
            setEditModal(false);
            setEditingCourse(null);
        } catch (error) {
            console.error('Failed to update pass mark:', error);
            setToast('Failed to update pass mark');
        } finally {
            setSaving(false);
        }
    };

    const getPassMarkBadge = (passMark: number) => {
        if (passMark >= 70) return <Badge status="success">{passMark}%</Badge>;
        if (passMark >= 50) return <Badge status="warning">{passMark}%</Badge>;
        return <Badge status="error">{passMark}%</Badge>;
    };

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader 
                title="Course Grading" 
                subtitle="Configure passing marks for each course"
            />

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                        placeholder="Search by course name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                {courseList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No courses found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Course</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Pass Mark</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {courseList.map(course => (
                                    <tr key={course.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{course.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            {getPassMarkBadge(course.pass_mark || (course.name === 'Practical' ? 75 : 50))}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => openEditModal(course)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                                            >
                                                <Edit2 className="w-3 h-3 inline mr-1" />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
                    Showing {courseList.length} course(s)
                </div>
            </div>

            <Modal open={editModal} onClose={() => !saving && setEditModal(false)} title="Edit Pass Mark" size="md">
                {editingCourse && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">Course:</span> {editingCourse.name}
                            </p>
                            <p className="text-sm text-slate-600">
                                <span className="font-medium">Current Pass Mark:</span> {editingCourse.pass_mark || (editingCourse.name === 'Practical' ? 75 : 50)}%
                            </p>
                        </div>

                        <Field label="New Pass Mark (%)" required>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={passMarkValue}
                                onChange={e => setPassMarkValue(parseInt(e.target.value) || 0)}
                                disabled={saving}
                            />
                        </Field>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="secondary" onClick={() => setEditModal(false)} disabled={saving}>Cancel</Button>
                            <Button onClick={handleSavePassMark} disabled={saving}>
                                {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-1" /> Save</>}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PassMarkManagement;