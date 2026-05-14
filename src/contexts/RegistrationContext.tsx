// src/contexts/RegistrationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useEMIS } from './EMISContext';

export interface FeeStructure {
    id: string;
    programId: string;
    programName: string;
    level: number;
    amount: number;
}

export interface RegistrationPeriod {
    id: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    academicSessionId: string;
    academicYear: string;
}

export interface Invoice {
    id: string;
    studentId: string;
    studentReg: string;
    studentName: string;
    programId: string;
    programName: string;
    level: number;
    amount: number;
    type: 'full_level' | 'repeater';
    failedCourses?: string[];
    receiptImage?: string;
    status: 'pending' | 'paid' | 'approved' | 'rejected';
    physicalVerified: boolean;
    rejectionReason?: string;
    approvedBy?: string;
    approvedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface StudentRegistration {
    id: string;
    studentId: string;
    studentReg: string;
    studentName: string;
    programId: string;
    programName: string;
    level: number;
    invoiceId: string;
    registrationStatus: 'pending' | 'approved' | 'rejected';
    approvedAt?: string;
    registeredAt: string;
}

export interface StudentProgress {
    studentId: string;
    completedLevels: number[];
    failedCourses: {
        level: number;
        courseName: string;
        sessionId: string;
        sessionYear: string;
    }[];
}

interface RegistrationState {
    feeStructures: FeeStructure[];
    registrationPeriods: RegistrationPeriod[];
    invoices: Invoice[];
    registrations: StudentRegistration[];
    studentProgress: StudentProgress[];
    currentRegistrationPeriod: RegistrationPeriod | null;
    loading: boolean;
    // Actions
    addFeeStructure: (fee: Omit<FeeStructure, 'id'>) => Promise<void>;
    updateFeeStructure: (id: string, fee: Partial<FeeStructure>) => Promise<void>;
    deleteFeeStructure: (id: string) => Promise<void>;
    getFeeByProgramAndLevel: (programId: string, level: number) => FeeStructure | undefined;
    setRegistrationPeriod: (period: Omit<RegistrationPeriod, 'id'>) => Promise<void>;
    updateRegistrationPeriod: (id: string, period: Partial<RegistrationPeriod>) => Promise<void>;
    extendRegistrationPeriod: (id: string, days: number) => Promise<void>;
    createInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Invoice>;
    uploadReceipt: (invoiceId: string, imageBase64: string) => Promise<void>;
    verifyPaymentPhysical: (invoiceId: string, verifiedBy: string) => Promise<void>;
    approveInvoice: (invoiceId: string, approvedBy: string) => Promise<void>;
    rejectInvoice: (invoiceId: string, reason: string) => Promise<void>;
    registerStudent: (studentId: string, level: number, type: 'full_level' | 'repeater', failedCourses?: string[]) => Promise<StudentRegistration>;
    getStudentRegistrations: (studentId: string) => StudentRegistration[];
    getStudentInvoices: (studentId: string) => Invoice[];
    getStudentProgress: (studentId: string) => StudentProgress | undefined;
    getEligibleLevels: (studentId: string) => { level: number; eligible: boolean; reason?: string; isRepeater: boolean; failedCourses?: string[] }[];
    canStudentRegister: (studentId: string) => { canRegister: boolean; reason?: string };
    getPendingInvoices: () => Invoice[];
    getAllRegistrations: () => StudentRegistration[];
    fetchInvoices: () => Promise<void>;
}

const RegistrationContext = createContext<RegistrationState | undefined>(undefined);

export const useRegistration = () => {
    const ctx = useContext(RegistrationContext);
    if (!ctx) throw new Error('useRegistration must be used within RegistrationProvider');
    return ctx;
};

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { apiRequest } = useEMIS();
    
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [registrationPeriods, setRegistrationPeriods] = useState<RegistrationPeriod[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
    const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch invoices from backend
    const fetchInvoices = async () => {
        try {
            const response = await apiRequest('/invoices');
            if (response.data) {
                setInvoices(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        }
    };

    // Load data from localStorage and backend
    useEffect(() => {
        const loadData = async () => {
            const savedFeeStructures = localStorage.getItem('emis_fee_structures');
            const savedPeriods = localStorage.getItem('emis_registration_periods');
            const savedRegistrations = localStorage.getItem('emis_registrations');
            const savedProgress = localStorage.getItem('emis_student_progress');

            if (savedFeeStructures) setFeeStructures(JSON.parse(savedFeeStructures));
            if (savedPeriods) setRegistrationPeriods(JSON.parse(savedPeriods));
            if (savedRegistrations) setRegistrations(JSON.parse(savedRegistrations));
            if (savedProgress) setStudentProgress(JSON.parse(savedProgress));
            
            // Fetch invoices from backend
            await fetchInvoices();
            
            setLoading(false);
        };
        loadData();
    }, []);

    const saveFeeStructures = (data: FeeStructure[]) => {
        setFeeStructures(data);
        localStorage.setItem('emis_fee_structures', JSON.stringify(data));
    };

    const savePeriods = (data: RegistrationPeriod[]) => {
        setRegistrationPeriods(data);
        localStorage.setItem('emis_registration_periods', JSON.stringify(data));
    };

    const saveRegistrations = (data: StudentRegistration[]) => {
        setRegistrations(data);
        localStorage.setItem('emis_registrations', JSON.stringify(data));
    };

    const saveProgress = (data: StudentProgress[]) => {
        setStudentProgress(data);
        localStorage.setItem('emis_student_progress', JSON.stringify(data));
    };

    // ADD THIS FUNCTION:
const saveInvoices = (data: Invoice[]) => {
    setInvoices(data);
    localStorage.setItem('emis_invoices', JSON.stringify(data));
};

    const currentRegistrationPeriod = registrationPeriods.find(p => p.isActive && new Date(p.endDate) > new Date());

    const addFeeStructure = async (fee: Omit<FeeStructure, 'id'>) => {
        const newFee = { ...fee, id: Date.now().toString() };
        saveFeeStructures([...feeStructures, newFee]);
    };

    const updateFeeStructure = async (id: string, fee: Partial<FeeStructure>) => {
        const updated = feeStructures.map(f => f.id === id ? { ...f, ...fee } : f);
        saveFeeStructures(updated);
    };

    const deleteFeeStructure = async (id: string) => {
        saveFeeStructures(feeStructures.filter(f => f.id !== id));
    };

    const getFeeByProgramAndLevel = (programId: string, level: number) => {
        return feeStructures.find(f => f.programId === programId && f.level === level);
    };

    const setRegistrationPeriod = async (period: Omit<RegistrationPeriod, 'id'>) => {
        const newPeriod = { ...period, id: Date.now().toString() };
        savePeriods([...registrationPeriods, newPeriod]);
    };

    const updateRegistrationPeriod = async (id: string, period: Partial<RegistrationPeriod>) => {
        const updated = registrationPeriods.map(p => p.id === id ? { ...p, ...period } : p);
        savePeriods(updated);
    };

    const extendRegistrationPeriod = async (id: string, days: number) => {
        const period = registrationPeriods.find(p => p.id === id);
        if (period) {
            const newEndDate = new Date(period.endDate);
            newEndDate.setDate(newEndDate.getDate() + days);
            updateRegistrationPeriod(id, { endDate: newEndDate.toISOString() });
        }
    };

    const createInvoice = async (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
        const newInvoice: Invoice = {
            ...data,
            id: Date.now().toString(),
            status: 'pending',
            physicalVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveInvoices([...invoices, newInvoice]);
        return newInvoice;
    };

    const uploadReceipt = async (invoiceId: string, imageBase64: string) => {
        try {
            await apiRequest(`/registration/upload-receipt/${invoiceId}`, 'POST', {
                receipt_image: imageBase64
            });
            await fetchInvoices();
        } catch (error) {
            console.error('Failed to upload receipt:', error);
            throw error;
        }
    };

    const verifyPaymentPhysical = async (invoiceId: string, verifiedBy: string) => {
        try {
            await apiRequest(`/invoices/${invoiceId}/verify-physical`, 'POST', { 
                verifier_id: verifiedBy 
            });
            await fetchInvoices();
        } catch (error) {
            console.error('Failed to verify physical payment:', error);
            throw error;
        }
    };

    const approveInvoice = async (invoiceId: string, approvedBy: string) => {
        try {
            await apiRequest(`/invoices/${invoiceId}/approve`, 'POST', { 
                approver_id: approvedBy 
            });
            await fetchInvoices();
            
            // Also update the corresponding registration
            const registration = registrations.find(r => r.invoiceId === invoiceId);
            if (registration) {
                const updatedReg = registrations.map(r =>
                    r.id === registration.id
                        ? { ...r, registrationStatus: 'approved' as const, approvedAt: new Date().toISOString() }
                        : r
                );
                saveRegistrations(updatedReg);
            }
        } catch (error) {
            console.error('Failed to approve invoice:', error);
            throw error;
        }
    };

    const rejectInvoice = async (invoiceId: string, reason: string) => {
        try {
            await apiRequest(`/invoices/${invoiceId}/reject`, 'POST', { reason });
            await fetchInvoices();
        } catch (error) {
            console.error('Failed to reject invoice:', error);
            throw error;
        }
    };

    const registerStudent = async (studentId: string, level: number, type: 'full_level' | 'repeater', failedCourses?: string[]) => {
        const registration: StudentRegistration = {
            id: Date.now().toString(),
            studentId,
            studentReg: '',
            studentName: '',
            programId: '',
            programName: '',
            level,
            invoiceId: '',
            registrationStatus: 'pending',
            registeredAt: new Date().toISOString(),
        };

        saveRegistrations([...registrations, registration]);
        return registration;
    };

    const getStudentRegistrations = (studentId: string) => {
        return registrations.filter(r => r.studentId === studentId);
    };

    const getStudentInvoices = (studentId: string) => {
        return invoices.filter(i => i.studentId === studentId);
    };

    const getStudentProgress = (studentId: string) => {
        return studentProgress.find(p => p.studentId === studentId);
    };

    const getEligibleLevels = (studentId: string) => {
        const progress = getStudentProgress(studentId);
        const completedLevels = progress?.completedLevels || [];
        const failedCourses = progress?.failedCourses || [];

        const levels = [1, 2, 3, 4];
        const result = [];

        for (const level of levels) {
            if (completedLevels.includes(level)) {
                result.push({ level, eligible: false, reason: 'Already completed this level', isRepeater: false });
                continue;
            }

            const failedInThisLevel = failedCourses.filter(f => f.level === level);
            if (failedInThisLevel.length > 0) {
                result.push({
                    level,
                    eligible: true,
                    reason: `Failed courses: ${failedInThisLevel.map(f => f.courseName).join(', ')} - Register as repeater`,
                    isRepeater: true,
                    failedCourses: failedInThisLevel.map(f => f.courseName)
                });
                continue;
            }

            if (level === 1) {
                result.push({ level, eligible: true, reason: 'Eligible for Level 1', isRepeater: false });
            } else if (completedLevels.includes(level - 1)) {
                result.push({ level, eligible: true, reason: `Completed Level ${level - 1}, eligible for Level ${level}`, isRepeater: false });
            } else {
                result.push({ level, eligible: false, reason: `Must complete Level ${level - 1} first`, isRepeater: false });
            }
        }

        return result;
    };

    const canStudentRegister = (studentId: string) => {
        if (!currentRegistrationPeriod) {
            return { canRegister: false, reason: 'No active registration period' };
        }

        const now = new Date();
        const start = new Date(currentRegistrationPeriod.startDate);
        const end = new Date(currentRegistrationPeriod.endDate);

        if (now < start) {
            return { canRegister: false, reason: `Registration opens on ${start.toLocaleDateString()}` };
        }

        if (now > end) {
            return { canRegister: false, reason: `Registration closed on ${end.toLocaleDateString()}` };
        }

        return { canRegister: true };
    };

    const getPendingInvoices = () => {
        return invoices.filter(i => i.status === 'paid' || (i.status === 'pending' && i.receiptImage));
    };

    const getAllRegistrations = () => {
        return registrations;
    };

    return (
        <RegistrationContext.Provider value={{
            feeStructures,
            registrationPeriods,
            invoices,
            registrations,
            studentProgress,
            currentRegistrationPeriod,
            loading,
            addFeeStructure,
            updateFeeStructure,
            deleteFeeStructure,
            getFeeByProgramAndLevel,
            setRegistrationPeriod,
            updateRegistrationPeriod,
            extendRegistrationPeriod,
            createInvoice,
            uploadReceipt,
            verifyPaymentPhysical,
            approveInvoice,
            rejectInvoice,
            registerStudent,
            getStudentRegistrations,
            getStudentInvoices,
            getStudentProgress,
            getEligibleLevels,
            canStudentRegister,
            getPendingInvoices,
            getAllRegistrations,
            fetchInvoices,
        }}>
            {children}
        </RegistrationContext.Provider>
    );
};

// // src/contexts/RegistrationContext.tsx
// import React, { createContext, useContext, useEffect, useState } from 'react';

// export interface FeeStructure {
//     id: string;
//     programId: string;
//     programName: string;
//     level: number;
//     amount: number;
// }

// export interface RegistrationPeriod {
//     id: string;
//     startDate: string;
//     endDate: string;
//     isActive: boolean;
//     academicSessionId: string;
//     academicYear: string;
// }

// export interface Invoice {
//     id: string;
//     studentId: string;
//     studentReg: string;
//     studentName: string;
//     programId: string;
//     programName: string;
//     level: number;
//     amount: number;
//     type: 'full_level' | 'repeater';
//     failedCourses?: string[];
//     receiptImage?: string;
//     status: 'pending' | 'paid' | 'approved' | 'rejected';
//     physicalVerified: boolean;
//     rejectionReason?: string;
//     approvedBy?: string;
//     approvedAt?: string;
//     createdAt: string;
//     updatedAt: string;
// }

// export interface StudentRegistration {
//     id: string;
//     studentId: string;
//     studentReg: string;
//     studentName: string;
//     programId: string;
//     programName: string;
//     level: number;
//     invoiceId: string;
//     registrationStatus: 'pending' | 'approved' | 'rejected';
//     approvedAt?: string;
//     registeredAt: string;
// }

// export interface StudentProgress {
//     studentId: string;
//     completedLevels: number[];
//     failedCourses: {
//         level: number;
//         courseName: string;
//         sessionId: string;
//         sessionYear: string;
//     }[];
// }

// interface RegistrationState {
//     feeStructures: FeeStructure[];
//     registrationPeriods: RegistrationPeriod[];
//     invoices: Invoice[];
//     registrations: StudentRegistration[];
//     studentProgress: StudentProgress[];
//     currentRegistrationPeriod: RegistrationPeriod | null;
//     loading: boolean;
//     // Actions
//     addFeeStructure: (fee: Omit<FeeStructure, 'id'>) => Promise<void>;
//     updateFeeStructure: (id: string, fee: Partial<FeeStructure>) => Promise<void>;
//     deleteFeeStructure: (id: string) => Promise<void>;
//     getFeeByProgramAndLevel: (programId: string, level: number) => FeeStructure | undefined;
//     setRegistrationPeriod: (period: Omit<RegistrationPeriod, 'id'>) => Promise<void>;
//     updateRegistrationPeriod: (id: string, period: Partial<RegistrationPeriod>) => Promise<void>;
//     extendRegistrationPeriod: (id: string, days: number) => Promise<void>;
//     createInvoice: (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<Invoice>;
//     uploadReceipt: (invoiceId: string, imageBase64: string) => Promise<void>;
//     verifyPaymentPhysical: (invoiceId: string, verifiedBy: string) => Promise<void>;
//     approveInvoice: (invoiceId: string, approvedBy: string) => Promise<void>;
//     rejectInvoice: (invoiceId: string, reason: string) => Promise<void>;
//     registerStudent: (studentId: string, level: number, type: 'full_level' | 'repeater', failedCourses?: string[]) => Promise<StudentRegistration>;
//     getStudentRegistrations: (studentId: string) => StudentRegistration[];
//     getStudentInvoices: (studentId: string) => Invoice[];
//     getStudentProgress: (studentId: string) => StudentProgress | undefined;
//     getEligibleLevels: (studentId: string) => { level: number; eligible: boolean; reason?: string; isRepeater: boolean; failedCourses?: string[] }[];
//     canStudentRegister: (studentId: string) => { canRegister: boolean; reason?: string };
//     getPendingInvoices: () => Invoice[];
//     getAllRegistrations: () => StudentRegistration[];
// }

// const RegistrationContext = createContext<RegistrationState | undefined>(undefined);

// export const useRegistration = () => {
//     const ctx = useContext(RegistrationContext);
//     if (!ctx) throw new Error('useRegistration must be used within RegistrationProvider');
//     return ctx;
// };

// export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
//     const [registrationPeriods, setRegistrationPeriods] = useState<RegistrationPeriod[]>([]);
//     const [invoices, setInvoices] = useState<Invoice[]>([]);
//     const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
//     const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
//     const [loading, setLoading] = useState(true);

//     // Load data from localStorage
//     useEffect(() => {
//         const loadData = () => {
//             const savedFeeStructures = localStorage.getItem('emis_fee_structures');
//             const savedPeriods = localStorage.getItem('emis_registration_periods');
//             const savedInvoices = localStorage.getItem('emis_invoices');
//             const savedRegistrations = localStorage.getItem('emis_registrations');
//             const savedProgress = localStorage.getItem('emis_student_progress');

//             if (savedFeeStructures) setFeeStructures(JSON.parse(savedFeeStructures));
//             if (savedPeriods) setRegistrationPeriods(JSON.parse(savedPeriods));
//             if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
//             if (savedRegistrations) setRegistrations(JSON.parse(savedRegistrations));
//             if (savedProgress) setStudentProgress(JSON.parse(savedProgress));
//             setLoading(false);
//         };
//         loadData();
//     }, []);

//     const saveFeeStructures = (data: FeeStructure[]) => {
//         setFeeStructures(data);
//         localStorage.setItem('emis_fee_structures', JSON.stringify(data));
//     };

//     const savePeriods = (data: RegistrationPeriod[]) => {
//         setRegistrationPeriods(data);
//         localStorage.setItem('emis_registration_periods', JSON.stringify(data));
//     };

//     const saveInvoices = (data: Invoice[]) => {
//         setInvoices(data);
//         localStorage.setItem('emis_invoices', JSON.stringify(data));
//     };

//     const saveRegistrations = (data: StudentRegistration[]) => {
//         setRegistrations(data);
//         localStorage.setItem('emis_registrations', JSON.stringify(data));
//     };

//     const saveProgress = (data: StudentProgress[]) => {
//         setStudentProgress(data);
//         localStorage.setItem('emis_student_progress', JSON.stringify(data));
//     };

//     const currentRegistrationPeriod = registrationPeriods.find(p => p.isActive && new Date(p.endDate) > new Date());

//     const addFeeStructure = async (fee: Omit<FeeStructure, 'id'>) => {
//         const newFee = { ...fee, id: Date.now().toString() };
//         saveFeeStructures([...feeStructures, newFee]);
//     };

//     const updateFeeStructure = async (id: string, fee: Partial<FeeStructure>) => {
//         const updated = feeStructures.map(f => f.id === id ? { ...f, ...fee } : f);
//         saveFeeStructures(updated);
//     };

//     const deleteFeeStructure = async (id: string) => {
//         saveFeeStructures(feeStructures.filter(f => f.id !== id));
//     };

//     const getFeeByProgramAndLevel = (programId: string, level: number) => {
//         return feeStructures.find(f => f.programId === programId && f.level === level);
//     };

//     const setRegistrationPeriod = async (period: Omit<RegistrationPeriod, 'id'>) => {
//         const newPeriod = { ...period, id: Date.now().toString() };
//         savePeriods([...registrationPeriods, newPeriod]);
//     };

//     const updateRegistrationPeriod = async (id: string, period: Partial<RegistrationPeriod>) => {
//         const updated = registrationPeriods.map(p => p.id === id ? { ...p, ...period } : p);
//         savePeriods(updated);
//     };

//     const extendRegistrationPeriod = async (id: string, days: number) => {
//         const period = registrationPeriods.find(p => p.id === id);
//         if (period) {
//             const newEndDate = new Date(period.endDate);
//             newEndDate.setDate(newEndDate.getDate() + days);
//             updateRegistrationPeriod(id, { endDate: newEndDate.toISOString() });
//         }
//     };

//     const createInvoice = async (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
//         const newInvoice: Invoice = {
//             ...data,
//             id: Date.now().toString(),
//             status: 'pending',
//             physicalVerified: false,
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString(),
//         };
//         saveInvoices([...invoices, newInvoice]);
//         return newInvoice;
//     };

//     const uploadReceipt = async (invoiceId: string, imageBase64: string) => {
//         const updated = invoices.map(inv =>
//             inv.id === invoiceId
//                 ? { ...inv, receiptImage: imageBase64, status: 'paid' as const, updatedAt: new Date().toISOString() }
//                 : inv
//         );
//         saveInvoices(updated);
//     };

//     const verifyPaymentPhysical = async (invoiceId: string, verifiedBy: string) => {
//         const updated = invoices.map(inv =>
//             inv.id === invoiceId
//                 ? { ...inv, physicalVerified: true, updatedAt: new Date().toISOString() }
//                 : inv
//         );
//         saveInvoices(updated);
//     };

//     const approveInvoice = async (invoiceId: string, approvedBy: string) => {
//         const updated = invoices.map(inv =>
//             inv.id === invoiceId
//                 ? { ...inv, status: 'approved' as const, approvedBy, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
//                 : inv
//         );
//         saveInvoices(updated);

//         // Also update the corresponding registration
//         const registration = registrations.find(r => r.invoiceId === invoiceId);
//         if (registration) {
//             const updatedReg = registrations.map(r =>
//                 r.id === registration.id
//                     ? { ...r, registrationStatus: 'approved' as const, approvedAt: new Date().toISOString() }
//                     : r
//             );
//             saveRegistrations(updatedReg);
//         }
//     };

//     const rejectInvoice = async (invoiceId: string, reason: string) => {
//         const updated = invoices.map(inv =>
//             inv.id === invoiceId
//                 ? { ...inv, status: 'rejected' as const, rejectionReason: reason, updatedAt: new Date().toISOString() }
//                 : inv
//         );
//         saveInvoices(updated);
//     };

//     const registerStudent = async (studentId: string, level: number, type: 'full_level' | 'repeater', failedCourses?: string[]) => {
//         // Get student info from somewhere - this would come from EMIS context
//         // For now, we'll need to pass student details
//         // This will be called from StudentRegistration component with full data

//         const registration: StudentRegistration = {
//             id: Date.now().toString(),
//             studentId,
//             studentReg: '',
//             studentName: '',
//             programId: '',
//             programName: '',
//             level,
//             invoiceId: '',
//             registrationStatus: 'pending',
//             registeredAt: new Date().toISOString(),
//         };

//         saveRegistrations([...registrations, registration]);
//         return registration;
//     };

//     const getStudentRegistrations = (studentId: string) => {
//         return registrations.filter(r => r.studentId === studentId);
//     };

//     const getStudentInvoices = (studentId: string) => {
//         return invoices.filter(i => i.studentId === studentId);
//     };

//     const getStudentProgress = (studentId: string) => {
//         return studentProgress.find(p => p.studentId === studentId);
//     };

//     const getEligibleLevels = (studentId: string) => {
//         const progress = getStudentProgress(studentId);
//         const completedLevels = progress?.completedLevels || [];
//         const failedCourses = progress?.failedCourses || [];

//         const levels = [1, 2, 3, 4];
//         const result = [];

//         for (const level of levels) {
//             // Check if already passed this level
//             if (completedLevels.includes(level)) {
//                 result.push({ level, eligible: false, reason: 'Already completed this level', isRepeater: false });
//                 continue;
//             }

//             // Check if has failed courses in this level
//             const failedInThisLevel = failedCourses.filter(f => f.level === level);
//             if (failedInThisLevel.length > 0) {
//                 // Can only register as repeater for failed courses
//                 result.push({
//                     level,
//                     eligible: true,
//                     reason: `Failed courses: ${failedInThisLevel.map(f => f.courseName).join(', ')} - Register as repeater`,
//                     isRepeater: true,
//                     failedCourses: failedInThisLevel.map(f => f.courseName)
//                 });
//                 continue;
//             }

//             // Check if previous level is completed
//             if (level === 1) {
//                 result.push({ level, eligible: true, reason: 'Eligible for Level 1', isRepeater: false });
//             } else if (completedLevels.includes(level - 1)) {
//                 result.push({ level, eligible: true, reason: `Completed Level ${level - 1}, eligible for Level ${level}`, isRepeater: false });
//             } else {
//                 result.push({ level, eligible: false, reason: `Must complete Level ${level - 1} first`, isRepeater: false });
//             }
//         }

//         return result;
//     };

//     const canStudentRegister = (studentId: string) => {
//         // Check if registration period is active
//         if (!currentRegistrationPeriod) {
//             return { canRegister: false, reason: 'No active registration period' };
//         }

//         const now = new Date();
//         const start = new Date(currentRegistrationPeriod.startDate);
//         const end = new Date(currentRegistrationPeriod.endDate);

//         if (now < start) {
//             return { canRegister: false, reason: `Registration opens on ${start.toLocaleDateString()}` };
//         }

//         if (now > end) {
//             return { canRegister: false, reason: `Registration closed on ${end.toLocaleDateString()}` };
//         }

//         return { canRegister: true };
//     };

//     const getPendingInvoices = () => {
//         return invoices.filter(i => i.status === 'paid' || (i.status === 'pending' && i.receiptImage));
//     };

//     const getAllRegistrations = () => {
//         return registrations;
//     };

//     return (
//         <RegistrationContext.Provider value={{
//             feeStructures,
//             registrationPeriods,
//             invoices,
//             registrations,
//             studentProgress,
//             currentRegistrationPeriod,
//             loading,
//             addFeeStructure,
//             updateFeeStructure,
//             deleteFeeStructure,
//             getFeeByProgramAndLevel,
//             setRegistrationPeriod,
//             updateRegistrationPeriod,
//             extendRegistrationPeriod,
//             createInvoice,
//             uploadReceipt,
//             verifyPaymentPhysical,
//             approveInvoice,
//             rejectInvoice,
//             registerStudent,
//             getStudentRegistrations,
//             getStudentInvoices,
//             getStudentProgress,
//             getEligibleLevels,
//             canStudentRegister,
//             getPendingInvoices,
//             getAllRegistrations,
//         }}>
//             {children}
//         </RegistrationContext.Provider>
//     );
// };