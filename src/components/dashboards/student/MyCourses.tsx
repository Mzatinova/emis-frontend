import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Badge } from '@/components/shared/UI';
import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';

const MyCourses: React.FC = () => {
  const { currentUser, myInvoices, fetchRegistrationData, sessions } = useEMIS();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (currentUser?.id) {
        await fetchRegistrationData(currentUser.id);
      }
      setLoading(false);
    };
    loadData();
  }, [currentUser?.id]);

  // Same hardcoded courses as registration
  const allCourses = ['Practical', 'Occupation', 'Fundamentals'];

  // Get current session
  const currentSession = sessions.find(s => s.active === true);

  // Get invoices for current session
  const currentInvoices = myInvoices.filter(inv => 
    String(inv.academic_session_id) === String(currentSession?.id)
  );

  // Get courses from hardcoded list based on invoice level
  const courseList = currentInvoices.flatMap(inv => {
    return allCourses.map(name => ({
      id: `${inv.id}-${name}`,
      name: name,
      code: name.substring(0, 4).toUpperCase(),
      level: inv.level,
      status: inv.status || 'pending',
      invoiceId: inv.id
    }));
  });

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge status="success">Approved</Badge>;
      case 'pending':
        return <Badge status="warning">Pending</Badge>;
      case 'paid':
        return <Badge status="info">Receipt Uploaded</Badge>;
      case 'rejected':
        return <Badge status="error">Rejected</Badge>;
      default:
        return <Badge status="default">{status || 'Pending'}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'paid':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-slate-500">Loading your courses...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Courses"
        subtitle="View all your registered courses for the current session"
      />

      {courseList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700">No Courses Yet</h3>
          <p className="text-slate-500 mt-1">
            You haven't registered for any courses this session.
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Go to Registration tab to register for your courses.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courseList.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(course.status)}
                    <h4 className="font-semibold text-slate-900">
                      {course.name}
                    </h4>
                  </div>
              
                  {course.level && (
                    <p className="text-sm text-slate-500">Level: {course.level}</p>
                  )}
                  <div className="mt-3">
                    {getStatusBadge(course.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;

// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Badge } from '@/components/shared/UI';
// import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';

// const MyCourses: React.FC = () => {
//   const { currentUser, myRegistrations, fetchRegistrationData, sessions } = useEMIS();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       if (currentUser?.id) {
//         await fetchRegistrationData(currentUser.id);
//       }
//       setLoading(false);
//     };
//     loadData();
//   }, [currentUser?.id]);

//   // Get current session
//   const currentSession = sessions.find(s => s.active === true);

//   // Get ALL registrations for current session (pending + approved)
//   const currentRegistrations = myRegistrations.filter(reg => 
//     String(reg.academic_session_id) === String(currentSession?.id)
//   );

//   // Get courses from registrations
//   const courses = currentRegistrations.flatMap(reg => {
//     if (reg.courses && Array.isArray(reg.courses)) {
//       return reg.courses.map((course: any) => ({
//         id: course.id || reg.id,
//         name: course.name || course.course_name || 'Course',
//         status: reg.registration_status || 'pending',
//         level: reg.level,
//       }));
//     }
//     return [{
//       id: reg.id,
//       name: `Level ${reg.level} Courses`,
//       status: reg.registration_status || 'pending',
//       level: reg.level,
//     }];
//   });

//   const getStatusBadge = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'approved':
//         return <Badge status="success">Approved</Badge>;
//       case 'pending':
//         return <Badge status="warning">Pending</Badge>;
//       case 'rejected':
//         return <Badge status="error">Rejected</Badge>;
//       default:
//         return <Badge status="default">{status || 'Pending'}</Badge>;
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'approved':
//         return <CheckCircle className="w-5 h-5 text-emerald-600" />;
//       case 'pending':
//         return <Clock className="w-5 h-5 text-amber-600" />;
//       case 'rejected':
//         return <XCircle className="w-5 h-5 text-red-600" />;
//       default:
//         return <BookOpen className="w-5 h-5 text-slate-600" />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="p-8 text-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
//         <p className="mt-2 text-slate-500">Loading your courses...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <PageHeader
//         title="My Courses"
//         subtitle="View all your registered courses for the current session"
//       />

//       {courses.length === 0 ? (
//         <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
//           <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-slate-700">No Courses Yet</h3>
//           <p className="text-slate-500 mt-1">
//             You haven't registered for any courses this session.
//           </p>
//           <p className="text-sm text-slate-400 mt-1">
//             Go to Registration tab to register for your courses.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {courses.map((course, index) => (
//             <div
//               key={course.id || index}
//               className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-2">
//                     {getStatusIcon(course.status)}
//                     <h4 className="font-semibold text-slate-900">
//                       {course.name}
//                     </h4>
//                   </div>
//                   {course.level && (
//                     <p className="text-sm text-slate-500">Level: {course.level}</p>
//                   )}
//                   <div className="mt-3">
//                     {getStatusBadge(course.status)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyCourses;

// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Badge } from '@/components/shared/UI';
// import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';

// const MyCourses: React.FC = () => {
//   const { currentUser, myRegistrations, fetchRegistrationData, sessions } = useEMIS();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       if (currentUser?.id) {
//         await fetchRegistrationData(currentUser.id);
//       }
//       setLoading(false);
//     };
//     loadData();
//   }, [currentUser?.id]);

//   // Get current session
//   const currentSession = sessions.find(s => s.active === true);

//   // Get registrations for current session only
//   const currentRegistrations = myRegistrations.filter(reg => 
//     String(reg.academic_session_id) === String(currentSession?.id)
//   );

//   // Get courses from registrations
//   const courses = currentRegistrations.flatMap(reg => {
//     if (reg.courses && Array.isArray(reg.courses)) {
//       return reg.courses.map((course: any) => ({
//         id: course.id || reg.id,
//         name: course.name || course.course_name || 'Course',
//         status: reg.registration_status || 'pending',
//         level: reg.level,
//       }));
//     }
//     // If no courses array, show level as course
//     return [{
//       id: reg.id,
//       name: `Level ${reg.level} Registration`,
//       status: reg.registration_status || 'pending',
//       level: reg.level,
//     }];
//   });

//   const getStatusBadge = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'approved':
//         return <Badge status="success">Approved</Badge>;
//       case 'pending':
//         return <Badge status="warning">Pending</Badge>;
//       case 'rejected':
//         return <Badge status="error">Rejected</Badge>;
//       default:
//         return <Badge status="default">{status || 'Pending'}</Badge>;
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'approved':
//         return <CheckCircle className="w-5 h-5 text-emerald-600" />;
//       case 'pending':
//         return <Clock className="w-5 h-5 text-amber-600" />;
//       case 'rejected':
//         return <XCircle className="w-5 h-5 text-red-600" />;
//       default:
//         return <BookOpen className="w-5 h-5 text-slate-600" />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="p-8 text-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
//         <p className="mt-2 text-slate-500">Loading your courses...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <PageHeader
//         title="My Courses"
//         subtitle="View all your registered courses for the current session"
//       />

//       {courses.length === 0 ? (
//         <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
//           <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-slate-700">No Courses Yet</h3>
//           <p className="text-slate-500 mt-1">
//             You haven't registered for any courses this session.
//           </p>
//           <p className="text-sm text-slate-400 mt-1">
//             Go to Registration tab to register for your courses.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {courses.map((course, index) => (
//             <div
//               key={course.id || index}
//               className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-2">
//                     {getStatusIcon(course.status)}
//                     <h4 className="font-semibold text-slate-900">
//                       {course.name}
//                     </h4>
//                   </div>
//                   {course.level && (
//                     <p className="text-sm text-slate-500">Level: {course.level}</p>
//                   )}
//                   <div className="mt-3">
//                     {getStatusBadge(course.status)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyCourses;

// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Badge } from '@/components/shared/UI';
// import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react';

// const MyCourses: React.FC = () => {
//   const { currentUser, results, fetchRegistrationData } = useEMIS();
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       if (currentUser?.id) {
//         await fetchRegistrationData(currentUser.id);
//       }
//       setLoading(false);
//     };
//     loadData();
//   }, [currentUser?.id]);

//   // Get student's results
//   const studentResults = results.filter(r => String(r.studentId) === String(currentUser?.id));

//   // Map results to courses with status
//   const courses = studentResults.map(r => ({
//     id: r.id,
//   name: r.courseName || 'Course',
//     status: r.status || 'pending',
//     level: r.level,
//     marks: r.marks,
//     grade: r.grade,
//   }));

//   const getStatusBadge = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'approved':
//       case 'published':
//         return <Badge status="success">Approved</Badge>;
//       case 'pending':
//         return <Badge status="warning">Pending</Badge>;
//       case 'rejected':
//         return <Badge status="error">Rejected</Badge>;
//       default:
//         return <Badge status="default">{status || 'Pending'}</Badge>;
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status?.toLowerCase()) {
//       case 'approved':
//       case 'published':
//         return <CheckCircle className="w-5 h-5 text-emerald-600" />;
//       case 'pending':
//         return <Clock className="w-5 h-5 text-amber-600" />;
//       case 'rejected':
//         return <XCircle className="w-5 h-5 text-red-600" />;
//       default:
//         return <BookOpen className="w-5 h-5 text-slate-600" />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="p-8 text-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
//         <p className="mt-2 text-slate-500">Loading your courses...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <PageHeader
//         title="My Courses"
//         subtitle="View all your registered courses and their status"
//       />

//       {courses.length === 0 ? (
//         <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
//           <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
//           <h3 className="text-lg font-semibold text-slate-700">No Courses Yet</h3>
//           <p className="text-slate-500 mt-1">
//             You haven't registered for any courses yet.
//           </p>
//           <p className="text-sm text-slate-400 mt-1">
//             Go to Registration tab to register for your courses.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           {courses.map((course) => (
//             <div
//               key={course.id}
//               className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-2">
//                     {getStatusIcon(course.status)}
//                     <h4 className="font-semibold text-slate-900">
//                       {course.name}
//                     </h4>
//                   </div>
//                   {course.level && (
//                     <p className="text-sm text-slate-500">Level: {course.level}</p>
//                   )}
//                   {course.marks !== null && course.marks !== undefined && (
//                     <p className="text-sm text-slate-500">Marks: {course.marks}</p>
//                   )}
//                   {course.grade && (
//                     <p className="text-sm text-slate-500">Grade: {course.grade}</p>
//                   )}
//                   <div className="mt-3">
//                     {getStatusBadge(course.status)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyCourses;