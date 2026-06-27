import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/UI';
import { FileText, History, Award } from 'lucide-react';
import ResultsManagement from './ResultsManagement';
import ResultHistory from './ResultHistory';
import PassMarkManagement from './PassMarkManagement';

interface ResultsDashboardProps {
    toast: string;
    setToast: (msg: string) => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ toast, setToast }) => {
    const [activeTab, setActiveTab] = useState<'management' | 'history' | 'grading'>('management');

    const tabs = [
        { key: 'management', label: 'Results Management', icon: FileText, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
        { key: 'history', label: 'Result History', icon: History, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
        { key: 'grading', label: 'Course Grading', icon: Award, color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    ];

    const activeColors: Record<string, string> = {
        management: 'bg-blue-600 text-white border-blue-700 shadow-md hover:bg-blue-700',
        history: 'bg-purple-600 text-white border-purple-700 shadow-md hover:bg-purple-700',
        grading: 'bg-amber-600 text-white border-amber-700 shadow-md hover:bg-amber-700',
    };

    return (
        <div>
            <PageHeader 
                title="Results & Grading" 
                subtitle="Manage results, view history, and configure course grading"
            />

            {/* Tabs - Rectangular Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`px-6 py-4 rounded-xl border-2 text-sm font-medium flex items-center gap-3 transition-all duration-200 ${
                                isActive 
                                    ? activeColors[tab.key] 
                                    : `${tab.color} border-transparent hover:shadow-md`
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                            <span>{tab.label}</span>
                            {isActive && (
                                <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'management' && <ResultsManagement toast={toast} setToast={setToast} />}
                {activeTab === 'history' && <ResultHistory toast={toast} setToast={setToast} />}
                {activeTab === 'grading' && <PassMarkManagement toast={toast} setToast={setToast} />}
            </div>
        </div>
    );
};

export default ResultsDashboard;

// import React, { useState } from 'react';
// import { PageHeader } from '@/components/shared/UI';
// import { FileText, History, Award } from 'lucide-react';
// import ResultsManagement from './ResultsManagement';
// import ResultHistory from './ResultHistory';
// import PassMarkManagement from './PassMarkManagement';

// interface ResultsDashboardProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ toast, setToast }) => {
//     const [activeTab, setActiveTab] = useState<'management' | 'history' | 'grading'>('management');

//     const tabs = [
//         { key: 'management', label: 'Results Management', icon: FileText },
//         { key: 'history', label: 'Result History', icon: History },
//         { key: 'grading', label: 'Course Grading', icon: Award },
//     ];

//     return (
//         <div>
//             <PageHeader 
//                 title="Results & Grading" 
//                 subtitle="Manage results, view history, and configure course grading"
//             />

//             {/* Tabs */}
//             <div className="flex gap-1 border-b border-slate-200 mb-6">
//                 {tabs.map(tab => {
//                     const Icon = tab.icon;
//                     const isActive = activeTab === tab.key;
//                     return (
//                         <button
//                             key={tab.key}
//                             onClick={() => setActiveTab(tab.key as any)}
//                             className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 transition border-b-2 ${
//                                 isActive 
//                                     ? 'border-emerald-600 text-emerald-600' 
//                                     : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
//                             }`}
//                         >
//                             <Icon className="w-4 h-4" />
//                             {tab.label}
//                         </button>
//                     );
//                 })}
//             </div>

//             {/* Tab Content */}
//             <div>
//                 {activeTab === 'management' && <ResultsManagement toast={toast} setToast={setToast} />}
//                 {activeTab === 'history' && <ResultHistory toast={toast} setToast={setToast} />}
//                 {activeTab === 'grading' && <PassMarkManagement toast={toast} setToast={setToast} />}
//             </div>
//         </div>
//     );
// };

// export default ResultsDashboard;