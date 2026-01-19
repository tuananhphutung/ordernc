
import React from 'react';
import { User, Order, Shift } from '../../types';
import { TrendingUp, ShoppingCart, Star, Package } from 'lucide-react';

interface DashboardProps {
  adminUser: User;
  users: User[];
  orders: Order[];
  shifts: Shift[]; 
  onNavigate: (tab: 'dashboard' | 'revenue' | 'staff' | 'shifts' | 'inventory') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ adminUser, users, orders, shifts, onNavigate }) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <div className="p-4 md:p-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                    <TrendingUp size={28} />
                </div>
                Tổng quan Order Nước
            </h2>
            <p className="text-gray-400 text-[10px] font-black mt-2 ml-14 uppercase tracking-[0.2em]">Bảng điều khiển quản trị trung tâm</p>
          </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button 
          onClick={() => onNavigate('revenue')}
          className="bg-white p-8 rounded-[32px] border border-indigo-50 shadow-sm group hover:border-indigo-200 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] text-left w-full block"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Doanh thu Nước</p>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">
            {totalRevenue.toLocaleString('vi-VN')} <span className="text-sm font-bold opacity-30">đ</span>
          </p>
          <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+8.2%</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Xem chi tiết báo cáo</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('revenue')}
          className="bg-white p-8 rounded-[32px] border border-indigo-50 shadow-sm group hover:border-sky-200 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] text-left w-full block"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Đơn hàng NC</p>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
                <ShoppingCart size={20} />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">
            {orders.length} <span className="text-sm font-bold opacity-30">Đơn</span>
          </p>
          <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{totalItems} món</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Quản lý nhật ký đơn</span>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('inventory')}
          className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-2xl shadow-indigo-200 group hover:bg-indigo-700 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] text-left w-full block"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
              <Star size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest opacity-80">Món NC bán chạy</p>
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Star size={20} />
                </div>
            </div>
            <p className="text-3xl font-black mt-1 uppercase tracking-tight">Trà Chanh 247</p>
            <p className="text-[10px] text-indigo-200 font-bold uppercase mt-4 tracking-widest opacity-70">Chỉnh sửa thực đơn</p>
          </div>
        </button>
      </div>

      {/* Secondary Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button 
            onClick={() => onNavigate('inventory')}
            className="bg-white p-6 rounded-[32px] border border-indigo-50 shadow-sm flex items-center gap-6 cursor-pointer hover:border-orange-200 hover:shadow-md transition-all active:scale-[0.99] text-left w-full block"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Package size={32} />
              </div>
              <div>
                  <h4 className="font-black text-gray-800 uppercase text-xs tracking-wider">Trạng thái kho NC</h4>
                  <p className="text-sm text-gray-500 mt-1">Kiểm tra tồn kho các loại nguyên liệu.</p>
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => onNavigate('staff')}
            className="bg-white p-6 rounded-[32px] border border-indigo-50 shadow-sm flex items-center gap-6 cursor-pointer hover:border-green-200 hover:shadow-md transition-all active:scale-[0.99] text-left w-full block"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Star size={32} />
              </div>
              <div>
                  <h4 className="font-black text-gray-800 uppercase text-xs tracking-wider">Hiệu suất nhân sự</h4>
                  <p className="text-sm text-gray-500 mt-1">Quản lý danh sách và quyền nhân viên.</p>
              </div>
            </div>
          </button>
      </div>
    </div>
  );
};

export default Dashboard;
