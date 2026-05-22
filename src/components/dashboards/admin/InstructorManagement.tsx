import React, { useState, useMemo, useEffect } from 'react';
import { useEMIS, User } from '@/contexts/EMISContext';
import { PageHeader, Modal, Field, Select, Button, Table, Toast, Badge, Input } from '@/components/shared/UI';
import { Plus, Edit2, Search, Power, Users, BookOpen, X, Check, Loader2 } from 'lucide-react';

interface ProgramCourse {
    level: number;
    courseName: string;
    instructorId: string | null;
}

interface Program {
    id: string;
    name: string;
    description: string;
    courses: ProgramCourse[];
}

interface InstructorManagementProps {
    toast: string;
    setToast: (msg: string) => void;
}

const InstructorManagement: React.FC<InstructorManagementProps> = ({ toast, setToast }) => {
//    const { users, courses, apiRequest } = useEMIS();
const { users, courses, apiRequest, programsList, fetchProgramsGlobal } = useEMIS();

    const [instructorSearch, setInstructorSearch] = useState('');
    const [assignModal, setAssignModal] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);

    // Load programs from localStorage
    // const [programs, setPrograms] = useState<Program[]>([]);

// useEffect(() => {
//     const fetchPrograms = async () => {
//         try {
//             const response = await apiRequest('/programs');
//             if (response.data) {
//                 setPrograms(response.data);
//             }
//         } catch (error) {
//             console.error('Failed to fetch programs:', error);
//         }
//     };
//     fetchPrograms();
// }, []);

    const instructors = users.filter(u => u.role === 'instructor' && u.active);

    const filteredInstructors = useMemo(() =>
        instructors.filter(i =>
            i.name.toLowerCase().includes(instructorSearch.toLowerCase()) ||
            i.email?.toLowerCase().includes(instructorSearch.toLowerCase())
        ), [instructors, instructorSearch]
    );

    // Get all assignments for an instructor from programs
    const getInstructorAssignments = (instructorId: string) => {
        const assignments: { programName: string; level: number; courseName: string }[] = [];
        programsList.forEach(program => {
            program.courses.forEach(course => {
                if (course.instructorId === instructorId) {
                    assignments.push({
                        programName: program.name,
                        level: course.level,
                        courseName: course.courseName,
                    });
                }
            });
        });
        return assignments;
    };

    // Save updated programs back to localStorage
    // const savePrograms = (updatedPrograms: Program[]) => {
    //     setPrograms(updatedPrograms);
    //     localStorage.setItem('emis_programs', JSON.stringify(updatedPrograms));
    // };

    const removeInstructorFromAllCourses = async (instructorId: string) => {
    try {
        await apiRequest('/instructor/assign', 'POST', {
            instructorId: instructorId,
            assignments: []
        });
         await fetchProgramsGlobal();
        setToast(`Removed ${selectedInstructor?.name} from all courses`);
        setAssignModal(false);
    } catch (error) {
        setToast('Failed to remove assignments');
    }
};

    // Remove instructor from all courses
    // const removeInstructorFromAllCourses = (instructorId: string) => {
    //     const updatedPrograms = programs.map(program => ({
    //         ...program,
    //         courses: program.courses.map(course =>
    //             course.instructorId === instructorId
    //                 ? { ...course, instructorId: null }
    //                 : course
    //         ),
    //     }));
    //     savePrograms(updatedPrograms);
    //     setToast(`Removed ${selectedInstructor?.name} from all courses`);
    //     setAssignModal(false);
    // };

    // Open assign modal for an instructor
    const openAssignModal = (instructor: User) => {
        setSelectedInstructor(instructor);
        setAssignModal(true);
    };

    // Get current assignments for the selected instructor
    const getCurrentAssignmentsForInstructor = () => {
        if (!selectedInstructor) return {};
        const assignments: Record<string, boolean> = {};
        programsList.forEach(program => {
            program.courses.forEach(course => {
                if (course.instructorId === selectedInstructor.id) {
                    const key = `${program.id}-${course.level}-${course.courseName}`;
                    assignments[key] = true;
                }
            });
        });
        return assignments;
    };

    const [tempAssignments, setTempAssignments] = useState<Record<string, boolean>>({});

    const startAssignment = () => {
        setTempAssignments(getCurrentAssignmentsForInstructor());
    };

    const toggleCourseAssignment = (programId: string, level: number, courseName: string) => {
        const key = `${programId}-${level}-${courseName}`;
        setTempAssignments(prev => ({ ...prev, [key]: !prev[key] }));
    };

