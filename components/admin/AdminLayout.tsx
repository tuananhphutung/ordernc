
import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarClock, Package, LogOut, BarChart2 } from 'lucide-react';
import Dashboard from './Dashboard';
import StaffManager from './StaffManager';
import ShiftManager from './ShiftManager';
import InventoryManager from './InventoryManager';
import RevenueReport from './RevenueReport';
import { User, Order, MenuItem, CheckInRecord, Shift } from '../../types';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  orders: Order[];
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  checkIns: CheckInRecord[];
  onNotify: (userId: string, message: string) => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
    user, onLogout, users, setUsers, orders, 
    menuItems, setMenuItems, shifts, setShifts, 
    checkIns, onNotify 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'staff' | 'shifts' | 'inventory'>('dashboard');

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center justify-center w-full py-2 transition-all ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`}
    >
        <div className={`p-1.5 rounded-xl ${activeTab === id ? 'bg-indigo-50 shadow-sm' : ''}`}>
            <Icon size={20} />
        </div>
        <span className="text-[8px] font-black mt-1 uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-indigo-50/20 flex-col md:flex-row">
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg">NC</div>
              <span className="font-black text-gray-800 text-sm uppercase tracking-tighter">Admin Nước</span>
          </div>
          <button onClick={() => onLogout()} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100 shadow-sm active:scale-95 transition-all">Thoát</button>
      </div>

      <div className="hidden md:flex w-64 h-full bg-slate-900 text-white flex-col shadow-2xl z-50">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">NC</div>
              <div>
                  <h1 className="text-lg font-black text-indigo-500 uppercase tracking-tighter">Order Nước</h1>
                  <p className="text-slate-500 text-[8px] font-black mt-1 uppercase tracking-widest">Quản lý hệ thống</p>
              </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng quan NC' },
            { id: 'revenue', icon: BarChart2, label: 'Báo cáo NC' },
            { id: 'inventory', icon: Package, label: 'Thực đơn & Kho' },
            { id: 'staff', icon: Users, label: 'Nhân sự NC' },
            { id: 'shifts', icon: CalendarClock, label: 'Lịch trực' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40 translate-x-1' : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'}`}>
                <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => onLogout()} className="w-full flex items-center gap-4 px-5 py-5 text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-500/10 rounded-[24px] transition-all"><LogOut size={18} /> Đăng xuất Admin</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto pt-16 pb-20 md:pt-0 md:pb-0 h-full">
        {activeTab === 'dashboard' && <Dashboard adminUser={user} users={users} orders={orders} shifts={shifts} />}
        {activeTab === 'revenue' && <RevenueReport adminUser={user} orders={orders} users={users} />}
        {activeTab === 'inventory' && <InventoryManager menuItems={menuItems} setMenuItems={setMenuItems} />}
        {activeTab === 'staff' && <StaffManager users={users} setUsers={setUsers} />}
        {activeTab === 'shifts' && <ShiftManager users={users} shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={onNotify} />}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t z-40 flex justify-between px-2 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Admin" />
          <NavItem id="revenue" icon={BarChart2} label="Báo cáo" />
          <NavItem id="inventory" icon={Package} label="Món NC" />
          <NavItem id="staff" icon={Users} label="N.Sự" />
          <NavItem id="shifts" icon={CalendarClock} label="Lịch" />
      </div>
    </div>
  );
};

export default AdminLayout;
