import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/UI';
import { BarChart3, Users, Award, Repeat, DollarSign, FileText } from 'lucide-react';
import ResultsPerformanceReport from './ResultsPerformanceReport';
import StudentPerformanceReport from './StudentPerformanceReport';
import RegistrationReport from './RegistrationReport';
import RepeaterReport from './RepeaterReport';
// import RegistrationReport from './RegistrationReport';
// import StudentPerformanceReport from './StudentPerformanceReport';
// import RepeaterReport from './RepeaterReport';
// import RevenueReport from './RevenueReport';

interface AdminReportsProps {
    toast: string;
    setToast: (msg: string) => void;
}

const AdminReports: React.FC<AdminReportsProps> = ({ toast, setToast }) => {
    const [activeTab, setActiveTab] = useState<'performance' | 'registration' | 'student' | 'repeater' >('performance');

    const tabs = [
        { key: 'performance', label: 'Results Performance', icon: BarChart3 },
        { key: 'registration', label: 'Registration', icon: FileText },
        { key: 'student', label: 'Student Performance', icon: Award },
        { key: 'repeater', label: 'Repeaters', icon: Repeat },
      
    ];

    return (
        <div>
            <PageHeader 
                title="Reports" 
                subtitle="View and export reports for registration, performance, and revenue"
            />

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-6">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition border-b-2 ${
                                isActive 
                                    ? 'border-emerald-600 text-emerald-600' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Report Content */}
            <div>
                {activeTab === 'performance' && <ResultsPerformanceReport toast={toast} setToast={setToast} />}
                {activeTab === 'registration' && <RegistrationReport toast={toast} setToast={setToast} />}
                {activeTab === 'student' && <StudentPerformanceReport toast={toast} setToast={setToast} />}
                 {activeTab === 'repeater' && <RepeaterReport toast={toast} setToast={setToast} />}
                {/* {activeTab === 'revenue' && <RevenueReport toast={toast} setToast={setToast} />}  */}
            </div>
        </div>
    );
};

export default AdminReports;