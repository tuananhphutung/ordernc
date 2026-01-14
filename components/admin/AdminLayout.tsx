
import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarClock, Package, LogOut, BarChart2, Trash2 } from 'lucide-react';
import Dashboard from './Dashboard';
import StaffManager from './StaffManager';
import ShiftManager from './ShiftManager';
import InventoryManager from './InventoryManager';
import RevenueReport from './RevenueReport';
import DeletedHistory from './DeletedHistory';
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'revenue' | 'deleted' | 'staff' | 'shifts' | 'inventory'>('dashboard');

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`flex flex-col items-center justify-center w-full py-1.5 transition-all ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`}
    >
        <div className={`p-1 rounded-xl ${activeTab === id ? 'bg-indigo-50' : ''}`}>
            <Icon size={20} />
        </div>
        <span className="text-[8px] font-black mt-0.5 uppercase">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-indigo-50/20 flex-col md:flex-row">
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">NC</div>
              <span className="font-bold text-gray-800 text-sm uppercase">Admin Nước</span>
          </div>
          <button onClick={onLogout} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold border">Đăng xuất</button>
      </div>

      <div className="hidden md:flex w-64 h-full bg-slate-900 text-white flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-800">
          <h1 className="text-xl font-black text-indigo-500 uppercase">Order Nước</h1>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase">Hệ thống Quản lý NC</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><LayoutDashboard size={18} /> Tổng quan NC</button>
          <button onClick={() => setActiveTab('revenue')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'revenue' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><BarChart2 size={18} /> Báo cáo NC</button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'inventory' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><Package size={18} /> Thực đơn NC</button>
          <button onClick={() => setActiveTab('staff')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'staff' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><Users size={18} /> Nhân sự NC</button>
          <button onClick={() => setActiveTab('shifts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${activeTab === 'shifts' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}><CalendarClock size={18} /> Ca trực NC</button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-4 text-red-400 font-bold text-sm hover:bg-red-500/10 rounded-2xl"><LogOut size={18} /> Thoát Admin NC</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto pt-14 pb-20 md:pt-0 md:pb-0 h-full">
        {activeTab === 'dashboard' && <Dashboard adminUser={user} users={users} orders={orders} shifts={shifts} />}
        {activeTab === 'revenue' && <RevenueReport adminUser={user} orders={orders} />}
        {activeTab === 'inventory' && <InventoryManager menuItems={menuItems} setMenuItems={setMenuItems} />}
        {activeTab === 'staff' && <StaffManager users={users} setUsers={setUsers} />}
        {activeTab === 'shifts' && <ShiftManager users={users} shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={onNotify} />}
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-between px-0.5 pb-safe">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Admin" />
          <NavItem id="revenue" icon={BarChart2} label="D.Thu" />
          <NavItem id="inventory" icon={Package} label="Món NC" />
          <NavItem id="staff" icon={Users} label="N.Sự" />
          <NavItem id="shifts" icon={CalendarClock} label="Lịch" />
      </div>
    </div>
  );
};

export default AdminLayout;
