import React, { useState } from 'react';
import ProgramManagement from './ProgramManagement';
import InstructorManagement from './InstructorManagement';
import StudentManagement from './StudentManagement';
import ResultsManagement from './ResultsManagement';
import SessionManagement from './SessionManagement';
import AdminDashboard from './AdminDashboard';
import ResultHistory from './ResultHistory';

const AdminDash: React.FC<{ active: string }> = ({ active }) => {
  const [toast, setToast] = useState('');

  if (active === 'dashboard') {
    return <AdminDashboard toast={toast} setToast={setToast} />;
  }

  if (active === 'students') {
    return <StudentManagement toast={toast} setToast={setToast} />;
  }

  if (active === 'instructors') {
    return <InstructorManagement toast={toast} setToast={setToast} />;
  }

  if (active === 'sessions') {
    return <SessionManagement toast={toast} setToast={setToast} />;
  }

  if (active === 'results') {
    return <ResultsManagement toast={toast} setToast={setToast} />;
  }

  if (active === 'programs') {
    return <ProgramManagement toast={toast} setToast={setToast} />;
  }
   if (active === 'history') {
    return <ResultHistory toast={toast} setToast={setToast} />;
  }

  return null;
};

export default AdminDash;