import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Field, Input, Select, Button, Table, Toast, Badge, Modal } from '@/components/shared/UI';
import { Search, Upload, Save, SaveAll, Edit2, GraduationCap, Users, Plus, X } from 'lucide-react';

interface InstructorResultsProps {
    toast: string;
    setToast: (msg: string) => void;
    myAssignedCourses: { programName: string; level: number; courseName: string }[];
}

const InstructorResults: React.FC<InstructorResultsProps> = ({ toast, setToast, myAssignedCourses }) => {
    const { currentUser, students, courses, results, sessions, addResult, updateResult, refresh } = useEMIS();
    const { registrations, fetchInstructorRegistrations } = useRegistration();

    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [examValues, setExamValues] = useState<{ [key: string]: string }>({});
    const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
    const [csvOpen, setCsvOpen] = useState(false);
    const [csvText, setCsvText] = useState('regNumber,courseName,exam\nTC/2025/001,Practical,75');
    const [savedResults, setSavedResults] = useState<{ [key: string]: boolean }>({});

    // Get pass mark for a course
    const getPassMark = (courseName: string) => {
        if (courseName === 'Practical') return 75;
        return 50;
    };

    // Get grade and pass/fail
    // const getGradeAndPassFail = (marks: number, courseName: string) => {
    //     if (!marks && marks !== 0) return { grade: '—', passFail: '—' };

    //     const passMark = getPassMark(courseName);
    //     const isPass = marks >= passMark;
    //     const passFailText = isPass ? 'Pass' : 'Fail';

    //     if (marks >= 75) return { grade: 'A', passFail: passFailText };
    //     if (marks >= 65) return { grade: 'B', passFail: passFailText };
    //     if (marks >= 55) return { grade: 'C', passFail: passFailText };
    //     if (marks >= 50) return { grade: 'D', passFail: passFailText };
    //     return { grade: 'F', passFail: 'Fail' };
    // };

    const getGradeAndPassFail = (marks: number, courseName: string) => {
        if (!marks && marks !== 0) return { grade: '—', passFail: '—' };

        const passMark = getPassMark(courseName);
        const isPass = marks >= passMark;
        const passFailText = isPass ? 'Pass' : 'Fail';

        // For Practical course: Only A or F (no B, C, D)
        if (courseName === 'Practical') {
            if (marks >= 75) return { grade: 'A', passFail: passFailText };
            return { grade: 'F', passFail: 'Fail' };
        }

        // For Occupation and Fundamentals: Standard grading
        if (marks >= 75) return { grade: 'A', passFail: passFailText };
        if (marks >= 65) return { grade: 'B', passFail: passFailText };
        if (marks >= 55) return { grade: 'C', passFail: passFailText };
        if (marks >= 50) return { grade: 'D', passFail: passFailText };
        return { grade: 'F', passFail: 'Fail' };
    };

    // Get course IDs that this instructor teaches
    const myCourseIds = useMemo(() => {
        const ids: string[] = [];
        myAssignedCourses.forEach(assigned => {

            const course = courses.find(c =>
                c.name === assigned.courseName ||
                c.name?.toLowerCase().includes(assigned.courseName.toLowerCase())
            );
            if (course && !ids.includes(course.id)) {
                ids.push(course.id);
            }
        });
        return ids;
    }, [courses, myAssignedCourses]);

    // Get students for selected class using registrations
    const studentsInClass = useMemo(() => {
        if (!selectedClass) return [];

        return students.filter(s => {
            const hasApprovedRegistration = registrations.some(r => {
                // Parse courses if it's a JSON string
                let coursesArray = r.courses;
                if (typeof r.courses === 'string') {
                    try {
                        coursesArray = JSON.parse(r.courses);
                    } catch (e) {
                        coursesArray = [];
                    }
                }

                return String(r.studentId) === String(s.id) &&
                    r.registrationStatus === 'approved' &&
                    String(r.programName) === String(selectedClass.programName) &&
                    String(r.level) === String(selectedClass.level) &&
                    coursesArray?.includes(selectedClass.courseName);
            });
            return s.active && hasApprovedRegistration;
        });
    }, [selectedClass, students, registrations]);


    // Get existing results for the selected course and session


    const existingResultsMap = useMemo(() => {
        const map: { [key: string]: any } = {};
        const activeSession = sessions.find(s => s.active === true);
        if (!activeSession) return map;

        results.forEach(r => {
            if (r.courseName === selectedClass?.courseName && String(r.academic_session_id) === String(activeSession.id)) {
                map[r.studentId] = r;
            }
        });
        return map;
    }, [results, selectedClass, sessions]);
    //     const existingResultsMap = useMemo(() => {
    //     const map: { [key: string]: any } = {};

    //     results.forEach(r => {
    //         if (r.courseName === selectedClass?.courseName) {
    //             map[r.studentId] = r;
    //         }
    //     });
    //     return map;
    // }, [results, selectedClass]);


    //  const existingResultsMap = useMemo(() => {
    //     const map: { [key: string]: any } = {};
    //     const sessionId = sessions[0]?.id;

    //     console.log('All results:', results);
    // console.log('First result:', results[0]);
    // console.log('Selected course name:', selectedClass?.courseName);
    // console.log('Session ID:', sessions[0]?.id);
    // console.log('Result courseName:', results[0]?.courseName);
    // console.log('Result sessionId:', results[0]?.sessionId);
    // console.log('Comparison:', results[0]?.courseName === selectedClass?.courseName);

    //     results.forEach(r => {
    //         if (r.courseName === selectedClass?.courseName && r.sessionId === sessionId) {
    //             map[r.studentId] = r;
    //         }
    //     });
    //     return map;
    // }, [results, selectedClass, sessions]);

    // Initialize exam values from existing results
    React.useEffect(() => {
        if (selectedClass) {
            console.log('selectedClass:', selectedClass);
            console.log('existingResultsMap:', existingResultsMap);
            console.log('studentsInClass:', studentsInClass);

            const initialValues: { [key: string]: string } = {};
            const initialSaved: { [key: string]: boolean } = {};
            studentsInClass.forEach(s => {
                const existing = existingResultsMap[String(s.id)];
                //    if (existing && existing.exam) {
                //         initialValues[s.id] = existing.exam.toString(); 
                if (existing && existing.marks) {
                    initialValues[s.id] = existing.marks.toString();
                    initialSaved[s.id] = true;
                } else {
                    initialValues[s.id] = '';
                    initialSaved[s.id] = false;
                }
            });
            setExamValues(initialValues);  // ← SET initialValues, not empty
            setSavedResults(initialSaved);
            setEditingStudentId(null);

            console.log('existingResultsMap after map:', existingResultsMap);
            console.log('First existing result:', existingResultsMap[String(studentsInClass[0]?.id)]);
        }
    }, [selectedClass, studentsInClass, existingResultsMap]);

    // Sync examValues with existingResultsMap after refresh
    // React.useEffect(() => {
    //     if (selectedClass && studentsInClass.length > 0) {
    //         const newValues: { [key: string]: string } = {};
    //         studentsInClass.forEach(s => {
    //             const existing = existingResultsMap[s.id];
    //             if (existing && existing.exam !== null) {
    //                 newValues[s.id] = existing.exam.toString();
    //             } else if (!examValues[s.id]) {
    //                 newValues[s.id] = '';
    //             } else {
    //                 newValues[s.id] = examValues[s.id];
    //             }
    //         });
    //         setExamValues(prev => ({ ...prev, ...newValues }));
    //     }
    // }, [existingResultsMap, selectedClass, studentsInClass]);

    React.useEffect(() => {
        if (selectedClass && studentsInClass.length > 0) {
            const newValues: { [key: string]: string } = {};
            studentsInClass.forEach(s => {
                const existing = existingResultsMap[String(s.id)];
                // if (existing && existing.exam) {
                //     newValues[s.id] = existing.exam.toString();
                if (existing && existing.marks) {
                    newValues[s.id] = existing.marks.toString();
                } else {
                    newValues[s.id] = examValues[s.id] || '';
                }
            });
            setExamValues(prev => ({ ...prev, ...newValues }));
        }
    }, [existingResultsMap, selectedClass, studentsInClass]);

    // Save single result
    const handleSaveResult = async (studentId: string) => {
        const student = students.find(s => s.id === studentId);
        const exam = parseInt(examValues[studentId] || '0');

        if (!student) return;
        if (exam < 0 || exam > 100) {
            setToast('Exam mark must be between 0 and 100');
            return;
        }

        setSaving(true);
        try {
            const existing = existingResultsMap[String(studentId)];

            if (existing) {
                await updateResult(existing.id, { exam });
            } else {
                await addResult({
                    studentId: student.id,
                    studentReg: student.regNumber,
                    courseName: selectedClass.courseName,
                    exam: exam,
                    createdBy: currentUser!.id
                });
            }
            // await addResult({
            //     studentId: student.id,
            //     studentReg: student.regNumber,
            //     courseName: selectedClass.courseName,
            //     exam: exam,
            //     createdBy: currentUser!.id
            // });
            setEditingStudentId(null);
            setToast('Result saved');
            await refresh();
            await fetchInstructorRegistrations();
        } catch (error) {
            setToast('Failed to save result');
        }
        setSaving(false);
    };
    // const handleSaveResult = async (studentId: string) => {

    //     const student = students.find(s => s.id === studentId);
    //     const exam = parseInt(examValues[studentId] || '0');

    //     if (!student) return;
    //     if (exam < 0 || exam > 100) {
    //         setToast('Exam mark must be between 0 and 100');
    //         return;
    //     }

    //     const existing = existingResultsMap[String(studentId)];
    //     const courseId = myCourseIds[0];


    //     setSaving(true);
    //     try {
    //         if (existing) {
    //             await updateResult(existing.id, { exam });
    //         } else {
    //             await addResult({
    //             studentId: student.id,
    //             studentReg: student.regNumber,
    //             courseName: selectedClass.courseName,

    //             exam,
    //             createdBy: currentUser!.id
    //         });
    //         }
    //         setEditingStudentId(null);
    //         setToast('Result saved');
    //       await refresh();
    //     } catch (error) {
    //         setToast('Failed to save result');
    //     }
    //     setSaving(false);
    // };

    // Save all results

    const handleSaveAll = async () => {
        setSaving(true);
        let saved = 0;
        let failed = 0;

        for (const student of studentsInClass) {
            const exam = parseInt(examValues[student.id] || '0');
            if (exam < 0 || exam > 100) continue;

            try {
                const existing = existingResultsMap[String(student.id)];

                if (existing) {
                    await updateResult(existing.id, { exam });
                } else {
                    await addResult({
                        studentId: student.id,
                        studentReg: student.regNumber,
                        courseName: selectedClass.courseName,
                        exam: exam,
                        createdBy: currentUser!.id
                    });
                }
                // await addResult({
                //     studentId: student.id,
                //     studentReg: student.regNumber,
                //     courseName: selectedClass.courseName,
                //     exam: exam,
                //     createdBy: currentUser!.id
                // });
                saved++;
            } catch (error) {
                failed++;
            }
        }

        setSaving(false);
        setToast(`Saved: ${saved}, Failed: ${failed}`);
        await refresh();
        await fetchInstructorRegistrations();
    };
    //     const handleSaveAll = async () => {
    //         setSaving(true);
    //         let saved = 0;
    //         let failed = 0;

    //         for (const student of studentsInClass) {
    //             const exam = parseInt(examValues[student.id] || '0');
    //             if (exam < 0 || exam > 100) continue;

    //             const existing = existingResultsMap[student.id];
    //             const courseId = myCourseIds[0];


    //             try {
    //                 if (existing) {
    //                     await updateResult(existing.id, { exam });
    //                 } else {
    //                    await addResult({
    //     studentId: student.id,
    //     studentReg: student.regNumber,
    //     courseName: selectedClass.courseName,

    //     exam,
    //     createdBy: currentUser!.id
    // });
    //                 }
    //                 saved++;
    //             } catch (error) {
    //                 failed++;
    //             }
    //         }

    //         setSaving(false);
    //         setToast(`Saved: ${saved}, Failed: ${failed}`);
    //         await refresh();
    //     };

    // Handle CSV upload
    const handleCsvUpload = async () => {
        const lines = csvText.trim().split('\n').slice(1);
        let added = 0;
        lines.forEach(line => {
            const [reg, courseName, examS] = line.split(',').map(s => s.trim());
            const stu = students.find(s => s.regNumber === reg);
            const cou = courses.find(c => c.name?.toLowerCase().includes(courseName.toLowerCase()));
            if (stu && cou) {
                addResult({
                    studentId: stu.id, studentReg: stu.regNumber, courseId: cou.id,
                    exam: examS ? parseFloat(examS) : null,
                    createdBy: currentUser!.id
                });
                added++;
            }
        });
        setCsvOpen(false);
        setToast(`${added} results uploaded`);
        await refresh();
        await fetchInstructorRegistrations();
    };

    // Group assigned courses into boxes
    const assignedBoxes = useMemo(() => {
        const activeSession = sessions.find(s => s.active === true);
        if (!activeSession) return [];

        return myAssignedCourses
            .map(course => ({
                id: `${course.courseName}-${course.level}`,
                courseName: course.courseName,
                level: course.level,
                programName: course.programName,
                fullName: `${course.courseName} - Level ${course.level}`
            }))
            .filter(box => {
                // Check if there are any students with approved registration for this course in the active session
                return students.some(s => {
                    return registrations.some(r => {
                        let coursesArray = r.courses;
                        if (typeof r.courses === 'string') {
                            try {
                                coursesArray = JSON.parse(r.courses);
                            } catch (e) {
                                coursesArray = [];
                            }
                        }
                        return String(r.studentId) === String(s.id) &&
                            r.registrationStatus === 'approved' &&
                            String(r.programName) === String(box.programName) &&
                            String(r.level) === String(box.level) &&
                            coursesArray?.includes(box.courseName) &&
                            String(r.academic_session_id) === String(activeSession.id);
                    });
                });
            });
    }, [myAssignedCourses, students, registrations, sessions]);
    // const assignedBoxes = useMemo(() => {
    //     return myAssignedCourses.map(course => ({
    //         id: `${course.courseName}-${course.level}`,
    //         courseName: course.courseName,
    //         level: course.level,
    //         programName: course.programName,
    //         fullName: `${course.courseName} - Level ${course.level}`
    //     }));
    // }, [myAssignedCourses]);

    // Filter students by search
    const filteredStudents = studentsInClass.filter(s =>
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.regNumber.toLowerCase().includes(search.toLowerCase())
    );

    // If a class is selected, show results table
    if (selectedClass) {
        const courseId = myCourseIds[0];
        const courseName = selectedClass.courseName;

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
                    subtitle="Enter exam results for students"
                    action={
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => setCsvOpen(true)}>
                                <Upload className="w-4 h-4 inline mr-1" />CSV Upload
                            </Button>
                            <Button onClick={handleSaveAll} disabled={saving} variant="primary">
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline mr-1" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <SaveAll className="w-4 h-4 inline mr-1" />
                                        Save All
                                    </>
                                )}
                            </Button>
                            {/* <Button onClick={handleSaveAll} disabled={saving} variant="primary">
                                <SaveAll className="w-4 h-4 inline mr-1" />
                                Save All
                            </Button> */}
                        </div>
                    }
                />

                <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder="Search by name or registration number"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <Table
                        headers={['Reg Number', 'Name', 'Program', 'Level', 'Exam Mark', 'Grade', 'Pass/Fail', 'Status', 'Actions']}
                        rowCount={filteredStudents.length}
                    >
                        {filteredStudents.map(s => {
                            const existing = existingResultsMap[String(s.id)];
                            const currentExam = examValues[s.id] || '';
                            // const examValue = currentExam ? parseInt(currentExam) : (existing?.exam || null);
                            const examValue = currentExam ? parseInt(currentExam) : (existing?.marks || null);
                            const { grade, passFail } = getGradeAndPassFail(examValue, courseName);
                            const isEditing = editingStudentId === s.id;
                            const isLocked = existing?.status === 'approved';

                            return (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs text-blue-700">{s.regNumber}</td>
                                    <td className="px-4 py-3 font-medium">{s.name}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.program || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.level || '—'}</td>
                                    <td className="px-4 py-3">
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={examValues[s.id] || ''}
                                            onChange={e => {
                                                setExamValues(prev => ({ ...prev, [s.id]: e.target.value }));
                                                setEditingStudentId(s.id); // Mark as needing save
                                            }}
                                            className="w-28 text-center"
                                            placeholder="Score"
                                            disabled={isLocked || savedResults[s.id]}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-bold ${grade === 'F' ? 'text-red-600' :
                                            grade === '—' ? 'text-slate-400' : 'text-emerald-600'
                                            }`}>
                                            {grade}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-medium ${passFail === 'Pass' ? 'text-emerald-600' :
                                            passFail === 'Fail' ? 'text-red-600' : 'text-slate-400'
                                            }`}>
                                            {passFail}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {existing ? (
                                            <Badge status={existing.status === 'approved' ? 'success' : 'warning'}>
                                                {existing.status === 'approved' ? 'Published' : 'Pending Approval'}
                                            </Badge>
                                        ) : examValues[s.id] ? (
                                            <Badge status="warning">Unpublished</Badge>
                                        ) : (
                                            <Badge status="default">Not Entered</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {!isLocked && (
                                                <>
                                                    {savedResults[s.id] ? (
                                                        <button
                                                            onClick={() => {
                                                                setEditingStudentId(s.id);
                                                                setSavedResults(prev => ({ ...prev, [s.id]: false }));
                                                            }}
                                                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                                                        >
                                                            <Edit2 className="w-3 h-3" />
                                                            Edit
                                                        </button>
                                                    ) : (
                                                        examValues[s.id] && (
                                                            // <button
                                                            //     onClick={() => handleSaveResult(s.id)}
                                                            //     disabled={saving}
                                                            //     className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 flex items-center gap-1"
                                                            // >
                                                            //     <Save className="w-3 h-3" />
                                                            //     Save
                                                            // </button>
                                                            <button
                                                                onClick={() => handleSaveResult(s.id)}
                                                                disabled={saving}
                                                                className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                {saving ? (
                                                                    <>
                                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                                        Saving...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="w-3 h-3" />
                                                                        Save
                                                                    </>
                                                                )}
                                                            </button>
                                                        )
                                                    )}
                                                </>
                                            )}
                                            {isLocked && <span className="text-xs text-slate-400">Locked</span>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </Table>
                </div>

                {/* CSV Upload Modal */}
                <Modal open={csvOpen} onClose={() => setCsvOpen(false)} title="CSV Bulk Upload" size="lg">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Format: <code className="bg-slate-100 px-1 rounded">regNumber,courseName,exam</code></p>
                        <p className="text-xs text-slate-500">Example: TC/2025/001,Practical,75</p>
                        <textarea
                            value={csvText}
                            onChange={e => setCsvText(e.target.value)}
                            rows={10}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setCsvOpen(false)}>Cancel</Button>
                            <Button onClick={handleCsvUpload}>Upload</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // Show boxes of assigned classes
    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Select a class to enter results</h2>
            </div>

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
                            <span className="text-xs text-emerald-600 font-medium">Click to enter results →</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* CSV Upload Modal for main page */}
            <Modal open={csvOpen} onClose={() => setCsvOpen(false)} title="CSV Bulk Upload" size="lg">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Format: <code className="bg-slate-100 px-1 rounded">regNumber,courseName,exam</code></p>
                    <p className="text-xs text-slate-500">Example: TC/2025/001,Practical,75</p>
                    <textarea
                        value={csvText}
                        onChange={e => setCsvText(e.target.value)}
                        rows={10}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setCsvOpen(false)}>Cancel</Button>
                        <Button onClick={handleCsvUpload}>Upload</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default InstructorResults;