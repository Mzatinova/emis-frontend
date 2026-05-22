import React, { useState } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { useRegistration } from '@/contexts/RegistrationContext';
import { PageHeader, Table, Badge, Button, Input } from '@/components/shared/UI';
import { Search } from 'lucide-react';

// const AccountsRegistered: React.FC = () => {
const AccountsRegistered: React.FC<{ initialFilter?: 'all' | 'approved' | 'pending' }> = ({ initialFilter = 'all' }) => {
    const { students } = useEMIS();
    const { invoices } = useRegistration();
    // const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>(initialFilter);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInvoices = invoices.filter(inv => {
        // Apply status filter
        if (filter === 'approved') return inv.status === 'approved';
        if (filter === 'pending') return inv.status === 'pending' || inv.status === 'paid';
        
        // Apply search filter
        const student = students.find(s => String(s.id) === String(inv.studentId));
        const studentName = student?.name?.toLowerCase() || '';
        const studentReg = inv.studentReg?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        
        if (searchTerm) {
            return studentName.includes(search) || studentReg.includes(search);
        }
        
        return true;
    }).filter(inv => {
        // Re-apply status filter after search (simplified)
        if (filter === 'approved') return inv.status === 'approved';
        if (filter === 'pending') return inv.status === 'pending' || inv.status === 'paid';
        return true;
    });

    const counts = {
        all: invoices.length,
        approved: invoices.filter(i => i.status === 'approved').length,
        pending: invoices.filter(i => i.status === 'pending' || i.status === 'paid').length
    };

    const getStudentName = (studentId: string) => {
        const student = students.find(s => String(s.id) === String(studentId));
        return student?.name || 'Unknown';
    };

    return (
        <div>
            <PageHeader title="Student Registrations" subtitle="View all registration attempts" />

            {/* Search and Filter Bar */}
            <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
                <div className="flex gap-2">
                    <Button 
                        variant={filter === 'all' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('all')}
                    >
                        All ({counts.all})
                    </Button>
                    <Button 
                        variant={filter === 'approved' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('approved')}
                    >
                        Approved ({counts.approved})
                    </Button>
                    <Button 
                        variant={filter === 'pending' ? 'primary' : 'secondary'}
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({counts.pending})
                    </Button>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        type="text"
                        placeholder="Search by name or reg number..."
                        className="pl-9 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <Table headers={['Student', 'Reg No', 'Program', 'Level', 'Amount', 'Status', 'Date']} rowCount={filteredInvoices.length}>
                    {filteredInvoices.map(inv => {
                        const student = students.find(s => String(s.id) === String(inv.studentId));
                        return (
                            <tr key={inv.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium">{student?.name || 'Unknown'}</td>
                                <td className="px-4 py-3 font-mono text-xs">{inv.studentReg}</td>
                                <td className="px-4 py-3">{inv.programName}</td>
                                <td className="px-4 py-3 text-center">Level {inv.level}</td>
                                <td className="px-4 py-3 font-medium">K{inv.amount.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <Badge status={inv.status === 'approved' ? 'approved' : 'pending'}>
                                        {inv.status}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3 text-xs">{new Date(inv.createdAt).toLocaleDateString()}</td>
                            </tr>
                        );
                    })}
                </Table>
            </div>
        </div>
    );
};

export default AccountsRegistered;