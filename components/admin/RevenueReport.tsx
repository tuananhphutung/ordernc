
import React, { useState, useMemo } from 'react';
import { Order, User } from '../../types';
import { 
  Calendar, CreditCard, Wallet, TrendingUp, Search, 
  Clock, Trash2, Filter, ChevronDown, ChevronUp, 
  User as UserIcon, ArrowUpDown, CalendarDays 
} from 'lucide-react';
import { db } from '../../firebase';

interface RevenueReportProps {
  orders: Order[];
  adminUser: User;
  users: User[]; // Thêm users để lọc theo nhân viên
}

const RevenueReport: React.FC<RevenueReportProps> = ({ orders, adminUser, users }) => {
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cash' | 'transfer' | 'postpaid'>('all');
  
  // Advanced Filters State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'time-desc' | 'time-asc' | 'price-desc' | 'price-asc'>('time-desc');

  // Quick Date Selectors
  const setQuickDate = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (type === 'month') {
      start.setMonth(now.getMonth() - 1);
    }
    
    setStartDate(start.toLocaleDateString('en-CA'));
    setEndDate(end.toLocaleDateString('en-CA'));
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const orderDateStr = new Date(o.orderDate || o.timestamp).toLocaleDateString('en-CA');
      const matchesDate = orderDateStr >= startDate && orderDateStr <= endDate;
      const matchesTab = activeTab === 'all' || o.paymentMethod === activeTab;
      const matchesStaff = selectedStaffId === 'all' || o.staffId === selectedStaffId;
      const matchesMinPrice = minPrice === '' || o.total >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || o.total <= Number(maxPrice);
      const matchesSearch = 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerPhone || '').includes(searchQuery);
      
      return matchesDate && matchesTab && matchesSearch && matchesStaff && matchesMinPrice && matchesMaxPrice && o.status === 'completed';
    });

    // Sorting logic
    return result.sort((a, b) => {
      if (sortBy === 'time-desc') return b.timestamp - a.timestamp;
      if (sortBy === 'time-asc') return a.timestamp - b.timestamp;
      if (sortBy === 'price-desc') return b.total - a.total;
      if (sortBy === 'price-asc') return a.total - b.total;
      return 0;
    });
  }, [orders, startDate, endDate, activeTab, searchQuery, selectedStaffId, minPrice, maxPrice, sortBy]);

  const stats = useMemo(() => {
    const total = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const cash = filteredOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const transfer = filteredOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0);
    const postpaid = filteredOrders.filter(o => o.paymentMethod === 'postpaid').reduce((sum, o) => sum + o.total, 0);
    return { total, cash, transfer, postpaid, count: filteredOrders.length };
  }, [filteredOrders]);

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                    <TrendingUp size={24} />
                </div>
                Báo cáo Doanh thu NC
            </h2>
            <p className="text-gray-400 text-xs font-bold mt-1 ml-12 uppercase tracking-widest">Hệ thống quản lý dòng tiền thông minh</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
             <button onClick={() => setQuickDate('today')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">Hôm nay</button>
             <button onClick={() => setQuickDate('yesterday')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">Hôm qua</button>
             <button onClick={() => setQuickDate('week')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">7 ngày</button>
          </div>
      </div>

      {/* Search & Main Filters */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-8 relative">
                      <Search className="absolute left-4 top-4 text-gray-400" size={20}/>
                      <input 
                        type="text" 
                        placeholder="Tìm theo tên khách, SĐT hoặc mã đơn..." 
                        value={searchQuery} 
                        onChange={e=>setSearchQuery(e.target.value)} 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:border-indigo-500 transition-all text-sm shadow-inner"
                      />
                  </div>
                  <div className="md:col-span-4">
                      <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${showAdvanced ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                      >
                        <Filter size={18} /> {showAdvanced ? 'Đóng bộ lọc' : 'Bộ lọc nâng cao'}
                      </button>
                  </div>
              </div>

              {/* Advanced Filter Panel */}
              {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-dashed animate-in slide-in-from-top-4 duration-300">
                      <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              <Calendar size={12} /> Từ ngày
                          </label>
                          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                      <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              <Calendar size={12} /> Đến ngày
                          </label>
                          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                      <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              <UserIcon size={12} /> Nhân viên bán
                          </label>
                          <select value={selectedStaffId} onChange={e=>setSelectedStaffId(e.target.value)} className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500">
                              <option value="all">Tất cả nhân viên</option>
                              {users.filter(u => u.role === 'staff').map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              <ArrowUpDown size={12} /> Sắp xếp theo
                          </label>
                          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-full p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500">
                              <option value="time-desc">Mới nhất trước</option>
                              <option value="time-asc">Cũ nhất trước</option>
                              <option value="price-desc">Giá trị cao nhất</option>
                              <option value="price-asc">Giá trị thấp nhất</option>
                          </select>
                      </div>
                      <div className="md:col-span-2 lg:col-span-2 space-y-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Khoảng tiền thanh toán</label>
                          <div className="flex items-center gap-3">
                              <input type="number" placeholder="Từ (đ)" value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="flex-1 p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm focus:bg-white"/>
                              <div className="w-4 h-0.5 bg-gray-200"></div>
                              <input type="number" placeholder="Đến (đ)" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="flex-1 p-3.5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm focus:bg-white"/>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          <div className="flex bg-gray-50/50 p-2 gap-2 overflow-x-auto scrollbar-hide border-t">
              {[
                { id: 'all', label: 'Tất cả đơn', color: 'bg-indigo-600' },
                { id: 'cash', label: 'Tiền mặt', color: 'bg-orange-500' },
                { id: 'transfer', label: 'Chuyển khoản', color: 'bg-blue-600' },
                { id: 'postpaid', label: 'Ghi nợ/Trả sau', color: 'bg-teal-600' }
              ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`flex-1 min-w-[120px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-md` : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="TỔNG THU NC" value={stats.total} icon={TrendingUp} color="indigo" />
          <StatCard label="TIỀN MẶT" value={stats.cash} icon={Wallet} color="orange" />
          <StatCard label="CHUYỂN KHOẢN" value={stats.transfer} icon={CreditCard} color="blue" />
          <StatCard label="CHỜ THANH TOÁN" value={stats.postpaid} icon={Clock} color="teal" />
      </div>

      {/* Result Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="p-8 border-b border-gray-50 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="font-black text-gray-900 tracking-tighter uppercase text-xl">Lịch sử giao dịch</h3>
                <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase">Hiển thị {stats.count} kết quả phù hợp</p>
            </div>
            <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full font-black text-[10px] uppercase">
                <CalendarDays size={14} /> 
                {new Date(startDate).toLocaleDateString('vi-VN')} - {new Date(endDate).toLocaleDateString('vi-VN')}
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400">
                    <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Thời gian</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Khách & Nhân viên</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Phương thức</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Thành tiền</th>
                        <th className="px-8 py-5 text-right w-16"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-8 py-24 text-center">
                                <div className="flex flex-col items-center justify-center opacity-20">
                                    <Search size={64} className="mb-4" />
                                    <p className="font-black uppercase tracking-widest text-sm">Không có dữ liệu đơn hàng</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredOrders.map(order => {
                            const staff = users.find(u => u.id === order.staffId);
                            return (
                                <tr key={order.id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="font-black text-gray-900 text-sm">
                                            {new Date(order.orderDate || order.timestamp).toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'})}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                            {new Date(order.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} • #{order.id.slice(-4).toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-indigo-950 text-xs uppercase tracking-tight">{order.customerName || 'Khách lẻ'}</p>
                                        <div className="flex items-center gap-1.5 mt-1 text-[9px] text-gray-400 font-bold uppercase">
                                            <UserIcon size={10} className="text-indigo-400"/> NV: {staff?.name || '---'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                                            order.paymentMethod === 'cash' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                            order.paymentMethod === 'transfer' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-teal-50 text-teal-600 border-teal-100'
                                        }`}>
                                            {order.paymentMethod === 'cash' ? <Wallet size={10}/> : order.paymentMethod === 'transfer' ? <CreditCard size={10}/> : <Clock size={10}/>}
                                            {order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'transfer' ? 'VietQR' : 'Ghi nợ'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <p className="font-black text-gray-950 text-base">{order.total.toLocaleString()}đ</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{order.items.length} món</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={async () => { if(confirm("Xác nhận xóa vĩnh viễn đơn hàng này khỏi nhật ký?")) await db.collection('nc_orders').doc(order.id).delete(); }} 
                                            className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => {
    const colors: any = {
        indigo: 'from-indigo-600 to-indigo-700 text-white shadow-indigo-200',
        orange: 'from-orange-500 to-orange-600 text-white shadow-orange-200',
        blue: 'from-blue-600 to-blue-700 text-white shadow-blue-200',
        teal: 'from-teal-600 to-teal-700 text-white shadow-teal-200'
    };
    return (
        <div className={`p-8 rounded-[36px] bg-gradient-to-br shadow-xl ${colors[color]} relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
                <Icon size={140} />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-3">{label}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black tracking-tighter">{value.toLocaleString()}</span>
                    <span className="text-sm font-bold opacity-60">đ</span>
                </div>
            </div>
        </div>
    );
};

export default RevenueReport;
