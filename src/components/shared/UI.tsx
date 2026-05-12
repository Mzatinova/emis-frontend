import React from 'react';

export const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string; sub?: string }> = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${color}`}><Icon className="w-5 h-5 text-white" /></div>
    </div>
  </div>
);

export const Badge: React.FC<{ status: 'pending' | 'approved' | 'active' | 'inactive' | 'locked' | string; children?: React.ReactNode }> = ({ status, children }) => {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    locked: 'bg-slate-100 text-slate-700 border-slate-300',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{children || status}</span>;
};

export const PageHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }> = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;
  const w = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl ${w} w-full max-h-[90vh] overflow-auto`} onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}{required && <span className="text-red-500"> *</span>}</label>
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm ${props.className || ''}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select {...props} className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white ${props.className || ''}`} />
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' }> = ({ variant = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-slate-100 text-slate-700',
  };
  return <button {...props} className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`} />;
};

export const Table: React.FC<{ headers: string[]; children: React.ReactNode; empty?: string; rowCount?: number }> = ({ headers, children, empty = 'No records found', rowCount = 0 }) => (
  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>{headers.map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rowCount === 0 ? (
            <tr><td colSpan={headers.length} className="text-center py-12 text-slate-400">{empty}</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  </div>
);

export const Toast: React.FC<{ message: string; onClose: () => void; type?: 'success' | 'error' | 'info' }> = ({ message, onClose, type = 'success' }) => {
  React.useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' };
  return (
    <div className={`fixed top-4 right-4 z-[60] ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top`}>
      {message}
    </div>
  );
};
