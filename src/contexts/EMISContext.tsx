import React, { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'technician' | 'administrator' | 'instructor' | 'accounts' | 'student';

export interface User {
  id: string;
  name: string;
  email?: string;
  regNumber?: string;
  role: Role;
  active: boolean;
  createdAt: string;
  program?: string;
 level?: string;
}

export interface Student extends User {
  role: 'student';
  regNumber: string;
}

export interface AcademicSession {
  id: string;
  year: string;
  start_date: string;
  end_date: string;
  active: boolean;
  registration_open?: boolean;
  registration_start_date?: string;
  registration_end_date?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  level?: number;
  credits: number;
  instructorId: string | null;
   pass_mark?: number; 
}

export interface Result {
  id: string;
  studentId: string;
  studentReg: string;
  courseId: string;
  courseName?: string;
  sessionId: string;
  marks: number | null;
  grade: string;
  status: string;
  level?: number;
  createdAt: string;
  academic_session_id?: number;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

interface EMISState {
  currentUser: User | null;
  loading: boolean;
  users: User[];
  students: Student[];
  sessions: AcademicSession[];
  courses: Course[];
  results: Result[];
  audits: AuditLog[];
  programsList: any[];
  feeStructuresList: any[];
  eligibleLevels: any[];
  myRegistrations: any[];
  myInvoices: any[];
  canRegister: boolean;
  registrationReason: string;
  currentRegistrationPeriod: any;
  repeatersList: any[];
  login: (identifier: string, password: string, type: 'staff' | 'student') => Promise<User | null>;
  logout: () => void;
  refresh: () => Promise<void>;
  addUser: (u: { name: string; email: string; password: string; role: Role; active: boolean }) => Promise<void>;
  updateUser: (id: string, u: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addStudent: (s: { name: string; password: string; program?: string; level?: string; active: boolean; email?: string }) => Promise<void>;
  updateStudent: (id: string, s: Partial<Student> & { password?: string }) => Promise<void>;
  addSession: (s: Omit<AcademicSession, 'id'>) => Promise<void>;
  updateSession: (id: string, session: Partial<AcademicSession>) => Promise<void>;
  addCourse: (c: Omit<Course, 'id'>) => Promise<void>;
  addResult: (r: any) => Promise<void>;
  updateResult: (id: string, r: any) => Promise<void>;
  approveResult: (id: string) => Promise<void>;
  apiRequest: (endpoint: string, method?: string, body?: any) => Promise<any>;
  fetchProgramsGlobal: () => Promise<void>;
  fetchRegistrationData: (studentId: string) => Promise<void>;
}

const EMISContext = createContext<EMISState | undefined>(undefined);

const API_BASE = 'http://localhost:8000/api';
// const API_BASE = 'https://emis-backend.onrender.com/api';

const getToken = () => localStorage.getItem('api_token');

// const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
//   const headers: any = {
//     'Content-Type': 'application/json',
//   };

//   const token = getToken();
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   const response = await fetch(`${API_BASE}${endpoint}`, {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : undefined,
//   });

//   if (response.status === 401) {
//     localStorage.removeItem('api_token');
//     localStorage.removeItem('emis_user');
//     window.location.href = '/login/student';
//     throw new Error('Session expired. Please login again.');
//   }

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || 'API request failed');
//   }

//   return data;
// };

const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = getToken();
  console.log(`[apiRequest] ${method} ${endpoint} - Token:`, token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

  const headers: any = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  console.log(`[apiRequest] Response status: ${response.status} for ${endpoint}`);

  if (response.status === 401) {
    console.log(`[apiRequest] 401 on ${endpoint} - Token may be invalid`);
    localStorage.removeItem('api_token');
    localStorage.removeItem('emis_user');
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

// const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
//   const headers: any = {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',  // ← ADD THIS LINE
//   };

//   const token = getToken();
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   const response = await fetch(`${API_BASE}${endpoint}`, {
//     method,
//     headers,
//     body: body ? JSON.stringify(body) : undefined,
//   });

//   if (response.status === 401) {
//     localStorage.removeItem('api_token');
//     localStorage.removeItem('emis_user');

//     throw new Error('Session expired. Please login again.');
//   }

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data.message || 'API request failed');
//   }

//   return data;
// };

export const EMISProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [repeatersList, setRepeatersList] = useState<any[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);
  // const [programsList, setProgramsList] = useState<any[]>([]);
  const [programsList, setProgramsList] = useState<any[] | null>(null);
  const [feeStructuresList, setFeeStructuresList] = useState<any[]>([]);
  // Add states
  const [eligibleLevels, setEligibleLevels] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [myInvoices, setMyInvoices] = useState<any[]>([]);
  const [canRegister, setCanRegister] = useState(false);
  const [registrationReason, setRegistrationReason] = useState('');
  const [currentRegistrationPeriod, setCurrentRegistrationPeriod] = useState<any>(null);

  const refresh = async () => {
    try {
      const [usersData, studentsData, sessionsData, coursesData, resultsData, repeatersData, auditsData, programsData, feeStructuresData] = await Promise.all([
        apiRequest('/users').catch(() => ({ data: [] })),
        apiRequest('/students').catch(() => ({ data: [] })),
        apiRequest('/sessions').catch(() => ({ data: [] })),
        apiRequest('/courses').catch(() => ({ data: [] })),
        // apiRequest('/results/student').catch(() => ({ data: [] })),
        apiRequest('/results/all').catch(() => ({ data: [] })),
        apiRequest('/results/repeaters').catch(() => ({ data: [] })),
        apiRequest('/audits').catch(() => ({ data: [] })),
        apiRequest('/programs').catch(() => ({ data: [] })),
        apiRequest('/fee-structures').catch(() => ({ data: [] })),
      ]);

      // if (usersData.data) setUsers(usersData.data);
      if (usersData.data) {
        const mappedUsers = usersData.data.map((u: any) => ({
          ...u,
          createdAt: u.created_at,
        }));
        setUsers(mappedUsers);
      }
      if (studentsData.data) {
        const mapped = studentsData.data.map((s: any) => ({
          ...s,
          regNumber: s.reg_number,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
        setStudents(mapped);
      }
      if (sessionsData.data) setSessions(sessionsData.data);
      if (coursesData.data) setCourses(coursesData.data);
      if (resultsData.data) {
        console.log('Results fetched and set:', resultsData.data);
        const mappedResults = resultsData.data.map((r: any) => ({
          ...r,
          courseName: r.course_name,
          studentId: r.student_id,
        }));
        setResults(mappedResults);
      }
      if (repeatersData.data) setRepeatersList(repeatersData.data);
      // if (resultsData.data) setResults(resultsData.data);
      if (auditsData.data) setAudits(auditsData.data);
      if (programsData.data) setProgramsList(programsData.data);
      if (feeStructuresData.data) setFeeStructuresList(feeStructuresData.data);
    } catch (error) {
      console.error('Refresh error:', error);
    }


  };



  const fetchProgramsGlobal = async () => {
    try {
      const response = await apiRequest('/programs');
      if (response.data) {
        setProgramsList(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  // Add fetch function
  const fetchRegistrationData = async (studentId: string) => {
    try {
      const [periodRes, eligibleRes, canRegisterRes, registrationsRes, invoicesRes] = await Promise.all([
        apiRequest('/registration/period'),
        apiRequest(`/registration/eligible-levels/${studentId}`),
        apiRequest(`/registration/can-register/${studentId}`),
        apiRequest(`/registration/my-registrations/${studentId}`),
        apiRequest(`/registration/my-invoices/${studentId}`)
      ]);
      if (periodRes.data) setCurrentRegistrationPeriod(periodRes.data);
      if (eligibleRes.data) setEligibleLevels(eligibleRes.data);
      if (canRegisterRes.data) {
        setCanRegister(canRegisterRes.data.canRegister);
        setRegistrationReason(canRegisterRes.data.reason || '');
      }
      if (registrationsRes.data) setMyRegistrations(registrationsRes.data);
      if (invoicesRes.data) setMyInvoices(invoicesRes.data);
    } catch (error) {
      console.error('Failed to fetch registration data:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const savedUser = localStorage.getItem('emis_user');
      const savedToken = localStorage.getItem('api_token');

      if (savedUser && savedToken) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          // setCurrentUser(JSON.parse(savedUser));
          await refresh();  // Only this line - wait for data to load
          //  await fetchRegistrationData(user.id); 
          if (user.role === 'student') {
            await fetchRegistrationData(user.id);
          }
        } catch (e) {
          console.error('Restore session error:', e);
        }
      }

      // if (savedUser && savedToken) {
      //   try {
      //     setCurrentUser(JSON.parse(savedUser));
      //     // Show UI immediately by setting loading false
      //   setLoading(false);
      //   // Load data in background (don't await)
      //   refresh();
      //     await refresh();
      //   } catch (e) {
      //     console.error('Restore session error:', e);
      //   }
      // }
      setLoading(false);
    };
    init();
  }, []);

  const persistUser = (u: User | null, token?: string) => {
    if (u && token) {
      localStorage.setItem('emis_user', JSON.stringify(u));
      localStorage.setItem('api_token', token);
    } else {
      localStorage.removeItem('emis_user');
      localStorage.removeItem('api_token');
    }
    setCurrentUser(u);
  };

  const login = async (identifier: string, password: string, type: 'staff' | 'student'): Promise<User | null> => {
    try {
      let endpoint = '';
      let body = {};

      if (type === 'staff') {
        endpoint = '/login/staff';
        body = { email: identifier, password };
      } else {
        endpoint = '/login/student';
        body = { reg_number: identifier, password };
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        const user: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role || (type === 'student' ? 'student' : 'staff'),
          active: true,
          createdAt: new Date().toISOString(),
          regNumber: data.user.reg_number,
          program: data.user.program,
          level: data.user.level
        };
        persistUser(user, data.token);
        await refresh();     // Wait for data to load first
        // await fetchRegistrationData(user.id);
        if (user.role === 'student') {
          await fetchRegistrationData(user.id);
        }
        setLoading(false);   // Then set loading to false
        return user;
      }

      //     if (data.success) {
      //       const user: User = {
      //         id: data.user.id,
      //         name: data.user.name,
      //         email: data.user.email,
      //         role: data.user.role || (type === 'student' ? 'student' : 'staff'),
      //         active: true,
      //         createdAt: new Date().toISOString(),
      //         regNumber: data.user.reg_number,
      //         program: data.user.program,  // Add this line
      //   level: data.user.level       // Add this line
      //       };
      //       persistUser(user, data.token);
      //       // Show UI immediately
      // // setLoading(false);
      // // Load data in background
      // refresh();
      //       // await refresh();
      //       return user;
      //     }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const logout = async () => {
     localStorage.clear();
    
    // Clear local data immediately (makes logout instant)
    persistUser(null);

    // Call API in background (don't wait)
    try {
      await apiRequest('/logout', 'POST');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // const logout = async () => {
  //   try {
  //     await apiRequest('/logout', 'POST');
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   }
  //   persistUser(null);
  // };

  const addUser = async (u: { name: string; email: string; password: string; role: Role; active: boolean }) => {
    const data = await apiRequest('/users', 'POST', u);
    if (data.data) {
      setUsers(prev => [...prev, data.data]);
    }
  };

  const updateUser = async (id: string, u: Partial<User> & { password?: string }) => {
    const data = await apiRequest(`/users/${id}`, 'PUT', u);
    if (data.data) {
      setUsers(prev => prev.map(user => user.id === id ? data.data : user));
    }
  };

  const deleteUser = async (id: string) => {
    await apiRequest(`/users/${id}`, 'DELETE');
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const addStudent = async (s: { name: string; password: string; program?: string; level?: string; active: boolean; email?: string }) => {
    const data = await apiRequest('/students', 'POST', s);
    if (data.data) {
      const mapped = {
        ...data.data,
        regNumber: data.data.reg_number,
        createdAt: data.data.created_at,
        updatedAt: data.data.updated_at
      };
      setStudents(prev => [...prev, mapped]);
    }
  };

  const updateStudent = async (id: string, s: Partial<Student> & { password?: string }) => {
    const data = await apiRequest(`/students/${id}`, 'PUT', s);
    if (data.data) {
      setStudents(prev => prev.map(student => student.id === id ? data.data : student));
    }
  };

  const addSession = async (s: Omit<AcademicSession, 'id'>) => {
    const data = await apiRequest('/sessions', 'POST', s);
    if (data.data) {
      setSessions(prev => [data.data, ...prev]);
    }
  };

  // const updateSession = async (id: string, session: Partial<AcademicSession>) => {
  //   const data = await apiRequest(`/sessions/${id}`, 'PUT', session);
  //   if (data.data) {
  //     setSessions(prev => prev.map(s => s.id === id ? data.data : s));
  //   }
  // };
  const updateSession = async (id: string, session: Partial<AcademicSession>) => {
    // If we're setting active to false (ending the session)
    if (session.active === false) {
      // Call the endSession endpoint
      const data = await apiRequest(`/sessions/${id}/end`, 'POST');
      if (data.data) {
        // Refresh all data after session ends
        await refresh();
        if (currentUser?.role === 'student') {
          await fetchRegistrationData(currentUser.id);
        }
        setSessions(prev => prev.map(s => s.id === id ? data.data.session : s));
      }
    } else {
      // Normal update
      const data = await apiRequest(`/sessions/${id}`, 'PUT', session);
      if (data.data) {
        setSessions(prev => prev.map(s => s.id === id ? data.data : s));
      }
    }
  };

  const addCourse = async (c: Omit<Course, 'id'>) => {
    const data = await apiRequest('/courses', 'POST', c);
    if (data.data) {
      setCourses(prev => [...prev, data.data]);
    }
  };

  const addResult = async (r: any) => {
    const data = await apiRequest('/results', 'POST', r);
    if (data.data) {
      setResults(prev => [...prev, data.data]);
    }
  };

  // const updateResult = async (id: string, r: any) => {
  //   const data = await apiRequest(`/results/${id}`, 'PUT', r);
  //   if (data.data) {
  //     setResults(prev => prev.map(res => res.id === id ? data.data : res));
  //   }
  // };

  const updateResult = async (id: string, r: any) => {
    const data = await apiRequest(`/results/${id}`, 'PUT', r);
    if (data.data) {
      const mappedResult = {
        ...data.data,
        courseName: data.data.course_name,
        studentId: data.data.student_id,
        marks: data.data.marks,
        grade: data.data.grade,
        status: data.data.status
      };
      setResults(prev => prev.map(res => res.id === id ? mappedResult : res));
    }
  };

  // const approveResult = async (id: string) => {
  //     const data = await apiRequest(`/results/${id}/publish`, 'POST');
  //     if (data.data) {
  //         setResults(prev => prev.map(r => r.id === id ? data.data : r));
  //     }
  // };

  const approveResult = async (id: string) => {
    const data = await apiRequest(`/results/${id}/publish`, 'POST');
    if (data.data) {
      // Map the response to match your Result interface
      const mappedResult = {
        ...data.data,
        courseName: data.data.course_name,
        studentId: data.data.student_id,
        marks: data.data.marks,
        grade: data.data.grade,
        status: data.data.status
      };
      setResults(prev => prev.map(r => r.id === id ? mappedResult : r));
    }
  };

  return (
    <EMISContext.Provider value={{
      currentUser,
      loading,
      users,
      students,
      sessions,
      courses,
      results,
      audits,
      programsList,
      feeStructuresList,
      eligibleLevels,
      myRegistrations,
      myInvoices,
      canRegister,
      registrationReason,
      currentRegistrationPeriod,
      repeatersList,
      login,
      logout,
      refresh,
      addUser,
      updateUser,
      deleteUser,
      addStudent,
      updateStudent,
      addSession,
      updateSession,
      addCourse,
      addResult,
      updateResult,
      approveResult,
      apiRequest,
      fetchProgramsGlobal,
      fetchRegistrationData,
    }}>
      {children}
    </EMISContext.Provider>
  );
};

export const useEMIS = () => {
  const ctx = useContext(EMISContext);
  if (!ctx) throw new Error('useEMIS must be used within EMISProvider');
  return ctx;
};
