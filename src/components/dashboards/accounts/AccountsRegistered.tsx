import React from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Table } from '@/components/shared/UI';

const AccountsRegistered: React.FC = () => {
    const { students } = useEMIS();
    const { registrations, invoices } = useRegistration();

    const approvedRegs = registrations.filter(r => r.registrationStatus === 'approved');

    return (
        <div>
            <PageHeader title="Registered Students" subtitle="Students with approved registrations" />

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Registration Date', 'Invoice']} rowCount={approvedRegs.length}>
                    {approvedRegs.map(reg => {
                        const student = students.find(s => s.id === reg.studentId);
                        const invoice = invoices.find(i => i.id === reg.invoiceId);
                        return (
                            <tr key={reg.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
                                <td className="px-4 py-3 font-mono text-xs">{reg.studentReg}</td>
                                <td className="px-4 py-3">{reg.programName}</td>
                                <td className="px-4 py-3 text-center">Level {reg.level}</td>
                                <td className="px-4 py-3 text-xs">{new Date(reg.registeredAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3 font-mono text-xs">#{invoice?.id.slice(-8)}</td>
                            </tr>
                        );
                    })}
                </Table>
            </div>
        </div>
    );
};

export default AccountsRegistered;