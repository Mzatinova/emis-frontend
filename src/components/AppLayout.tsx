import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { RegistrationProvider } from '@/contexts/RegistrationContext';
import Login from '@/components/Login';
import Sidebar from '@/components/Sidebar';
import TechnicianDash from '@/components/dashboards/technician/TechnicianDash';
import AdminDash from '@/components/dashboards/admin/AdminDash';
import InstructorDash from '@/components/dashboards/instructor/InstructorDash';
import AccountsDash from '@/components/dashboards/accounts/AccountsDash';
import StudentDash from '@/components/dashboards/student/StudentDash';
import { Bell, Menu, X } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { currentUser, loading } = useEMIS();
  const [active, setActive] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setActive('dashboard'); }, [currentUser?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading EMIS...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login />;

  const renderDash = () => {
    switch (currentUser.role) {
      case 'technician':
        return <TechnicianDash active={active} />;
      case 'administrator':
        return (
          <RegistrationProvider>
            <AdminDash active={active} />
          </RegistrationProvider>
        );
      case 'instructor':
        return <InstructorDash active={active} />;
      case 'accounts':
        return (
          <RegistrationProvider>
            <AccountsDash active={active} setActive={setActive} />
          </RegistrationProvider>
        );
      case 'student':
        return (
          <RegistrationProvider>
            <StudentDash active={active} />
          </RegistrationProvider>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <div className={`fixed md:sticky top-0 z-50 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar active={active} setActive={(k) => { setActive(k); setMobileOpen(false); }} />
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 hover:bg-slate-100 rounded">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 capitalize">{currentUser.role} Portal</h2>
              <p className="text-xs text-slate-500">Examination Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* <button className="p-2 hover:bg-slate-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-slate-600" />
            </button> */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">{currentUser.name.charAt(0)}</div>
              <div>
                <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
                <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">{renderDash()}</div>
      </main>
    </div>
  );
};

export default AppLayout;

// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { RegistrationProvider } from '@/contexts/RegistrationContext'; // ADD THIS IMPORT
// import Login from '@/components/Login';
// import Sidebar from '@/components/Sidebar';
// import TechnicianDash from '@/components/dashboards/technician/TechnicianDash';
// import AdminDash from '@/components/dashboards/admin/AdminDash';
// import InstructorDash from '@/components/dashboards/instructor/InstructorDash';
// import AccountsDash from '@/components/dashboards/accounts/AccountsDash';
// import StudentDash from '@/components/dashboards/student/StudentDash';
// import { Bell, Menu, X } from 'lucide-react';

// const AppLayout: React.FC = () => {
//   const { currentUser, loading } = useEMIS();
//   const [active, setActive] = useState('dashboard');
//   const [mobileOpen, setMobileOpen] = useState(false);

//   useEffect(() => { setActive('dashboard'); }, [currentUser?.id]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="text-center">
//           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
//           <p className="text-sm text-slate-500">Loading EMIS...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!currentUser) return <Login />;

//   const renderDash = () => {
//     switch (currentUser.role) {
//       case 'technician': return <TechnicianDash active={active} />;
//       case 'administrator': return <AdminDash active={active} />;
//       case 'instructor': return <InstructorDash active={active} />;
//       case 'accounts': return <AccountsDash active={active} />;
//       case 'student':
//         return (
//           <RegistrationProvider>
//             <StudentDash active={active} />
//           </RegistrationProvider>
//         );
//       default: return null;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 flex">
//       {/* Mobile overlay */}
//       {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

//       {/* Sidebar */}
//       <div className={`fixed md:sticky top-0 z-50 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
//         <Sidebar active={active} setActive={(k) => { setActive(k); setMobileOpen(false); }} />
//       </div>

//       {/* Main */}
//       <main className="flex-1 min-w-0">
//         {/* Top bar */}
//         <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
//           <div className="flex items-center gap-3">
//             <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 hover:bg-slate-100 rounded">
//               {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//             </button>
//             <div>
//               <h2 className="text-sm font-semibold text-slate-900 capitalize">{currentUser.role} Portal</h2>
//               <p className="text-xs text-slate-500">Examination Management System</p>
//             </div>
//           </div>
//           <div className="flex items-center gap-3">
//             <button className="p-2 hover:bg-slate-100 rounded-lg relative">
//               <Bell className="w-5 h-5 text-slate-600" />
//             </button>
//             <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
//               <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">{currentUser.name.charAt(0)}</div>
//               <div>
//                 <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
//                 <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
//               </div>
//             </div>
//           </div>
//         </header>

//         <div className="p-6">{renderDash()}</div>
//       </main>
//     </div>
//   );
// };

// export default AppLayout;

// // import React, { useState, useEffect } from 'react';
// // import { useEMIS } from '@/contexts/EMISContext';
// // import Login from '@/components/Login';
// // import Sidebar from '@/components/Sidebar';
// // import TechnicianDash from '@/components/dashboards/technician/TechnicianDash';
// // import AdminDash from '@/components/dashboards/admin/AdminDash';
// // import InstructorDash from '@/components/dashboards/instructor/InstructorDash';
// // import AccountsDash from '@/components/dashboards/accounts/AccountsDash';
// // import StudentDash from '@/components/dashboards/student/StudentDash';
// // import { Bell, Menu, X } from 'lucide-react';

// // const AppLayout: React.FC = () => {
// //   const { currentUser, loading } = useEMIS();
// //   const [active, setActive] = useState('dashboard');
// //   const [mobileOpen, setMobileOpen] = useState(false);

// //   useEffect(() => { setActive('dashboard'); }, [currentUser?.id]);

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-slate-50">
// //         <div className="text-center">
// //           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
// //           <p className="text-sm text-slate-500">Loading EMIS...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (!currentUser) return <Login />;
// //   // if (!currentUser) {
// //   //   window.location.href = '/';
// //   //   return null;
// //   // }


// //   const renderDash = () => {
// //     switch (currentUser.role) {
// //       case 'technician': return <TechnicianDash active={active} />;
// //       case 'administrator': return <AdminDash active={active} />;
// //       case 'instructor': return <InstructorDash active={active} />;
// //       case 'accounts': return <AccountsDash active={active} />;
// //       case 'student': return <StudentDash active={active} />;
// //       default: return null;
// //     }
// //   };

// //   return (
// //     <div className="min-h-screen bg-slate-50 flex">
// //       {/* Mobile overlay */}
// //       {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

// //       {/* Sidebar */}
// //       <div className={`fixed md:sticky top-0 z-50 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
// //         <Sidebar active={active} setActive={(k) => { setActive(k); setMobileOpen(false); }} />
// //       </div>

// //       {/* Main */}
// //       <main className="flex-1 min-w-0">
// //         {/* Top bar */}
// //         <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
// //           <div className="flex items-center gap-3">
// //             <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 hover:bg-slate-100 rounded">
// //               {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
// //             </button>
// //             <div>
// //               <h2 className="text-sm font-semibold text-slate-900 capitalize">{currentUser.role} Portal</h2>
// //               <p className="text-xs text-slate-500">Examination Management System</p>
// //             </div>
// //           </div>
// //           <div className="flex items-center gap-3">
// //             <button className="p-2 hover:bg-slate-100 rounded-lg relative">
// //               <Bell className="w-5 h-5 text-slate-600" />
// //             </button>
// //             <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
// //               <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">{currentUser.name.charAt(0)}</div>
// //               <div>
// //                 <p className="text-sm font-medium text-slate-900">{currentUser.name}</p>
// //                 <p className="text-xs text-slate-500 capitalize">{currentUser.role}</p>
// //               </div>
// //             </div>
// //           </div>
// //         </header>

// //         <div className="p-6">{renderDash()}</div>
// //       </main>
// //     </div>
// //   );
// // };

// // export default AppLayout;
