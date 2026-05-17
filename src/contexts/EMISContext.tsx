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
  active: boolean;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  instructorId: string | null;
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
  createdAt: string;
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
  
}

const EMISContext = createContext<EMISState | undefined>(undefined);

const API_BASE = 'http://localhost:8000/api';

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
  const headers: any = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',  // ← ADD THIS LINE
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
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

export const EMISProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [audits, setAudits] = useState<AuditLog[]>([]);

  const refresh = async () => {
    try {
      const [usersData, studentsData, sessionsData, coursesData, resultsData, auditsData] = await Promise.all([
        apiRequest('/users').catch(() => ({ data: [] })),
        apiRequest('/students').catch(() => ({ data: [] })),
        apiRequest('/sessions').catch(() => ({ data: [] })),
        apiRequest('/courses').catch(() => ({ data: [] })),
        // apiRequest('/results/student').catch(() => ({ data: [] })),
        apiRequest('/results/all').catch(() => ({ data: [] })),
        apiRequest('/audits').catch(() => ({ data: [] })),
      ]);

      if (usersData.data) setUsers(usersData.data);
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
      // if (resultsData.data) setResults(resultsData.data);
      if (auditsData.data) setAudits(auditsData.data);
    } catch (error) {
      console.error('Refresh error:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const savedUser = localStorage.getItem('emis_user');
      const savedToken = localStorage.getItem('api_token');

      if (savedUser && savedToken) {
        try {
          setCurrentUser(JSON.parse(savedUser));
          await refresh();
        } catch (e) {
          console.error('Restore session error:', e);
        }
      }
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
        };
        persistUser(user, data.token);
        await refresh();
        return user;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  const logout = async () => {
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

  const updateSession = async (id: string, session: Partial<AcademicSession>) => {
    const data = await apiRequest(`/sessions/${id}`, 'PUT', session);
    if (data.data) {
      setSessions(prev => prev.map(s => s.id === id ? data.data : s));
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

const updateResult = async (id: string, r: any) => {
  const data = await apiRequest(`/results/${id}`, 'PUT', r);
  if (data.data) {
    setResults(prev => prev.map(res => res.id === id ? data.data : res));
  }
};

const approveResult = async (id: string) => {
    const data = await apiRequest(`/results/${id}/publish`, 'POST');
    if (data.data) {
        setResults(prev => prev.map(r => r.id === id ? data.data : r));
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
