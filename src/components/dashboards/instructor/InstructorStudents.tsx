import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge, Input, Select, Button, Table, Toast } from '@/components/shared/UI';
import { Users, Search } from 'lucide-react';

interface InstructorStudentsProps {
    toast: string;
    setToast: (msg: string) => void;
    myAssignedCourses: { programName: string; level: number; courseName: string }[];
    studentsByCourse: { [key: string]: any[] };
}

const InstructorStudents: React.FC<InstructorStudentsProps> = ({
    toast,
    setToast,
    myAssignedCourses,
    studentsByCourse
}) => {
    const { students } = useEMIS();
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [search, setSearch] = useState('');

    const courseOptions = Object.keys(studentsByCourse);

      // Get students and deduplicate by ID
    const rawStudents = selectedCourse
        ? studentsByCourse[selectedCourse] || []
        : Object.values(studentsByCourse).flat();
    
    const uniqueMap = new Map();
    rawStudents.forEach(s => {
        if (!uniqueMap.has(s.id)) {
            uniqueMap.set(s.id, s);
        }
    });
    const displayStudents = Array.from(uniqueMap.values());
    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <PageHeader
                title="My Students"
                subtitle="Students assigned to your courses by level"
            />

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder="Search by name or reg number"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
    <option value="">All Courses</option>
    {myAssignedCourses.map(c => {
        const optionValue = `${c.programName} - Level ${c.level} - ${c.courseName}`;
        return <option key={optionValue} value={optionValue}>{c.courseName} (Level {c.level})</option>;
    })}
</Select>
                    {/* <Select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
                        <option value="">All Courses</option>
                        {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select> */}
                </div>
            </div>

            {displayStudents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No students assigned to your courses yet</p>
                    <p className="text-sm text-slate-400">
                        Students will appear here once Admin assigns them to programs and levels
                    </p>
                </div>
            ) : (
                <Table headers={['Reg Number', 'Name', 'Program', 'Level', 'Course']} rowCount={displayStudents.length}>
                    {displayStudents
                        .filter(s => !search ||
                            s.name.toLowerCase().includes(search.toLowerCase()) ||
                            s.regNumber.toLowerCase().includes(search.toLowerCase()))
                        .map(s => (
                            <tr key={s.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                                <td className="px-4 py-3 font-medium">{s.name}</td>
                                <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                              <td className="px-4 py-3">
    <div className="flex flex-wrap gap-1">

        {myAssignedCourses
            .filter(c => s.program === c.programName && s.level === `Level ${c.level}`)
            .map((c, idx) => <Badge key={idx} status="active">{c.courseName} (Level {c.level})</Badge>)}
    </div>
</td>
                            </tr>
                        ))}
                </Table>
            )}
        </div>
    );
};

export default InstructorStudents;