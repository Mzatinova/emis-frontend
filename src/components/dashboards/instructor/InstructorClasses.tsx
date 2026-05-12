import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge, Table, Input, Toast } from '@/components/shared/UI';
import { BookOpen, Users, Search, GraduationCap } from 'lucide-react';

interface InstructorClassesProps {
    toast: string;
    setToast: (msg: string) => void;
    myAssignedCourses: { programName: string; level: number; courseName: string }[];
}

const InstructorClasses: React.FC<InstructorClassesProps> = ({ toast, setToast, myAssignedCourses }) => {
    const { students } = useEMIS();
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Group assigned courses into boxes
    const assignedBoxes = useMemo(() => {
        return myAssignedCourses.map(course => ({
            id: `${course.courseName}-${course.level}`,
            courseName: course.courseName,
            level: course.level,
            programName: course.programName,
            fullName: `${course.courseName} - Level ${course.level}`
        }));
    }, [myAssignedCourses]);

    // Get students for selected class
    const studentsInClass = useMemo(() => {
        if (!selectedClass) return [];

        return students.filter(s =>
            s.active &&
            s.program === selectedClass.programName &&
            s.level === `Year ${selectedClass.level}`
        );
    }, [selectedClass, students]);

    const filteredStudents = studentsInClass.filter(s =>
        !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If a class is selected, show students table
    if (selectedClass) {
        return (
            <div>
                {toast && <Toast message={toast} onClose={() => setToast('')} />}

                <button
                    onClick={() => setSelectedClass(null)}
                    className="mb-4 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                    ← Back to My Classes
                </button>

                <PageHeader
                    title={selectedClass.fullName}
                    subtitle={`${filteredStudents.length} students enrolled`}
                />

                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder="Search by name or registration number"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {filteredStudents.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No students enrolled in this class</p>
                    </div>
                ) : (
                    <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Status']} rowCount={filteredStudents.length}>
                        {filteredStudents.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                                <td className="px-4 py-3 font-medium">{s.name}</td>
                                <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                                <td className="px-4 py-3"><Badge status={s.active ? 'active' : 'inactive'} /></td>
                            </tr>
                        ))}
                    </Table>
                )}
            </div>
        );
    }

    // Show boxes of assigned classes
    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="My Classes"
                subtitle={`${assignedBoxes.length} classes assigned to you`}
            />

            {assignedBoxes.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                    <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No classes assigned to you yet</p>
                    <p className="text-sm text-slate-400">Contact administrator for class assignments</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedBoxes.map((box) => (
                        <div
                            key={box.id}
                            onClick={() => setSelectedClass(box)}
                            className="bg-white border-2 border-emerald-200 rounded-xl p-5 hover:shadow-lg hover:border-emerald-400 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                                        <h3 className="font-bold text-lg text-slate-900">{box.courseName}</h3>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-1">Level {box.level}</p>
                                    <p className="text-xs text-slate-400">{box.programName}</p>
                                </div>
                                <Users className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-100">
                                <span className="text-xs text-emerald-600 font-medium">Click to view students →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InstructorClasses;