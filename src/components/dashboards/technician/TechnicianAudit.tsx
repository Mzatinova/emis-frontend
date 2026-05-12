import React, { useState, useMemo } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Table, Input, Select, Button, Toast } from '@/components/shared/UI';
import { Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export const TechnicianAudit: React.FC = () => {
    const { audits } = useEMIS();
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Get unique actions for filter dropdown
    const uniqueActions = useMemo(() => {
        const actions = new Set(audits.map(a => a.action));
        return ['All', ...Array.from(actions)];
    }, [audits]);

    // Filter and search audits
    const filteredAudits = useMemo(() => {
        let filtered = [...audits];

        // Search filter (searches in userName, action, details)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(a =>
                a.userName.toLowerCase().includes(term) ||
                a.action.toLowerCase().includes(term) ||
                a.details.toLowerCase().includes(term)
            );
        }

        // Action filter
        if (actionFilter && actionFilter !== 'All') {
            filtered = filtered.filter(a => a.action === actionFilter);
        }

        // Sort by timestamp (most recent first)
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return filtered;
    }, [audits, searchTerm, actionFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredAudits.length / itemsPerPage);
    const paginatedAudits = filteredAudits.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to first page when filters change
    const handleFilterChange = () => {
        setCurrentPage(1);
    };

    return (
        <div>
            <PageHeader
                title="Audit Logs"
                subtitle={`${filteredAudits.length} of ${audits.length} system events recorded`}
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <Input
                            placeholder="Search by user, action, or details..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                handleFilterChange();
                            }}
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            handleFilterChange();
                        }}
                    >
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>
                                {action === 'All' ? 'All Actions' : action}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={10}>10 per page</option>
                        <option value={20}>20 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                    </Select>
                </div>
            </div>

            {/* Audit Table */}
            <Table headers={['Timestamp', 'User', 'Action', 'Details']} rowCount={paginatedAudits.length}>
                {paginatedAudits.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                            {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{a.userName}</td>
                        <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                {a.action}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{a.details}</td>
                    </tr>
                ))}
            </Table>

            {/* Pagination Controls */}
            {filteredAudits.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-slate-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAudits.length)} of {filteredAudits.length} entries
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>

                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'primary' : 'secondary'}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className="px-3 py-2 min-w-[40px]"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="secondary"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicianAudit;

// import React from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Table } from '@/components/shared/UI';

// export const TechnicianAudit: React.FC = () => {
//     const { audits } = useEMIS();

//     return (
//         <div>
//             <PageHeader title="Audit Logs" subtitle={`${audits.length} system events recorded`} />
//             <Table headers={['Timestamp', 'User', 'Action', 'Details']} rowCount={audits.length}>
//                 {audits.map(a => (
//                     <tr key={a.id} className="hover:bg-slate-50">
//                         <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(a.timestamp).toLocaleString()}</td>
//                         <td className="px-4 py-3 text-slate-900">{a.userName}</td>
//                         <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{a.action}</span></td>
//                         <td className="px-4 py-3 text-slate-600">{a.details}</td>
//                     </tr>
//                 ))}
//             </Table>
//         </div>
//     );
// };

// export default TechnicianAudit;