const saveAssignments = async () => {
    if (!selectedInstructor) return;

    const assignments = [];
    Object.entries(tempAssignments).forEach(([key, isAssigned]) => {
        if (isAssigned) {
            const [programId, levelStr, ...courseNameParts] = key.split('-');
            const level = parseInt(levelStr);
            const courseName = courseNameParts.join('-');
            assignments.push({ programId, level, courseName });
        }
    });
    

    try {
        await apiRequest('/instructor/assign', 'POST', {
            instructorId: selectedInstructor.id,
            assignments
        });
        await fetchProgramsGlobal();
        setToast(`Assignments saved for ${selectedInstructor.name}`);
        setAssignModal(false);
    } catch (error) {
        setToast('Failed to save assignments');
    }
};

if (!programsList || programsList.length === 0) {
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
                title="Instructor Management"
                subtitle="View instructors and assign them to courses at specific levels"
            />

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <Input
                        placeholder="Search by name or email"
                        value={instructorSearch}
                        onChange={e => setInstructorSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {filteredInstructors.map(instructor => {
                    const assignments = getInstructorAssignments(instructor.id);
                    return (
                        <div key={instructor.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">{instructor.name}</h3>
                                    <p className="text-sm text-slate-500">{instructor.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge status={instructor.active ? 'active' : 'inactive'}>
                                        {instructor.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <button
                                        onClick={() => openAssignModal(instructor)}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1"
                                    >
                                        <BookOpen className="w-3 h-3" />
                                        Assign Courses
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                {assignments.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No courses assigned</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {assignments.map((ass, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-lg p-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-slate-800">{ass.programName}</p>
                                                        <p className="text-sm text-slate-600">
                                                            Level {ass.level} - {ass.courseName}
                                                        </p>
                                                    </div>
                                                    <Badge status="active">Assigned</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Assign Courses Modal */}
            {selectedInstructor && (
                <Modal
                    open={assignModal}
                    onClose={() => setAssignModal(false)}
                    title={`Assign Courses to: ${selectedInstructor.name}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        <div className="max-h-[60vh] overflow-y-auto space-y-6">
                            {programsList.map(program => (
                                <div key={program.id} className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-2 font-semibold text-slate-800">
                                        {program.name}
                                    </div>
                                    <div className="p-3">
                                        {[1, 2, 3, 4].map(level => {
                                            const levelCourses = program.courses.filter(c => c.level === level);
                                            return (
                                                <div key={level} className="mb-3 last:mb-0">
                                                    <div className="font-medium text-slate-700 mb-2 text-sm">Level {level}</div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {levelCourses.map(course => {
                                                            const key = `${program.id}-${course.level}-${course.courseName}`;
                                                            const isAssigned = tempAssignments[key] || false;
                                                            return (
                                                                <button
                                                                    key={course.courseName}
                                                                    type="button"
                                                                    onClick={() => toggleCourseAssignment(program.id, course.level, course.courseName)}
                                                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${isAssigned
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                                        }`}
                                                                >
                                                                    {course.courseName}
                                                                    {isAssigned && <Check className="w-3 h-3 ml-1" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={() => removeInstructorFromAllCourses(selectedInstructor.id)}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Remove from All
                            </button>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" onClick={() => setAssignModal(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => { saveAssignments(); }} onMouseEnter={startAssignment}>
                                    Save Assignments
                                </Button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default InstructorManagement;