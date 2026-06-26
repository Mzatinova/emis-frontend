import React, { useState } from 'react';
import { Modal, Button } from '@/components/shared/UI';
import { Smartphone, Building2 } from 'lucide-react';
import { useEMIS } from '@/contexts/EMISContext';

interface PaymentModalProps {
    open: boolean;
    onClose: () => void;
    invoice: any;
    onSuccess: () => void;
}

type PaymentMethod = 'mobile_money' | 'bank_transfer';
type MobileMoneyProvider = 'airtel' | 'tnm';
type BankProvider = 'national' | 'nbs' | 'fdh' | 'fcb';

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, invoice, onSuccess }) => {
    const { currentUser, apiRequest, fetchRegistrationData } = useEMIS();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [provider, setProvider] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(false);

    const mobileProviders: { id: MobileMoneyProvider; name: string; icon: string }[] = [
        { id: 'airtel', name: 'Airtel Money', icon: '📱' },
        { id: 'tnm', name: 'TNM Mpamba', icon: '📱' },
    ];

    const bankProviders: { id: BankProvider; name: string; icon: string }[] = [
        { id: 'national', name: 'National Bank', icon: '🏦' },
        { id: 'nbs', name: 'NBS Bank', icon: '🏦' },
        { id: 'fdh', name: 'FDH Bank', icon: '🏦' },
        { id: 'fcb', name: 'FCB Bank', icon: '🏦' },
    ];

const handleSubmit = async () => {
    if (!paymentMethod) {
        alert('Please select a payment method');
        return;
    }

    if (!provider) {
        alert('Please select a provider');
        return;
    }

    if (paymentMethod === 'mobile_money' && !phoneNumber) {
        alert('Please enter your phone number');
        return;
    }

    if (paymentMethod === 'bank_transfer' && !accountNumber) {
        alert('Please enter your account number');
        return;
    }

    setLoading(true);
    try {
        let endpoint = '';
        let payload: any = {
            invoiceId: invoice.id,
            amount: invoice.amount,
            studentName: currentUser?.name,
            email: currentUser?.email,
            studentId: currentUser?.id,
        };

        if (paymentMethod === 'mobile_money') {
            endpoint = '/payment/mobile-money';
            payload.phoneNumber = phoneNumber;
            payload.provider = provider;
        } else {
            endpoint = '/payment/bank-transfer';
            payload.accountNumber = accountNumber;
            payload.provider = provider;
            payload.reference = reference;
        }

        const response = await apiRequest(endpoint, 'POST', payload);
        console.log('Payment response:', response);

        // Check if payment was initiated successfully
        if (response.status === 'success' || response.status === 'ok') {
            setLoading(false);
            
            // Bank Transfer - show account details
            if (paymentMethod === 'bank_transfer' && response.data?.payment_account_details) {
                const details = response.data.payment_account_details;
                const amount = response.data?.transaction?.amount || invoice.amount;
                
                alert(
                    `💰 Bank Transfer Details\n\n` +
                    `Bank: ${details.bank_name}\n` +
                    `Account Number: ${details.account_number}\n` +
                    `Account Name: ${details.account_name}\n` +
                    `Amount: K${Number(amount).toLocaleString()}\n\n` +
                    `📌 Please transfer the exact amount.\n` +
                    `⏰ The account expires in 1 hour.\n\n` +
                    `After transfer, the payment will be verified automatically.`
                );
                onSuccess();
                onClose();
            } 
            // Mobile Money - show success message
            else {
                alert(
                    `📱 Payment Initiated!\n\n` +
                    `Please check your phone (${phoneNumber}) to complete the payment.\n` +
                    `You will receive a USSD prompt to confirm the transaction.\n\n` +
                    `The payment will be verified automatically once completed.`
                );
                onSuccess();
                onClose();
            }
        } else {
            throw new Error(response.message || 'Payment initiation failed');
        }
    } catch (error: any) {
        console.error('Payment failed:', error);
        setLoading(false);
        alert(error.message || 'Payment failed. Please try again.');
    }
};

    const resetForm = () => {
        setPaymentMethod(null);
        setProvider('');
        setPhoneNumber('');
        setAccountNumber('');
        setReference('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal open={open} onClose={handleClose} title="Make Payment" size="lg">
            <div className="space-y-6">
                {/* Invoice Details */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-600">Invoice #{String(invoice?.id).slice(-8)}</p>
                            <p className="text-sm text-slate-600">Level {invoice?.level}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-600">Amount Due</p>
                            <p className="text-2xl font-bold text-blue-600">K{Number(invoice?.amount).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">Select Payment Method</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className={`p-4 border-2 rounded-lg text-center transition ${paymentMethod === 'mobile_money'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                            onClick={() => {
                                setPaymentMethod('mobile_money');
                                setProvider('');
                                setAccountNumber('');
                                setReference('');
                            }}
                        >
                            <Smartphone className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-medium">Mobile Money</p>
                        </button>
                        <button
                            type="button"
                            className={`p-4 border-2 rounded-lg text-center transition ${paymentMethod === 'bank_transfer'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-slate-200 hover:border-slate-300'
                                }`}
                            onClick={() => {
                                setPaymentMethod('bank_transfer');
                                setProvider('');
                                setPhoneNumber('');
                            }}
                        >
                            <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                            <p className="text-sm font-medium">Bank Transfer</p>
                        </button>
                    </div>
                </div>

                {/* Mobile Money - Show ONLY when selected */}
                {paymentMethod === 'mobile_money' && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Select Provider</p>
                            <div className="grid grid-cols-2 gap-2">
                                {mobileProviders.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={`p-3 border-2 rounded-lg text-center transition ${provider === p.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        onClick={() => setProvider(p.id)}
                                    >
                                        <span className="text-2xl">{p.icon}</span>
                                        <p className="text-sm font-medium mt-1">{p.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700 block mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="e.g. 0888123456"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Bank Transfer - Show ONLY when selected */}
                {paymentMethod === 'bank_transfer' && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">Select Bank</p>
                            <div className="grid grid-cols-2 gap-2">
                                {bankProviders.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        className={`p-3 border-2 rounded-lg text-center transition ${provider === p.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        onClick={() => setProvider(p.id)}
                                    >
                                        <span className="text-2xl">{p.icon}</span>
                                        <p className="text-sm font-medium mt-1">{p.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your account number"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">
                                    Reference (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Invoice # or your name"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <Button type="button" variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            loading ||
                            !paymentMethod ||
                            !provider ||
                            (paymentMethod === 'mobile_money' && !phoneNumber) ||
                            (paymentMethod === 'bank_transfer' && !accountNumber)
                        }
                    >
                        {loading ? 'Processing...' : `Pay K${Number(invoice?.amount).toLocaleString()}`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PaymentModal;

// import React, { useState } from 'react';
// import { Modal, Button } from '@/components/shared/UI';
// import { Smartphone, Building2 } from 'lucide-react';

// interface PaymentModalProps {
//   open: boolean;
//   onClose: () => void;
//   invoice: any;
//   onSuccess: () => void;
// }

// type PaymentMethod = 'mobile_money' | 'bank_transfer';
// type MobileMoneyProvider = 'airtel' | 'tnm';
// type BankProvider = 'national' | 'nbs' | 'fdh' | 'fcb';

// const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, invoice, onSuccess }) => {
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
//   const [provider, setProvider] = useState<string>('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [accountNumber, setAccountNumber] = useState('');
//   const [reference, setReference] = useState('');
//   const [loading, setLoading] = useState(false);

//   const mobileProviders: { id: MobileMoneyProvider; name: string; icon: string }[] = [
//     { id: 'airtel', name: 'Airtel Money', icon: '📱' },
//     { id: 'tnm', name: 'TNM Mpamba', icon: '📱' },
//   ];

//   const bankProviders: { id: BankProvider; name: string; icon: string }[] = [
//     { id: 'national', name: 'National Bank', icon: '🏦' },
//     { id: 'nbs', name: 'NBS Bank', icon: '🏦' },
//     { id: 'fdh', name: 'FDH Bank', icon: '🏦' },
//     { id: 'fcb', name: 'FCB Bank', icon: '🏦' },
//   ];

//   const handleSubmit = async () => {
//     if (!paymentMethod) {
//       alert('Please select a payment method');
//       return;
//     }

//     if (!provider) {
//       alert('Please select a provider');
//       return;
//     }

//     if (paymentMethod === 'mobile_money' && !phoneNumber) {
//       alert('Please enter your phone number');
//       return;
//     }

//     if (paymentMethod === 'bank_transfer' && !accountNumber) {
//       alert('Please enter your account number');
//       return;
//     }

//     setLoading(true);
//     try {
//       setTimeout(() => {
//         setLoading(false);
//         onSuccess();
//         onClose();
//         alert('Payment initiated successfully! Please check your phone/bank for confirmation.');
//       }, 2000);
//     } catch (error) {
//       console.error('Payment failed:', error);
//       setLoading(false);
//       alert('Payment failed. Please try again.');
//     }
//   };

//   const resetForm = () => {
//     setPaymentMethod(null);
//     setProvider('');
//     setPhoneNumber('');
//     setAccountNumber('');
//     setReference('');
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   return (
//     <Modal open={open} onClose={handleClose} title="Make Payment" size="lg">
//       <div className="space-y-6">
//         {/* Invoice Details */}
//         <div className="bg-blue-50 p-4 rounded-lg">
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-sm text-slate-600">Invoice #{String(invoice?.id).slice(-8)}</p>
//               <p className="text-sm text-slate-600">Level {invoice?.level}</p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm text-slate-600">Amount Due</p>
//               <p className="text-2xl font-bold text-blue-600">K{Number(invoice?.amount).toLocaleString()}</p>
//             </div>
//           </div>
//         </div>

//         {/* Payment Method Selection */}
//         <div>
//           <p className="text-sm font-medium text-slate-700 mb-3">Select Payment Method</p>
//           <div className="grid grid-cols-2 gap-3">
//             <button
//               type="button"
//               className={`p-4 border-2 rounded-lg text-center transition ${
//                 paymentMethod === 'mobile_money'
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-slate-200 hover:border-slate-300'
//               }`}
//               onClick={() => {
//                 setPaymentMethod('mobile_money');
//                 setProvider(''); // Clear provider from previous choice
//                 setAccountNumber('');
//                 setReference('');
//               }}
//             >
//               <Smartphone className="w-6 h-6 mx-auto mb-2 text-blue-600" />
//               <p className="text-sm font-medium">Mobile Money</p>
//             </button>
//             <button
//               type="button"
//               className={`p-4 border-2 rounded-lg text-center transition ${
//                 paymentMethod === 'bank_transfer'
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-slate-200 hover:border-slate-300'
//               }`}
//               onClick={() => {
//                 setPaymentMethod('bank_transfer');
//                 setProvider(''); // Clear provider from previous choice
//                 setPhoneNumber('');
//               }}
//             >
//               <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
//               <p className="text-sm font-medium">Bank Transfer</p>
//             </button>
//           </div>
//         </div>

//         {/* Mobile Money - Show ONLY when selected */}
//         {paymentMethod === 'mobile_money' && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm font-medium text-slate-700 mb-2">Select Provider</p>
//               <div className="grid grid-cols-2 gap-2">
//                 {mobileProviders.map((p) => (
//                   <button
//                     key={p.id}
//                     type="button"
//                     className={`p-3 border-2 rounded-lg text-center transition ${
//                       provider === p.id
//                         ? 'border-blue-500 bg-blue-50'
//                         : 'border-slate-200 hover:border-slate-300'
//                     }`}
//                     onClick={() => setProvider(p.id)}
//                   >
//                     <span className="text-2xl">{p.icon}</span>
//                     <p className="text-sm font-medium mt-1">{p.name}</p>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <label className="text-sm font-medium text-slate-700 block mb-1">
//                 Phone Number
//               </label>
//               <input
//                 type="tel"
//                 placeholder="e.g. 0888123456"
//                 value={phoneNumber}
//                 onChange={(e) => setPhoneNumber(e.target.value)}
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         )}

//         {/* Bank Transfer - Show ONLY when selected */}
//         {paymentMethod === 'bank_transfer' && (
//           <div className="space-y-4">
//             <div>
//               <p className="text-sm font-medium text-slate-700 mb-2">Select Bank</p>
//               <div className="grid grid-cols-2 gap-2">
//                 {bankProviders.map((p) => (
//                   <button
//                     key={p.id}
//                     type="button"
//                     className={`p-3 border-2 rounded-lg text-center transition ${
//                       provider === p.id
//                         ? 'border-blue-500 bg-blue-50'
//                         : 'border-slate-200 hover:border-slate-300'
//                     }`}
//                     onClick={() => setProvider(p.id)}
//                   >
//                     <span className="text-2xl">{p.icon}</span>
//                     <p className="text-sm font-medium mt-1">{p.name}</p>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="space-y-3">
//               <div>
//                 <label className="text-sm font-medium text-slate-700 block mb-1">
//                   Account Number
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter your account number"
//                   value={accountNumber}
//                   onChange={(e) => setAccountNumber(e.target.value)}
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-slate-700 block mb-1">
//                   Reference (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Invoice # or your name"
//                   value={reference}
//                   onChange={(e) => setReference(e.target.value)}
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
//           <Button type="button" variant="secondary" onClick={handleClose}>
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSubmit}
//             disabled={
//               loading ||
//               !paymentMethod ||
//               !provider ||
//               (paymentMethod === 'mobile_money' && !phoneNumber) ||
//               (paymentMethod === 'bank_transfer' && !accountNumber)
//             }
//           >
//             {loading ? 'Processing...' : `Pay K${Number(invoice?.amount).toLocaleString()}`}
//           </Button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default PaymentModal;

// import React, { useState } from 'react';
// import { Modal, Button, Badge } from '@/components/shared/UI';
// import { CreditCard, Smartphone, Building2, CheckCircle, XCircle } from 'lucide-react';

// interface PaymentModalProps {
//   open: boolean;
//   onClose: () => void;
//   invoice: any;
//   onSuccess: () => void;
// }

// type PaymentMethod = 'mobile_money' | 'bank_transfer';

// type MobileMoneyProvider = 'airtel' | 'tnm';
// type BankProvider = 'national' | 'nbs' | 'fdh' | 'fcb';

// const PaymentModal: React.FC<PaymentModalProps> = ({ open, onClose, invoice, onSuccess }) => {
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
//   const [provider, setProvider] = useState<string>('');
//   const [phoneNumber, setPhoneNumber] = useState('');
//   const [accountNumber, setAccountNumber] = useState('');
//   const [reference, setReference] = useState('');
//   const [loading, setLoading] = useState(false);

//   const mobileProviders: { id: MobileMoneyProvider; name: string; icon: string }[] = [
//     { id: 'airtel', name: 'Airtel Money', icon: '📱' },
//     { id: 'tnm', name: 'TNM Mpamba', icon: '📱' },
//   ];

//   const bankProviders: { id: BankProvider; name: string; icon: string }[] = [
//     { id: 'national', name: 'National Bank', icon: '🏦' },
//     { id: 'nbs', name: 'NBS Bank', icon: '🏦' },
//     { id: 'fdh', name: 'FDH Bank', icon: '🏦' },
//     { id: 'fcb', name: 'FCB Bank', icon: '🏦' },
//   ];

//   const handleSubmit = async () => {
//     if (!paymentMethod) {
//       alert('Please select a payment method');
//       return;
//     }

//     if (paymentMethod === 'mobile_money' && !phoneNumber) {
//       alert('Please enter your phone number');
//       return;
//     }

//     if (paymentMethod === 'bank_transfer' && !accountNumber) {
//       alert('Please enter your account number');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Call payment API
//       // const response = await apiRequest('/payment/initiate', 'POST', {
//       //   invoiceId: invoice.id,
//       //   amount: invoice.amount,
//       //   method: paymentMethod,
//       //   provider: provider,
//       //   phoneNumber: phoneNumber,
//       //   accountNumber: accountNumber,
//       //   reference: reference,
//       // });

//       // Simulate payment processing
//       setTimeout(() => {
//         setLoading(false);
//         onSuccess();
//         onClose();
//         alert('Payment initiated successfully! Please check your phone/bank for confirmation.');
//       }, 2000);

//     } catch (error) {
//       console.error('Payment failed:', error);
//       setLoading(false);
//       alert('Payment failed. Please try again.');
//     }
//   };

//   const resetForm = () => {
//     setPaymentMethod(null);
//     setProvider('');
//     setPhoneNumber('');
//     setAccountNumber('');
//     setReference('');
//   };

//   const handleClose = () => {
//     resetForm();
//     onClose();
//   };

//   return (
//     <Modal open={open} onClose={handleClose} title="Make Payment" size="lg">
//       <div className="space-y-6">
//         {/* Invoice Details */}
//         <div className="bg-blue-50 p-4 rounded-lg">
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-sm text-slate-600">Invoice #{String(invoice?.id).slice(-8)}</p>
//               <p className="text-sm text-slate-600">Level {invoice?.level}</p>
//             </div>
//             <div className="text-right">
//               <p className="text-sm text-slate-600">Amount Due</p>
//               <p className="text-2xl font-bold text-blue-600">K{Number(invoice?.amount).toLocaleString()}</p>
//             </div>
//           </div>
//         </div>

//         {/* Payment Method Selection */}
//         <div>
//           <p className="text-sm font-medium text-slate-700 mb-3">Select Payment Method</p>
//           <div className="grid grid-cols-2 gap-3">
//             <button
//               className={`p-4 border-2 rounded-lg text-center transition ${
//                 paymentMethod === 'mobile_money'
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-slate-200 hover:border-slate-300'
//               }`}
//               onClick={() => {
//                 setPaymentMethod('mobile_money');
//                 setProvider('');
//               }}
//             >
//               <Smartphone className="w-6 h-6 mx-auto mb-2 text-blue-600" />
//               <p className="text-sm font-medium">Mobile Money</p>
//             </button>
//             <button
//               className={`p-4 border-2 rounded-lg text-center transition ${
//                 paymentMethod === 'bank_transfer'
//                   ? 'border-blue-500 bg-blue-50'
//                   : 'border-slate-200 hover:border-slate-300'
//               }`}
//               onClick={() => {
//                 setPaymentMethod('bank_transfer');
//                 setProvider('');
//               }}
//             >
//               <Building2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
//               <p className="text-sm font-medium">Bank Transfer</p>
//             </button>
//           </div>
//         </div>

//         {/* Mobile Money Providers */}
//         {paymentMethod === 'mobile_money' && (
//           <div>
//             <p className="text-sm font-medium text-slate-700 mb-2">Select Provider</p>
//             <div className="grid grid-cols-2 gap-2">
//               {mobileProviders.map((p) => (
//                 <button
//                   key={p.id}
//                   className={`p-3 border-2 rounded-lg text-center transition ${
//                     provider === p.id
//                       ? 'border-blue-500 bg-blue-50'
//                       : 'border-slate-200 hover:border-slate-300'
//                   }`}
//                   onClick={() => setProvider(p.id)}
//                 >
//                   <span className="text-2xl">{p.icon}</span>
//                   <p className="text-sm font-medium mt-1">{p.name}</p>
//                 </button>
//               ))}
//             </div>

//             <div className="mt-4">
//               <label className="text-sm font-medium text-slate-700 block mb-1">
//                 Phone Number
//               </label>
//               <input
//                 type="tel"
//                 placeholder="e.g. 0888123456"
//                 value={phoneNumber}
//                 onChange={(e) => setPhoneNumber(e.target.value)}
//                 className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//           </div>
//         )}

//         {/* Bank Providers */}
//         {paymentMethod === 'bank_transfer' && (
//           <div>
//             <p className="text-sm font-medium text-slate-700 mb-2">Select Bank</p>
//             <div className="grid grid-cols-2 gap-2">
//               {bankProviders.map((p) => (
//                 <button
//                   key={p.id}
//                   className={`p-3 border-2 rounded-lg text-center transition ${
//                     provider === p.id
//                       ? 'border-blue-500 bg-blue-50'
//                       : 'border-slate-200 hover:border-slate-300'
//                   }`}
//                   onClick={() => setProvider(p.id)}
//                 >
//                   <span className="text-2xl">{p.icon}</span>
//                   <p className="text-sm font-medium mt-1">{p.name}</p>
//                 </button>
//               ))}
//             </div>

//             <div className="mt-4 space-y-3">
//               <div>
//                 <label className="text-sm font-medium text-slate-700 block mb-1">
//                   Account Number
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter your account number"
//                   value={accountNumber}
//                   onChange={(e) => setAccountNumber(e.target.value)}
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="text-sm font-medium text-slate-700 block mb-1">
//                   Reference (Optional)
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="e.g. Invoice # or your name"
//                   value={reference}
//                   onChange={(e) => setReference(e.target.value)}
//                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
//           <Button type="button" variant="secondary" onClick={handleClose}>
//             Cancel
//           </Button>
//           <Button
//             onClick={handleSubmit}
//             disabled={loading || !paymentMethod || (paymentMethod === 'mobile_money' && !phoneNumber) || (paymentMethod === 'bank_transfer' && !accountNumber)}
//           >
//             {loading ? 'Processing...' : `Pay K${Number(invoice?.amount).toLocaleString()}`}
//           </Button>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// export default PaymentModal;