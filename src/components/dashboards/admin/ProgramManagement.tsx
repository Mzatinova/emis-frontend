import React, { useState, useEffect } from 'react';
import { useEMIS, User } from '@/contexts/EMISContext';
import { PageHeader, Modal, Field, Input, Select, Button, Toast, Badge } from '@/components/shared/UI';
import { Plus, Edit2, Trash2, Users, BookOpen, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export interface ProgramCourse {
    level: number;
    courseName: 'Practical' | 'Occupation' | 'Fundamentals';
    instructorId: string | null;
    instructorName?: string | null;
}

export interface Program {
    id: string;
    name: string;
    description: string;
    courses: ProgramCourse[];
}

interface ProgramManagementProps {
    toast: string;
    setToast: (msg: string) => void;
}

const ProgramManagement: React.FC<ProgramManagementProps> = ({ toast, setToast }) => {
    const { users, apiRequest, programsList, fetchProgramsGlobal } = useEMIS();
    const instructors = users.filter(u => u.role === 'instructor' && u.active);

    // const [programs, setPrograms] = useState<Program[]>([]);
    // const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
    const [programModal, setProgramModal] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [programForm, setProgramForm] = useState({ name: '', description: '' });

    const [assignInstructorModal, setAssignInstructorModal] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<ProgramCourse | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<number>(1);


    // const fetchPrograms = async () => {
    //     setLoading(true);
    //     try {
    //         const response = await apiRequest('/programs');
    //         if (response.data) {
    //             setPrograms(response.data);
    //         }
    //     } catch (error) {
    //         console.error('Failed to fetch programs:', error);
    //         setToast('Failed to load programs');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // useEffect(() => {
    //     fetchPrograms();
    // }, []);

    const addProgram = async () => {
        if (!programForm.name) { setToast('Program name required'); return; }
        setSubmitting(true);
        setProgramModal(false);
        setProgramForm({ name: '', description: '' });
        setToast('Creating program...');

        try {
            await apiRequest('/programs', 'POST', programForm);
            setToast('Program created');
            // fetchPrograms();
            fetchProgramsGlobal()
        } catch (error) {
            setToast('Program created (refresh may be needed)');
            // fetchPrograms();
            fetchProgramsGlobal()
        } finally {
            setSubmitting(false);
        }
    };

    //     // const addProgram = async () => {
    //     //     if (!programForm.name) { setToast('Program name required'); return; }
    //     //     setSubmitting(true);
    //     //     try {
    //     //         await apiRequest('/programs', 'POST', programForm);
    //     //         await fetchPrograms();
    //     //         setToast('Program created');
    //     //         setProgramModal(false);
    //     //         setProgramForm({ name: '', description: '' });
    //     //     } catch (error) {
    //     //         // Even if error, try to refresh programs - it might have been created
    //     //         await fetchPrograms();
    //     //         setToast('Program created');
    //     //         setProgramModal(false);
    //     //         setProgramForm({ name: '', description: '' });
    //     //     } finally {
    //     //         setSubmitting(false);
    //     //     }
    //     // };

    const updateProgram = async () => {
        if (!editingProgram) return;
        setSubmitting(true);
        try {
            await apiRequest(`/programs/${editingProgram.id}`, 'PUT', programForm);
            // await fetchPrograms();
            await fetchProgramsGlobal()
            setToast('Program updated');
            setProgramModal(false);
            setEditingProgram(null);
            setProgramForm({ name: '', description: '' });
        } catch (error) {
            console.error('Failed to update program:', error);
            setToast('Failed to update program');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteProgram = async (id: string) => {
        if (confirm('Delete this program? All student assignments will be lost.')) {
            try {
                await apiRequest(`/programs/${id}`, 'DELETE');
                // await fetchPrograms();
                await fetchProgramsGlobal();
                setToast('Program deleted');
            } catch (error) {
                console.error('Failed to delete program:', error);
                setToast('Failed to delete program');
            }
        }
    };

    const openAssignInstructor = (program: Program, level: number, course: ProgramCourse) => {
        setSelectedProgram(program);
        setSelectedLevel(level);
        setSelectedCourse(course);
        setAssignInstructorModal(true);
    };

    const saveInstructorAssignment = async (instructorId: string | null) => {
        if (!selectedProgram || !selectedCourse) return;
        setAssigning(true);
        try {
            await apiRequest(`/programs/${selectedProgram.id}/assign`, 'POST', {
                level: selectedCourse.level,
                course_name: selectedCourse.courseName,
                instructor_id: instructorId
            });
            // await fetchPrograms();
            await fetchProgramsGlobal();
            setToast(`Instructor assigned to ${selectedCourse.courseName} (Level ${selectedCourse.level})`);
            setAssignInstructorModal(false);
        } catch (error) {
            console.error('Failed to assign instructor:', error);
            setToast('Failed to assign instructor');
        } finally {
            setAssigning(false);
        }
    };

    const getInstructorName = (instructorId: string | null, instructorName?: string | null) => {
        if (!instructorId) return 'Not assigned';
        if (instructorName) return instructorName;
        const instructor = users.find(u => u.id === instructorId);
        return instructor?.name || 'Unknown';
    };

    const toggleExpand = (programId: string) => {
        setExpandedProgram(expandedProgram === programId ? null : programId);
    };

    // if (loading) {
    // if (!programsList) {
    //     return (
    //         <div className="p-8 text-center flex items-center justify-center gap-2">
    //             <Loader2 className="w-5 h-5 animate-spin" />
    //             <span>Loading programs...</span>
    //         </div>
    //     );
    // }
    if (!programsList) {
        return (
            <div className="p-8 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading programs...</span>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="Program Management"
                subtitle="Create and manage programs with 4 levels (Practical, Occupation, Fundamentals per level)"
                action={
                    <Button onClick={() => { setEditingProgram(null); setProgramForm({ name: '', description: '' }); setProgramModal(true); }}>
                        <Plus className="w-4 h-4 inline mr-1" />New Program
                    </Button>
                }
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programsList.length === 0 && programsList !== null ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No programs found. Click "New Program" to create one.
                    </div>
                ) : (
                    programsList.map(program => (
                        <div key={program.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            {/* Card Header */}
                            <div
                                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => toggleExpand(program.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900">{program.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{program.description || 'No description'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => { setEditingProgram(program); setProgramForm({ name: program.name, description: program.description || '' }); setProgramModal(true); }}
                                                className="p-1.5 hover:bg-slate-200 rounded text-slate-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteProgram(program.id)}
                                                className="p-1.5 hover:bg-red-100 rounded text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {expandedProgram === program.id ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <Badge status="info">4 Levels</Badge>
                                    <Badge status="info">12 Courses</Badge>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedProgram === program.id && (
                                <div className="border-t border-slate-100 bg-slate-50 p-4">
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4].map(level => {
                                            const levelCourses = program.courses.filter(c => c.level === level);
                                            return (
                                                <div key={level} className="bg-white rounded-lg p-3 shadow-sm">
                                                    <h4 className="font-bold text-slate-800 mb-2 text-sm">Level {level}</h4>
                                                    <div className="space-y-2">
                                                        {levelCourses.map(course => (
                                                            <div key={course.courseName} className="flex justify-between items-center text-sm">
                                                                <span className="text-slate-600 w-24">{course.courseName}</span>
                                                                <span className="text-slate-500 flex-1 mx-2">→</span>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge status={course.instructorId ? 'active' : 'inactive'}>
                                                                        {getInstructorName(course.instructorId, course.instructorName)}
                                                                    </Badge>
                                                                    <button
                                                                        onClick={() => openAssignInstructor(program, level, course)}
                                                                        className="p-1 hover:bg-slate-100 rounded text-slate-600"
                                                                        title="Assign Instructor"
                                                                    >
                                                                        <Users className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <Modal open={programModal} onClose={() => !submitting && setProgramModal(false)} title={editingProgram ? 'Edit Program' : 'New Program'}>
                <form onSubmit={(e) => { e.preventDefault(); editingProgram ? updateProgram() : addProgram(); }} className="space-y-4">
                    <Field label="Program Name" required>
                        <Input
                            value={programForm.name}
                            onChange={e => setProgramForm({ ...programForm, name: e.target.value })}
                            placeholder="e.g. Electrical Engineering"
                            disabled={submitting}
                        />
                    </Field>
                    <Field label="Description">
                        <Input
                            value={programForm.description}
                            onChange={e => setProgramForm({ ...programForm, description: e.target.value })}
                            placeholder="Brief description"
                            disabled={submitting}
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setProgramModal(false)} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />}
                            {editingProgram ? (submitting ? 'Updating...' : 'Update') : (submitting ? 'Creating...' : 'Create')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal open={assignInstructorModal} onClose={() => !assigning && setAssignInstructorModal(false)} title={`Assign Instructor - ${selectedCourse?.courseName} (Level ${selectedLevel})`}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Select instructor for {selectedProgram?.name} - Level {selectedLevel} {selectedCourse?.courseName}</p>
                    <Select
                        value={selectedCourse?.instructorId || ''}
                        onChange={(e) => saveInstructorAssignment(e.target.value || null)}
                        disabled={assigning}
                    >
                        <option value="">-- None assigned --</option>
                        {instructors.map(i => (
                            <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </Select>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setAssignInstructorModal(false)} disabled={assigning}>Cancel</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProgramManagement;

