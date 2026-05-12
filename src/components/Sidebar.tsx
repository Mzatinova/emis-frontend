import React, { useState } from 'react';
import { useEMIS, Role } from '@/contexts/EMISContext';
import {
  LayoutDashboard, Users, Settings, ScrollText, GraduationCap, CalendarDays,
  FileText, Search, BookOpen, Layers, CheckSquare, ClipboardList, Download,
  History, LogOut, ShieldCheck,
  CreditCard,
  Receipt,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Props {
  active: string;
  setActive: (k: string) => void;
}

const menus: Record<Role, { key: string; label: string; icon: any }[]> = {

  technician: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'users', label: 'Staff Management', icon: Users },
    { key: 'students', label: 'Student Management', icon: GraduationCap },
    // { key: 'settings', label: 'System Settings', icon: Settings },
    { key: 'audit', label: 'Audit Logs', icon: ScrollText },
  ],
  administrator: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'students', label: 'Students Management', icon: GraduationCap },
    { key: 'instructors', label: 'Instructor Management', icon: Users },
    { key: 'programs', label: 'Program Management', icon: BookOpen },
    { key: 'sessions', label: 'Academic Sessions', icon: CalendarDays },
    { key: 'results', label: 'Results Management', icon: FileText },

  ],
  instructor: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'myclasses', label: 'My Classes', icon: BookOpen },
    { key: 'mystudents', label: 'My Students', icon: Users },
    { key: 'results', label: 'Results Management', icon: FileText },

  ],
  accounts: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'invoices', label: 'Registration Approval', icon: Receipt },
    { key: 'fees', label: 'Fee Structure', icon: DollarSign },
    { key: 'registered', label: 'Registered Students', icon: Users },
  ],

  student: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'registration', label: 'Registration', icon: CreditCard },
    { key: 'results', label: 'My Results', icon: FileText },
    { key: 'invoices', label: 'My Invoices', icon: Receipt },
    { key: 'download', label: 'Download Results', icon: Download },
    { key: 'history', label: 'Result History', icon: History },
  ],
};

const roleColors: Record<Role, string> = {
  technician: 'from-green-800 to-green-950',
  administrator: 'from-green-700 to-green-900',
  instructor: 'from-green-600 to-green-800',
  accounts: 'from-green-500 to-green-700',
  student: 'from-green-400 to-green-600',
};

const Sidebar: React.FC<Props> = ({ active, setActive }) => {
  const { currentUser, logout } = useEMIS();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) return null;
  const items = menus[currentUser.role];

  return (
    <>
      {/* Collapsed Sidebar */}
      <aside className={`fixed md:sticky top-0 z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`bg-gradient-to-b ${roleColors[currentUser.role]} text-white flex flex-col h-screen sticky top-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>

          {/* Header */}
          <div className={`p-5 border-b border-white/10 ${collapsed ? 'px-2' : ''}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
                <div className="bg-white/20 p-2 rounded-lg shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                {!collapsed && (
                  <div className="overflow-hidden">
                    <h1 className="text-lg font-bold">EMIS</h1>
                    <p className="text-xs text-white/70 capitalize truncate">{currentUser.role} Portal</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {items.map(item => {
              const Icon = item.icon;
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActive(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-white/90 hover:bg-white/10'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-white/10">
            {!collapsed && (
              <div className="px-3 py-2 mb-2 overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-white/60 truncate">{currentUser.email || currentUser.regNumber}</p>
              </div>
            )}

            {collapsed && (
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm font-bold">{currentUser.name.charAt(0)}</span>
                </div>
              </div>
            )}

            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/90 hover:bg-white/10 transition ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Sign Out' : ''}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-20 bg-white rounded-full p-1 shadow-md border border-slate-200 hover:bg-slate-50 transition text-slate-600 z-50"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when collapsed is false */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
};

export default Sidebar;