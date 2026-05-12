import React, { useState, useEffect } from 'react';
import { useEMIS } from '@/contexts/EMISContext';
import { PageHeader, Button, Badge, Modal, Input, Toast } from '@/components/shared/UI';
import { CreditCard, Upload, CheckCircle, XCircle, FileText, Calendar, Loader2 } from 'lucide-react';

interface StudentRegistrationProps {
    toast: string;
    setToast: (msg: string) => void;
}

const StudentRegistration: React.FC<StudentRegistrationProps> = ({ toast, setToast }) => {
    const { currentUser, students, apiRequest } = useEMIS();

    const [loading, setLoading] = useState(true);
    const [eligibleLevels, setEligibleLevels] = useState<any[]>([]);
    const [canRegister, setCanRegister] = useState(false);
    const [registrationReason, setRegistrationReason] = useState('');
    const [currentRegistrationPeriod, setCurrentRegistrationPeriod] = useState<any>(null);
    const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
    const [myInvoices, setMyInvoices] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);

    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [selectedType, setSelectedType] = useState<'full_level' | 'repeater'>('full_level');
    const [failedCourses, setFailedCourses] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [confirmModal, setConfirmModal] = useState(false);
    const [receiptModal, setReceiptModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [receiptImage, setReceiptImage] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const allCourses = ['Practical', 'Occupation', 'Fundamentals'];
    const currentStudent = students.find(s => s.id === currentUser?.id);

    // Fetch fee structures
    const fetchFeeStructures = async () => {
        try {
            const response = await apiRequest('/fee-structures');
            if (response.data) {
                setFeeStructures(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch fee structures:', error);
        }
    };

    // Fetch all registration data
    const fetchData = async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            const [periodRes, eligibleRes, canRegisterRes, registrationsRes, invoicesRes] = await Promise.all([
                apiRequest('/registration/period'),
                apiRequest(`/registration/eligible-levels/${currentUser.id}`),
                apiRequest(`/registration/can-register/${currentUser.id}`),
                apiRequest(`/registration/my-registrations/${currentUser.id}`),
                apiRequest(`/registration/my-invoices/${currentUser.id}`)
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
            setToast('Failed to load registration data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeeStructures();
        fetchData();
    }, [currentUser?.id]);

    // Get fee for selected level from fee_structures table
    const getFeeAmount = () => {
        if (!selectedLevel || !currentStudent?.program) return 0;
        const fee = feeStructures.find(f => f.program_id === currentStudent.program && f.level === selectedLevel);
        if (!fee) return 0;

        if (selectedType === 'repeater' && selectedCourses.length > 0) {
            return selectedCourses.length * fee.per_course_amount;
        }
        return fee.full_level_amount;
    };

    const handleCourseToggle = (course: string) => {
        if (selectedCourses.includes(course)) {
            setSelectedCourses(selectedCourses.filter(c => c !== course));
        } else {
            setSelectedCourses([...selectedCourses, course]);
        }
    };

    const handleSelectAll = () => {
        if (selectedCourses.length === allCourses.length) {
            setSelectedCourses([]);
        } else {
            setSelectedCourses([...allCourses]);
        }
    };

    const openConfirmModal = (level: any) => {
        setSelectedLevel(level.level);
        if (level.isRepeater) {
            setSelectedType('repeater');
            setFailedCourses(level.failedCourses || []);
            setSelectedCourses([...level.failedCourses]);
        } else {
            setSelectedType('full_level');
            setFailedCourses([]);
            setSelectedCourses([...allCourses]);
        }
        setConfirmModal(true);
    };

    const handleRegister = async () => {
        if (!selectedLevel) {
            setToast('Please select a level to register');
            return;
        }

        if (selectedCourses.length === 0) {
            setToast('Please select at least one course to register');
            return;
        }

        const feeAmount = getFeeAmount();
        if (feeAmount === 0) {
            setToast('Fee structure not configured for this program and level');
            return;
        }

        setSubmitting(true);
        try {
            await apiRequest('/registration/create', 'POST', {
                studentId: currentUser!.id,
                studentReg: (currentUser as any)?.regNumber || '',
                studentName: currentUser!.name,
                programId: currentStudent?.program || '',
                programName: currentStudent?.program || '',
                level: selectedLevel,
                amount: feeAmount,
                type: selectedType,
                failedCourses: selectedType === 'repeater' ? selectedCourses : undefined
            });

            setConfirmModal(false);
            setToast(`Registration initiated! Invoice created. Please upload payment receipt.`);
            setSelectedLevel(null);
            setSelectedCourses([]);
            fetchData();
        } catch (error: any) {
            console.error('Failed to create registration:', error);
            setToast(error.message || 'Failed to create registration');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadReceipt = async () => {
        if (!receiptImage) {
            setToast('Please select a receipt image');
            return;
        }
        setUploading(true);
        try {
            await apiRequest(`/registration/upload-receipt/${selectedInvoice.id}`, 'POST', {
                receipt_image: receiptImage
            });
            setReceiptModal(false);
            setReceiptImage('');
            setToast('Receipt uploaded successfully. Awaiting Accounts approval.');
            fetchData();
        } catch (error) {
            console.error('Failed to upload receipt:', error);
            setToast('Failed to upload receipt');
        } finally {
            setUploading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge status="warning">Pending</Badge>;
            case 'paid': return <Badge status="info">Receipt Uploaded</Badge>;
            case 'approved': return <Badge status="success">Approved</Badge>;
            case 'rejected': return <Badge status="error">Rejected</Badge>;
            default: return <Badge status="default">{status}</Badge>;
        }
    };

    const getRegistrationStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge status="warning">Pending Approval</Badge>;
            case 'approved': return <Badge status="success">Registered ✓</Badge>;
            case 'rejected': return <Badge status="error">Rejected</Badge>;
            default: return <Badge status="default">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading registration data...</span>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast} onClose={() => setToast('')} />}

            <PageHeader
                title="Course Registration"
                subtitle="Register for your program levels and upload payment receipt"
            />

            {/* Registration Period Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-500" />
                        <div>
                            <p className="text-sm text-slate-600">Registration Period</p>
                            {currentRegistrationPeriod ? (
                                <>
                                    <p className="font-medium text-slate-900">
                                        {new Date(currentRegistrationPeriod.start_date).toLocaleDateString()} - {new Date(currentRegistrationPeriod.end_date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-slate-500">Academic Year: {currentRegistrationPeriod.academic_year}</p>
                                </>
                            ) : (
                                <p className="text-amber-600">No active registration period</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-slate-600">Your Status</p>
                        {canRegister ? (
                            <div className="flex items-center gap-2 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="font-medium">Eligible to Register</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">{registrationReason || 'Not eligible'}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Eligible Levels Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Levels Card */}
                <div className="bg-white border border-slate-200 rounded-xl">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="font-semibold text-slate-900">Available Registration Options</h3>
                        <p className="text-sm text-slate-500">Based on your academic progress</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {eligibleLevels.length === 0 ? (
                            <p className="text-center text-slate-500 py-4">No eligible levels found</p>
                        ) : (
                            eligibleLevels.map((level: any) => (
                                <div
                                    key={level.level}
                                    className={`p-4 rounded-lg border-2 transition ${!level.eligible ? 'opacity-60 bg-slate-50' : 'cursor-pointer hover:border-slate-300'
                                        } ${selectedLevel === level.level ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-slate-900">Level {level.level}</h4>
                                        {level.eligible ? (
                                            <Badge status={level.isRepeater ? 'warning' : 'success'}>
                                                {level.isRepeater ? 'Repeater Required' : 'Eligible'}
                                            </Badge>
                                        ) : (
                                            <Badge status="error">Not Eligible</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2">{level.reason}</p>
                                    {level.eligible && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs font-medium text-slate-700">Required Courses for Registration:</p>
                                            {level.isRepeater ? (
                                                // Repeater - show failed courses only
                                                <div className="space-y-1">
                                                    {level.failedCourses.map((course: string) => (
                                                        <div key={course} className="flex items-center gap-2 text-sm">
                                                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                            <span>{course}</span>
                                                            <span className="text-xs text-red-500">(Failed - Required to repeat)</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                // New student - show all 3 courses
                                                <div className="space-y-1">
                                                    {allCourses.map(course => (
                                                        <div key={course} className="flex items-center gap-2 text-sm">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                            <span>{course}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <Button
                                                variant="secondary"
                                                className="mt-3 px-3 py-1.5 text-sm w-full"
                                                onClick={() => openConfirmModal(level)}
                                            >
                                                Register for Level {level.level}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* My Registrations Card */}
                <div className="bg-white border border-slate-200 rounded-xl">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h3 className="font-semibold text-slate-900">My Registrations</h3>
                        <p className="text-sm text-slate-500">Track your registration status</p>
                    </div>
                    <div className="p-4">
                        {myRegistrations.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No registrations yet</p>
                                <p className="text-sm text-slate-400">Select courses above to register</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myRegistrations.map((reg: any) => {
                                    const invoice = myInvoices.find((i: any) => i.id === reg.invoice_id);
                                    return (
                                        <div key={reg.id} className="border border-slate-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-900">Level {reg.level}</span>
                                                {getRegistrationStatusBadge(reg.registration_status)}
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Registered: {new Date(reg.registered_at).toLocaleDateString()}
                                            </p>
                                            {invoice && (
                                                <div className="mt-2 pt-2 border-t border-slate-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm">
                                                            Amount: <span className="font-bold">K{invoice.amount.toLocaleString()}</span>
                                                        </span>
                                                        {getStatusBadge(invoice.status)}
                                                    </div>
                                                    {invoice.status === 'paid' && !invoice.physical_verified && (
                                                        <p className="text-xs text-amber-600 mt-1">Awaiting Accounts approval</p>
                                                    )}
                                                    {invoice.status === 'approved' && (
                                                        <p className="text-xs text-emerald-600 mt-1">Registration Approved!</p>
                                                    )}
                                                    {invoice.status === 'rejected' && (
                                                        <p className="text-xs text-red-600 mt-1">Reason: {invoice.rejection_reason}</p>
                                                    )}
                                                    {(invoice.status === 'pending' || invoice.status === 'rejected') && (
                                                        <Button
                                                            className="mt-2 px-3 py-1.5 text-sm w-full"
                                                            onClick={() => {
                                                                setSelectedInvoice(invoice);
                                                                setReceiptModal(true);
                                                            }}
                                                        >
                                                            <Upload className="w-3 h-3 mr-1" />
                                                            {invoice.status === 'rejected' ? 'Re-upload Receipt' : 'Upload Receipt'}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Registration">
                <div className="space-y-4">
                    <p className="text-slate-700">
                        You are about to register for <strong>Level {selectedLevel}</strong>.
                    </p>
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Selected Courses:</p>
                        <ul className="list-disc list-inside text-sm text-blue-700">
                            {selectedCourses.map(course => <li key={course}>{course}</li>)}
                        </ul>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                            Registration Fee: <strong>K{getFeeAmount().toLocaleString()}</strong>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            After confirmation, an invoice will be created. Upload payment receipt for approval.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Button>
                        <Button onClick={handleRegister} disabled={submitting}>
                            {submitting ? 'Processing...' : 'Confirm Registration'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Receipt Upload Modal */}
            <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Upload Payment Receipt" size="lg">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Please upload a clear image of your payment receipt for verification.
                    </p>
                    {selectedInvoice?.rejection_reason && (
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-red-800">Previous rejection reason:</p>
                            <p className="text-sm text-red-700">{selectedInvoice.rejection_reason}</p>
                        </div>
                    )}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="receipt-upload"
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer block">
                            {receiptImage ? (
                                <div className="space-y-2">
                                    <img src={receiptImage} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
                                    <p className="text-sm text-emerald-600">✓ Receipt loaded. Click to change.</p>
                                </div>
                            ) : (
                                <div className="py-8">
                                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600">Click to select receipt image</p>
                                    <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
                                </div>
                            )}
                        </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setReceiptModal(false)}>Cancel</Button>
                        <Button onClick={handleUploadReceipt} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Submit Receipt'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StudentRegistration;

// import React, { useState, useEffect } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { PageHeader, Button, Badge, Modal, Input, Toast } from '@/components/shared/UI';
// import { CreditCard, Upload, CheckCircle, XCircle, FileText, Calendar, Loader2 } from 'lucide-react';

// interface StudentRegistrationProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const StudentRegistration: React.FC<StudentRegistrationProps> = ({ toast, setToast }) => {
//     const { currentUser, students, apiRequest } = useEMIS();

//     const [loading, setLoading] = useState(true);
//     const [eligibleLevels, setEligibleLevels] = useState<any[]>([]);
//     const [canRegister, setCanRegister] = useState(false);
//     const [registrationReason, setRegistrationReason] = useState('');
//     const [currentRegistrationPeriod, setCurrentRegistrationPeriod] = useState<any>(null);
//     const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
//     const [myInvoices, setMyInvoices] = useState<any[]>([]);
//     const [feeStructures, setFeeStructures] = useState<any[]>([]);

//     const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
//     const [selectedType, setSelectedType] = useState<'full_level' | 'repeater'>('full_level');
//     const [failedCourses, setFailedCourses] = useState<string[]>([]);
//     const [confirmModal, setConfirmModal] = useState(false);
//     const [receiptModal, setReceiptModal] = useState(false);
//     const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//     const [receiptImage, setReceiptImage] = useState<string>('');
//     const [uploading, setUploading] = useState(false);
//     const [submitting, setSubmitting] = useState(false);

//     const currentStudent = students.find(s => s.id === currentUser?.id);

//     // Fetch fee structures
//     const fetchFeeStructures = async () => {
//         try {
//             const response = await apiRequest('/fee-structures');
//             if (response.data) {
//                 setFeeStructures(response.data);
//             }
//         } catch (error) {
//             console.error('Failed to fetch fee structures:', error);
//         }
//     };

//     // Fetch all registration data
//     const fetchData = async () => {
//         if (!currentUser?.id) return;

//         setLoading(true);
//         try {
//             const [periodRes, eligibleRes, canRegisterRes, registrationsRes, invoicesRes] = await Promise.all([
//                 apiRequest('/registration/period'),
//                 apiRequest(`/registration/eligible-levels/${currentUser.id}`),
//                 apiRequest(`/registration/can-register/${currentUser.id}`),
//                 apiRequest(`/registration/my-registrations/${currentUser.id}`),
//                 apiRequest(`/registration/my-invoices/${currentUser.id}`)
//             ]);

//             if (periodRes.data) setCurrentRegistrationPeriod(periodRes.data);
//             if (eligibleRes.data) setEligibleLevels(eligibleRes.data);
//             if (canRegisterRes.data) {
//                 setCanRegister(canRegisterRes.data.canRegister);
//                 setRegistrationReason(canRegisterRes.data.reason || '');
//             }
//             if (registrationsRes.data) setMyRegistrations(registrationsRes.data);
//             if (invoicesRes.data) setMyInvoices(invoicesRes.data);
//         } catch (error) {
//             console.error('Failed to fetch registration data:', error);
//             setToast('Failed to load registration data');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchFeeStructures();
//         fetchData();
//     }, [currentUser?.id]);

//     // Get fee for selected level from fee_structures table
//     const getFeeAmount = () => {
//         if (!selectedLevel || !currentStudent?.program) return 0;
//         const fee = feeStructures.find(f => f.program_id === currentStudent.program && f.level === selectedLevel);
//         if (!fee) return 0;

//         if (selectedType === 'repeater' && failedCourses.length > 0) {
//             return failedCourses.length * fee.per_course_amount;
//         }
//         return fee.full_level_amount;
//     };

//     const handleRegister = async () => {
//         if (!selectedLevel) {
//             setToast('Please select a level to register');
//             return;
//         }

//         const feeAmount = getFeeAmount();
//         if (feeAmount === 0) {
//             setToast('Fee structure not configured for this program and level');
//             return;
//         }

//         setSubmitting(true);
//         try {
//             const response = await apiRequest('/registration/create', 'POST', {
//                 studentId: currentUser!.id,
//                 studentReg: (currentUser as any)?.regNumber || '',
//                 studentName: currentUser!.name,
//                 programId: currentStudent?.program || '',
//                 programName: currentStudent?.program || '',
//                 level: selectedLevel,
//                 amount: feeAmount,
//                 type: selectedType,
//                 failedCourses: selectedType === 'repeater' ? failedCourses : undefined
//             });

//             setConfirmModal(false);
//             setToast(`Registration initiated! Invoice created. Please upload payment receipt.`);
//             setSelectedLevel(null);
//             fetchData(); // Refresh data
//         } catch (error: any) {
//             console.error('Failed to create registration:', error);
//             setToast(error.message || 'Failed to create registration');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     const handleUploadReceipt = async () => {
//         if (!receiptImage) {
//             setToast('Please select a receipt image');
//             return;
//         }
//         setUploading(true);
//         try {
//             await apiRequest(`/registration/upload-receipt/${selectedInvoice.id}`, 'POST', {
//                 receipt_image: receiptImage
//             });
//             setReceiptModal(false);
//             setReceiptImage('');
//             setToast('Receipt uploaded successfully. Awaiting Accounts approval.');
//             fetchData();
//         } catch (error) {
//             console.error('Failed to upload receipt:', error);
//             setToast('Failed to upload receipt');
//         } finally {
//             setUploading(false);
//         }
//     };

//     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setReceiptImage(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const getStatusBadge = (status: string) => {
//         switch (status) {
//             case 'pending': return <Badge status="warning">Pending</Badge>;
//             case 'paid': return <Badge status="info">Receipt Uploaded</Badge>;
//             case 'approved': return <Badge status="success">Approved</Badge>;
//             case 'rejected': return <Badge status="error">Rejected</Badge>;
//             default: return <Badge status="default">{status}</Badge>;
//         }
//     };

//     const getRegistrationStatusBadge = (status: string) => {
//         switch (status) {
//             case 'pending': return <Badge status="warning">Pending Approval</Badge>;
//             case 'approved': return <Badge status="success">Registered ✓</Badge>;
//             case 'rejected': return <Badge status="error">Rejected</Badge>;
//             default: return <Badge status="default">{status}</Badge>;
//         }
//     };

//     if (loading) {
//         return (
//             <div className="p-8 text-center flex items-center justify-center gap-2">
//                 <Loader2 className="w-5 h-5 animate-spin" />
//                 <span>Loading registration data...</span>
//             </div>
//         );
//     }

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}

//             <PageHeader
//                 title="Course Registration"
//                 subtitle="Register for your program levels and upload payment receipt"
//             />

//             {/* Registration Period Status */}
//             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
//                 <div className="flex items-center justify-between flex-wrap gap-4">
//                     <div className="flex items-center gap-3">
//                         <Calendar className="w-5 h-5 text-slate-500" />
//                         <div>
//                             <p className="text-sm text-slate-600">Registration Period</p>
//                             {currentRegistrationPeriod ? (
//                                 <>
//                                     <p className="font-medium text-slate-900">
//                                         {new Date(currentRegistrationPeriod.start_date).toLocaleDateString()} - {new Date(currentRegistrationPeriod.end_date).toLocaleDateString()}
//                                     </p>
//                                     <p className="text-xs text-slate-500">Academic Year: {currentRegistrationPeriod.academic_year}</p>
//                                 </>
//                             ) : (
//                                 <p className="text-amber-600">No active registration period</p>
//                             )}
//                         </div>
//                     </div>
//                     <div className="text-right">
//                         <p className="text-sm text-slate-600">Your Status</p>
//                         {canRegister ? (
//                             <div className="flex items-center gap-2 text-emerald-600">
//                                 <CheckCircle className="w-4 h-4" />
//                                 <span className="font-medium">Eligible to Register</span>
//                             </div>
//                         ) : (
//                             <div className="flex items-center gap-2 text-red-600">
//                                 <XCircle className="w-4 h-4" />
//                                 <span className="font-medium">{registrationReason || 'Not eligible'}</span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Eligible Levels Display */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Levels Card */}
//                 <div className="bg-white border border-slate-200 rounded-xl">
//                     <div className="border-b border-slate-200 px-6 py-4">
//                         <h3 className="font-semibold text-slate-900">Available Registration Options</h3>
//                         <p className="text-sm text-slate-500">Based on your academic progress</p>
//                     </div>
//                     <div className="p-4 space-y-3">
//                         {eligibleLevels.length === 0 ? (
//                             <p className="text-center text-slate-500 py-4">No eligible levels found</p>
//                         ) : (
//                             eligibleLevels.map((level: any) => (
//                                 <div
//                                     key={level.level}
//                                     className={`p-4 rounded-lg border-2 cursor-pointer transition ${selectedLevel === level.level
//                                         ? 'border-blue-500 bg-blue-50'
//                                         : 'border-slate-200 hover:border-slate-300'
//                                         } ${!level.eligible ? 'opacity-60 cursor-not-allowed' : ''}`}
//                                     onClick={() => level.eligible && setSelectedLevel(level.level)}
//                                 >
//                                     <div className="flex items-center justify-between mb-2">
//                                         <h4 className="font-bold text-slate-900">Level {level.level}</h4>
//                                         {level.eligible ? (
//                                             <Badge status={level.isRepeater ? 'warning' : 'success'}>
//                                                 {level.isRepeater ? 'Repeater Required' : 'Eligible'}
//                                             </Badge>
//                                         ) : (
//                                             <Badge status="error">Not Eligible</Badge>
//                                         )}
//                                     </div>
//                                     <p className="text-sm text-slate-600 mb-2">{level.reason}</p>
//                                     {level.eligible && level.isRepeater && level.failedCourses && (
//                                         <div className="mt-2">
//                                             <p className="text-xs text-red-600 mb-1">Failed Courses to Repeat:</p>
//                                             <div className="flex gap-2 flex-wrap">
//                                                 {level.failedCourses.map((course: string) => (
//                                                     <span key={course} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
//                                                         {course}
//                                                     </span>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     )}
//                                     {level.eligible && (
//                                         <Button
//                                             variant="secondary"
//                                             className="mt-3 px-3 py-1.5 text-sm"
//                                             onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 if (level.isRepeater) {
//                                                     setSelectedType('repeater');
//                                                     setFailedCourses(level.failedCourses || []);
//                                                 } else {
//                                                     setSelectedType('full_level');
//                                                     setFailedCourses([]);
//                                                 }
//                                                 setConfirmModal(true);
//                                             }}
//                                         >
//                                             Register for Level {level.level}
//                                         </Button>
//                                     )}
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>

//                 {/* My Registrations Card */}
//                 <div className="bg-white border border-slate-200 rounded-xl">
//                     <div className="border-b border-slate-200 px-6 py-4">
//                         <h3 className="font-semibold text-slate-900">My Registrations</h3>
//                         <p className="text-sm text-slate-500">Track your registration status</p>
//                     </div>
//                     <div className="p-4">
//                         {myRegistrations.length === 0 ? (
//                             <div className="text-center py-8">
//                                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
//                                 <p className="text-slate-500">No registrations yet</p>
//                                 <p className="text-sm text-slate-400">Select a level above to register</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-3">
//                                 {myRegistrations.map((reg: any) => {
//                                     const invoice = myInvoices.find((i: any) => i.id === reg.invoice_id);
//                                     return (
//                                         <div key={reg.id} className="border border-slate-200 rounded-lg p-4">
//                                             <div className="flex items-center justify-between mb-2">
//                                                 <span className="font-medium text-slate-900">Level {reg.level}</span>
//                                                 {getRegistrationStatusBadge(reg.registration_status)}
//                                             </div>
//                                             <p className="text-sm text-slate-600">
//                                                 Registered: {new Date(reg.registered_at).toLocaleDateString()}
//                                             </p>
//                                             {invoice && (
//                                                 <div className="mt-2 pt-2 border-t border-slate-100">
//                                                     <div className="flex items-center justify-between">
//                                                         <span className="text-sm">
//                                                             Amount: <span className="font-bold">K{invoice.amount.toLocaleString()}</span>
//                                                         </span>
//                                                         {getStatusBadge(invoice.status)}
//                                                     </div>
//                                                     {invoice.status === 'paid' && !invoice.physical_verified && (
//                                                         <p className="text-xs text-amber-600 mt-1">Awaiting Accounts approval</p>
//                                                     )}
//                                                     {invoice.status === 'approved' && (
//                                                         <p className="text-xs text-emerald-600 mt-1">Registration Approved!</p>
//                                                     )}
//                                                     {invoice.status === 'rejected' && (
//                                                         <p className="text-xs text-red-600 mt-1">Reason: {invoice.rejection_reason}</p>
//                                                     )}
//                                                     {(invoice.status === 'pending' || invoice.status === 'rejected') && (
//                                                         <Button
//                                                             className="mt-2 px-3 py-1.5 text-sm"
//                                                             onClick={() => {
//                                                                 setSelectedInvoice(invoice);
//                                                                 setReceiptModal(true);
//                                                             }}
//                                                         >
//                                                             <Upload className="w-3 h-3 mr-1" />
//                                                             {invoice.status === 'rejected' ? 'Re-upload Receipt' : 'Upload Receipt'}
//                                                         </Button>
//                                                     )}
//                                                 </div>
//                                             )}
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Confirmation Modal */}
//             <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Registration">
//                 <div className="space-y-4">
//                     <p className="text-slate-700">
//                         You are about to register for <strong>Level {selectedLevel}</strong>.
//                     </p>
//                     {selectedType === 'repeater' && failedCourses.length > 0 && (
//                         <div className="bg-amber-50 p-3 rounded-lg">
//                             <p className="text-sm font-medium text-amber-800 mb-1">Repeater Registration</p>
//                             <p className="text-sm text-amber-700">Failed courses to repeat:</p>
//                             <ul className="list-disc list-inside text-sm text-amber-700 mt-1">
//                                 {failedCourses.map(c => <li key={c}>{c}</li>)}
//                             </ul>
//                         </div>
//                     )}
//                     <div className="bg-blue-50 p-3 rounded-lg">
//                         <p className="text-sm text-blue-800">
//                             Registration Fee: <strong>K{getFeeAmount().toLocaleString()}</strong>
//                         </p>
//                         <p className="text-xs text-blue-600 mt-1">
//                             After confirmation, an invoice will be created. Upload payment receipt for approval.
//                         </p>
//                     </div>
//                     <div className="flex justify-end gap-2 pt-2">
//                         <Button type="button" variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Button>
//                         <Button onClick={handleRegister} disabled={submitting}>
//                             {submitting ? 'Processing...' : 'Confirm Registration'}
//                         </Button>
//                     </div>
//                 </div>
//             </Modal>

//             {/* Receipt Upload Modal */}
//             <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Upload Payment Receipt" size="lg">
//                 <div className="space-y-4">
//                     <p className="text-sm text-slate-600">
//                         Please upload a clear image of your payment receipt for verification.
//                     </p>
//                     {selectedInvoice?.rejection_reason && (
//                         <div className="bg-red-50 p-3 rounded-lg">
//                             <p className="text-sm font-medium text-red-800">Previous rejection reason:</p>
//                             <p className="text-sm text-red-700">{selectedInvoice.rejection_reason}</p>
//                         </div>
//                     )}
//                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
//                         <input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleImageChange}
//                             className="hidden"
//                             id="receipt-upload"
//                         />
//                         <label htmlFor="receipt-upload" className="cursor-pointer block">
//                             {receiptImage ? (
//                                 <div className="space-y-2">
//                                     <img src={receiptImage} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
//                                     <p className="text-sm text-emerald-600">✓ Receipt loaded. Click to change.</p>
//                                 </div>
//                             ) : (
//                                 <div className="py-8">
//                                     <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
//                                     <p className="text-sm text-slate-600">Click to select receipt image</p>
//                                     <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
//                                 </div>
//                             )}
//                         </label>
//                     </div>
//                     <div className="flex justify-end gap-2 pt-2">
//                         <Button type="button" variant="secondary" onClick={() => setReceiptModal(false)}>Cancel</Button>
//                         <Button onClick={handleUploadReceipt} disabled={uploading}>
//                             {uploading ? 'Uploading...' : 'Submit Receipt'}
//                         </Button>
//                     </div>
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default StudentRegistration;

// // src/components/dashboard/student/StudentRegistration.tsx
// import React, { useState } from 'react';
// import { useEMIS } from '@/contexts/EMISContext';
// import { useRegistration } from '@/contexts/RegistrationContext';
// import { PageHeader, Button, Badge, Modal, Input, Toast } from '@/components/shared/UI';
// import { CreditCard, Upload, CheckCircle, XCircle, FileText, Calendar } from 'lucide-react';

// interface StudentRegistrationProps {
//     toast: string;
//     setToast: (msg: string) => void;
// }

// const StudentRegistration: React.FC<StudentRegistrationProps> = ({ toast, setToast }) => {
//     const { currentUser, students } = useEMIS();
//     const {
//         getStudentProgress,
//         getEligibleLevels,
//         canStudentRegister,
//         currentRegistrationPeriod,
//         getFeeByProgramAndLevel,
//         createInvoice,
//         getStudentRegistrations,
//         getStudentInvoices,
//         uploadReceipt,
//     } = useRegistration();

//     const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
//     const [selectedType, setSelectedType] = useState<'full_level' | 'repeater'>('full_level');
//     const [failedCourses, setFailedCourses] = useState<string[]>([]);
//     const [confirmModal, setConfirmModal] = useState(false);
//     const [receiptModal, setReceiptModal] = useState(false);
//     const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
//     const [receiptImage, setReceiptImage] = useState<string>('');
//     const [uploading, setUploading] = useState(false);

//     // Get current student data
//     const currentStudent = students.find(s => s.id === currentUser?.id);
//     const eligibleLevels = getEligibleLevels(currentUser?.id || '');
//     const { canRegister, reason: registrationReason } = canStudentRegister(currentUser?.id || '');

//     const myRegistrations = getStudentRegistrations(currentUser?.id || '');
//     const myInvoices = getStudentInvoices(currentUser?.id || '');

//     // Get fee for selected level
//     const getFeeAmount = () => {
//         if (!selectedLevel || !currentStudent?.program) return 0;
//         const fee = getFeeByProgramAndLevel(currentStudent.program, selectedLevel);
//         if (selectedType === 'repeater' && failedCourses.length > 0) {
//             const repeaterFeePerCourse = (fee?.amount || 0) / 3;
//             return repeaterFeePerCourse * failedCourses.length;
//         }
//         return fee?.amount || 0;
//     };

//     const handleRegister = async () => {
//         if (!selectedLevel) {
//             setToast('Please select a level to register');
//             return;
//         }

//         const feeAmount = getFeeAmount();
//         if (feeAmount === 0) {
//             setToast('Fee structure not configured for this program and level');
//             return;
//         }

//         const invoice = await createInvoice({
//             studentId: currentUser!.id,
//             studentReg: (currentUser as any)?.regNumber || '',
//             studentName: currentUser!.name,
//             programId: currentStudent?.program || '',
//             programName: currentStudent?.program || '',
//             level: selectedLevel,
//             amount: feeAmount,
//             type: selectedType,
//             failedCourses: selectedType === 'repeater' ? failedCourses : undefined,
//             physicalVerified: false,
//         });

//         setConfirmModal(false);
//         setToast(`Registration initiated! Invoice #${invoice.id.slice(-6)} created. Please upload payment receipt.`);
//         setSelectedLevel(null);
//     };

//     const handleUploadReceipt = async () => {
//         if (!receiptImage) {
//             setToast('Please select a receipt image');
//             return;
//         }
//         setUploading(true);
//         await uploadReceipt(selectedInvoice.id, receiptImage);
//         setReceiptModal(false);
//         setReceiptImage('');
//         setUploading(false);
//         setToast('Receipt uploaded successfully. Awaiting Accounts approval.');
//     };

//     const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const file = e.target.files?.[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setReceiptImage(reader.result as string);
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const getStatusBadge = (status: string) => {
//         switch (status) {
//             case 'pending': return <Badge status="warning">Pending</Badge>;
//             case 'paid': return <Badge status="info">Receipt Uploaded</Badge>;
//             case 'approved': return <Badge status="success">Approved</Badge>;
//             case 'rejected': return <Badge status="error">Rejected</Badge>;
//             default: return <Badge status="default">{status}</Badge>;
//         }
//     };

//     const getRegistrationStatusBadge = (status: string) => {
//         switch (status) {
//             case 'pending': return <Badge status="warning">Pending Approval</Badge>;
//             case 'approved': return <Badge status="success">Registered ✓</Badge>;
//             case 'rejected': return <Badge status="error">Rejected</Badge>;
//             default: return <Badge status="default">{status}</Badge>;
//         }
//     };

//     return (
//         <div>
//             {toast && <Toast message={toast} onClose={() => setToast('')} />}

//             <PageHeader
//                 title="Course Registration"
//                 subtitle="Register for your program levels and upload payment receipt"
//             />

//             {/* Registration Period Status */}
//             <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
//                 <div className="flex items-center justify-between flex-wrap gap-4">
//                     <div className="flex items-center gap-3">
//                         <Calendar className="w-5 h-5 text-slate-500" />
//                         <div>
//                             <p className="text-sm text-slate-600">Registration Period</p>
//                             {currentRegistrationPeriod ? (
//                                 <>
//                                     <p className="font-medium text-slate-900">
//                                         {new Date(currentRegistrationPeriod.startDate).toLocaleDateString()} - {new Date(currentRegistrationPeriod.endDate).toLocaleDateString()}
//                                     </p>
//                                     <p className="text-xs text-slate-500">Academic Year: {currentRegistrationPeriod.academicYear}</p>
//                                 </>
//                             ) : (
//                                 <p className="text-amber-600">No active registration period</p>
//                             )}
//                         </div>
//                     </div>
//                     <div className="text-right">
//                         <p className="text-sm text-slate-600">Your Status</p>
//                         {canRegister ? (
//                             <div className="flex items-center gap-2 text-emerald-600">
//                                 <CheckCircle className="w-4 h-4" />
//                                 <span className="font-medium">Eligible to Register</span>
//                             </div>
//                         ) : (
//                             <div className="flex items-center gap-2 text-red-600">
//                                 <XCircle className="w-4 h-4" />
//                                 <span className="font-medium">{registrationReason || 'Not eligible'}</span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Eligible Levels Display */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Levels Card */}
//                 <div className="bg-white border border-slate-200 rounded-xl">
//                     <div className="border-b border-slate-200 px-6 py-4">
//                         <h3 className="font-semibold text-slate-900">Available Registration Options</h3>
//                         <p className="text-sm text-slate-500">Based on your academic progress</p>
//                     </div>
//                     <div className="p-4 space-y-3">
//                         {eligibleLevels.map(level => (
//                             <div
//                                 key={level.level}
//                                 className={`p-4 rounded-lg border-2 cursor-pointer transition ${selectedLevel === level.level
//                                         ? 'border-blue-500 bg-blue-50'
//                                         : 'border-slate-200 hover:border-slate-300'
//                                     } ${!level.eligible ? 'opacity-60 cursor-not-allowed' : ''}`}
//                                 onClick={() => level.eligible && setSelectedLevel(level.level)}
//                             >
//                                 <div className="flex items-center justify-between mb-2">
//                                     <h4 className="font-bold text-slate-900">Level {level.level}</h4>
//                                     {level.eligible ? (
//                                         <Badge status={level.isRepeater ? 'warning' : 'success'}>
//                                             {level.isRepeater ? 'Repeater Required' : 'Eligible'}
//                                         </Badge>
//                                     ) : (
//                                         <Badge status="error">Not Eligible</Badge>
//                                     )}
//                                 </div>
//                                 <p className="text-sm text-slate-600 mb-2">{level.reason}</p>
//                                 {level.eligible && level.isRepeater && level.failedCourses && (
//                                     <div className="mt-2">
//                                         <p className="text-xs text-red-600 mb-1">Failed Courses to Repeat:</p>
//                                         <div className="flex gap-2 flex-wrap">
//                                             {level.failedCourses.map(course => (
//                                                 <span key={course} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
//                                                     {course}
//                                                 </span>
//                                             ))}
//                                         </div>
//                                     </div>
//                                 )}
//                                 {level.eligible && (
//                                     <Button
//                                         variant="secondary"
//                                         className="mt-3 px-3 py-1.5 text-sm"
//                                         onClick={(e) => {
//                                             e.stopPropagation();
//                                             if (level.isRepeater) {
//                                                 setSelectedType('repeater');
//                                                 setFailedCourses(level.failedCourses || []);
//                                             } else {
//                                                 setSelectedType('full_level');
//                                                 setFailedCourses([]);
//                                             }
//                                             setConfirmModal(true);
//                                         }}
//                                     >
//                                         Register for Level {level.level}
//                                     </Button>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>

//                 {/* My Registrations Card */}
//                 <div className="bg-white border border-slate-200 rounded-xl">
//                     <div className="border-b border-slate-200 px-6 py-4">
//                         <h3 className="font-semibold text-slate-900">My Registrations</h3>
//                         <p className="text-sm text-slate-500">Track your registration status</p>
//                     </div>
//                     <div className="p-4">
//                         {myRegistrations.length === 0 ? (
//                             <div className="text-center py-8">
//                                 <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
//                                 <p className="text-slate-500">No registrations yet</p>
//                                 <p className="text-sm text-slate-400">Select a level above to register</p>
//                             </div>
//                         ) : (
//                             <div className="space-y-3">
//                                 {myRegistrations.map(reg => {
//                                     const invoice = myInvoices.find(i => i.id === reg.invoiceId);
//                                     return (
//                                         <div key={reg.id} className="border border-slate-200 rounded-lg p-4">
//                                             <div className="flex items-center justify-between mb-2">
//                                                 <span className="font-medium text-slate-900">Level {reg.level}</span>
//                                                 {getRegistrationStatusBadge(reg.registrationStatus)}
//                                             </div>
//                                             <p className="text-sm text-slate-600">
//                                                 Registered: {new Date(reg.registeredAt).toLocaleDateString()}
//                                             </p>
//                                             {invoice && (
//                                                 <div className="mt-2 pt-2 border-t border-slate-100">
//                                                     <div className="flex items-center justify-between">
//                                                         <span className="text-sm">
//                                                             Amount: <span className="font-bold">K{invoice.amount.toLocaleString()}</span>
//                                                         </span>
//                                                         {getStatusBadge(invoice.status)}
//                                                     </div>
//                                                     {invoice.status === 'paid' && !invoice.physicalVerified && (
//                                                         <p className="text-xs text-amber-600 mt-1">Awaiting Accounts approval</p>
//                                                     )}
//                                                     {invoice.status === 'approved' && (
//                                                         <p className="text-xs text-emerald-600 mt-1">Registration Approved!</p>
//                                                     )}
//                                                     {invoice.status === 'rejected' && (
//                                                         <p className="text-xs text-red-600 mt-1">Reason: {invoice.rejectionReason}</p>
//                                                     )}
//                                                     {(invoice.status === 'pending' || invoice.status === 'rejected') && (
//                                                         <Button
//                                                             className="mt-2 px-3 py-1.5 text-sm"
//                                                             onClick={() => {
//                                                                 setSelectedInvoice(invoice);
//                                                                 setReceiptModal(true);
//                                                             }}
//                                                         >
//                                                             <Upload className="w-3 h-3 mr-1" />
//                                                             {invoice.status === 'rejected' ? 'Re-upload Receipt' : 'Upload Receipt'}
//                                                         </Button>
//                                                     )}
//                                                 </div>
//                                             )}
//                                         </div>
//                                     );
//                                 })}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Confirmation Modal */}
//             <Modal open={confirmModal} onClose={() => setConfirmModal(false)} title="Confirm Registration">
//                 <div className="space-y-4">
//                     <p className="text-slate-700">
//                         You are about to register for <strong>Level {selectedLevel}</strong>.
//                     </p>
//                     {selectedType === 'repeater' && failedCourses.length > 0 && (
//                         <div className="bg-amber-50 p-3 rounded-lg">
//                             <p className="text-sm font-medium text-amber-800 mb-1">Repeater Registration</p>
//                             <p className="text-sm text-amber-700">Failed courses to repeat:</p>
//                             <ul className="list-disc list-inside text-sm text-amber-700 mt-1">
//                                 {failedCourses.map(c => <li key={c}>{c}</li>)}
//                             </ul>
//                         </div>
//                     )}
//                     <div className="bg-blue-50 p-3 rounded-lg">
//                         <p className="text-sm text-blue-800">
//                             Registration Fee: <strong>K{getFeeAmount().toLocaleString()}</strong>
//                         </p>
//                         <p className="text-xs text-blue-600 mt-1">
//                             After confirmation, an invoice will be created. Upload payment receipt for approval.
//                         </p>
//                     </div>
//                     <div className="flex justify-end gap-2 pt-2">
//                         <Button type="button" variant="secondary" onClick={() => setConfirmModal(false)}>Cancel</Button>
//                         <Button onClick={handleRegister}>Confirm Registration</Button>
//                     </div>
//                 </div>
//             </Modal>

//             {/* Receipt Upload Modal */}
//             <Modal open={receiptModal} onClose={() => setReceiptModal(false)} title="Upload Payment Receipt" size="lg">
//                 <div className="space-y-4">
//                     <p className="text-sm text-slate-600">
//                         Please upload a clear image of your payment receipt for verification.
//                     </p>
//                     {selectedInvoice?.rejectionReason && (
//                         <div className="bg-red-50 p-3 rounded-lg">
//                             <p className="text-sm font-medium text-red-800">Previous rejection reason:</p>
//                             <p className="text-sm text-red-700">{selectedInvoice.rejectionReason}</p>
//                         </div>
//                     )}
//                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
//                         <input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleImageChange}
//                             className="hidden"
//                             id="receipt-upload"
//                         />
//                         <label htmlFor="receipt-upload" className="cursor-pointer block">
//                             {receiptImage ? (
//                                 <div className="space-y-2">
//                                     <img src={receiptImage} alt="Receipt preview" className="max-h-48 mx-auto rounded" />
//                                     <p className="text-sm text-emerald-600">✓ Receipt loaded. Click to change.</p>
//                                 </div>
//                             ) : (
//                                 <div className="py-8">
//                                     <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
//                                     <p className="text-sm text-slate-600">Click to select receipt image</p>
//                                     <p className="text-xs text-slate-400">PNG, JPG up to 2MB</p>
//                                 </div>
//                             )}
//                         </label>
//                     </div>
//                     <div className="flex justify-end gap-2 pt-2">
//                         <Button type="button" variant="secondary" onClick={() => setReceiptModal(false)}>Cancel</Button>
//                         <Button onClick={handleUploadReceipt} disabled={uploading}>
//                             {uploading ? 'Uploading...' : 'Submit Receipt'}
//                         </Button>
//                     </div>
//                 </div>
//             </Modal>
//         </div>
//     );
// };

// export default StudentRegistration;