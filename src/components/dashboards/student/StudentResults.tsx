// src/components/dashboard/student/StudentResults.tsx
import React from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Button, Table } from '@/components/shared/UI';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface StudentResultsProps {
    // downloadPDF: () => void;
}

const StudentResults: React.FC<StudentResultsProps> = () => {
    const { currentUser, results, sessions } = useEMIS();

    // const myResults = results.filter(r => String(r.studentId) === String(currentUser?.id) && r.status === 'approved');
    const activeSession = sessions.find(s => s.active === true);
    console.log('Active session:', activeSession);
    console.log('Active session ID:', activeSession?.id);
    console.log('Results academic_session_id values:', results.map(r => ({
        id: r.id,
        academic_session_id: r.academic_session_id,
        studentId: r.studentId,
        status: r.status
    })));
    const myResults = results.filter(r =>
        String(r.studentId) === String(currentUser?.id) &&
        r.status === 'approved' &&
        String(r.academic_session_id) === String(activeSession?.id)
    );

    // const allPassed = myResults.length === 3 && myResults.every(r => r.grade !== 'F' && r.marks !== null);
    // const hasFail = myResults.some(r => r.grade === 'F');
    // const hasIncomplete = myResults.length < 3;
    // For a student, they should pass if they have NO failing grades in the current session
const hasFail = myResults.some(r => r.grade === 'F');
const allPassed = myResults.length > 0 && !hasFail;

    let statusText = '';
    let statusColor = '';


    if (myResults.length === 0) {
    statusText = 'No results available';
    statusColor = 'text-slate-500';
} else if (allPassed) {
    statusText = 'PASS AND PROCEED';
    statusColor = 'text-emerald-600';
} else if (hasFail) {
    statusText = 'FAILED - REPEAT';
    statusColor = 'text-red-600';
}

    // if (myResults.length === 0) {
    //     statusText = 'No results available';
    //     statusColor = 'text-slate-500';
    // } else if (allPassed) {
    //     statusText = 'PASS AND PROCEED';
    //     statusColor = 'text-emerald-600';
    // } else if (hasFail) {
    //     statusText = 'FAILED - REPEAT';
    //     statusColor = 'text-red-600';
    // } else if (hasIncomplete) {
    //     statusText = 'RESULTS PENDING';
    //     statusColor = 'text-amber-600';
    // }

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        let y = 20;

        doc.setFontSize(16);
        doc.text('Student Results', 105, y, { align: 'center' });

        y += 15;
        doc.setFontSize(12);
        doc.text(`Student: ${currentUser?.name}`, 20, y);
        y += 8;
        doc.text(`Registration No.: ${currentUser?.regNumber}`, 20, y);
        y += 8;
        doc.text(`Academic Year: ${sessions.find(s => s.active)?.year || 'None'}`, 20, y);
        y += 8;
        doc.text(`Level: ${myResults[0]?.level || 'N/A'}`, 20, y);
        y += 12;

        doc.text(`Status: ${statusText}`, 20, y);
        y += 12;

        doc.text('Course', 20, y);
        doc.text('Exam', 100, y);
        doc.text('Grade', 140, y);
        doc.line(20, y + 2, 180, y + 2);

        y += 8;

        myResults.forEach((r, i) => {
            doc.text(r.courseName, 20, y);
            doc.text(r.marks?.toString() || '—', 100, y);
            doc.text(r.grade, 140, y);
            y += 7;
        });

        doc.line(20, y - 2, 180, y - 2);

        // Open PDF in new tab instead of downloading
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
    };
    return (
        <div>
            <PageHeader
                title="My Results"
                action={<Button onClick={handleDownloadPDF}><Download className="w-4 h-4 inline mr-1" />Download PDF</Button>}
            />

            <div className="text-center text-sm text-slate-600">
                Academic Year: <span className="font-medium text-emerald-600">{sessions.find(s => s.active)?.year || 'None'}</span>
            </div>

            <div className="mt-4 p-4 bg-slate-50 rounded-lg text-center">
                <span className="text-slate-600 font-medium">Status: </span>
                <span className={`font-medium ${statusColor}`}>{statusText}</span>
            </div>

            <Table headers={['Course', 'Score', 'Grade']} rowCount={myResults.length}>
                {myResults.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                            <div className="font-medium text-xs">{r.courseName}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">{r.marks ?? '—'}</td>
                        <td className="px-4 py-3">
                            <span className={`font-bold ${r.grade === 'F' ? 'text-red-600' : 'text-emerald-600'}`}>
                                {r.grade}
                            </span>
                        </td>
                    </tr>
                ))}
            </Table>


        </div>
    );
};

export default StudentResults;

