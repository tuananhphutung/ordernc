
import React, { useState, useMemo } from 'react';
import { Order, User, MenuItem } from '../../types';
import { 
  Calendar, CreditCard, Wallet, TrendingUp, Search, 
  Clock, Trash2, Filter, ChevronDown, ChevronUp, 
  User as UserIcon, ArrowUpDown, CalendarDays, FileText,
  Download, Printer, RefreshCcw, Coffee
} from 'lucide-react';
import { db } from '../../firebase';

interface RevenueReportProps {
  orders: Order[];
  adminUser: User;
  users: User[];
  menuItems: MenuItem[];
}

const RevenueReport: React.FC<RevenueReportProps> = ({ orders, adminUser, users, menuItems }) => {
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'cash' | 'transfer' | 'postpaid'>('all');
  
  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'time-desc' | 'time-asc' | 'price-desc' | 'price-asc'>('time-desc');

  const setQuickDate = (type: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'yesterday') {
      start.setDate(now.getDate() - 1);
      end.setDate(now.getDate() - 1);
    } else if (type === 'week') {
      const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
      start = new Date(now.setDate(first));
      end = new Date();
    } else if (type === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date();
    }
    
    setStartDate(start.toLocaleDateString('en-CA'));
    setEndDate(end.toLocaleDateString('en-CA'));
  };

  // 1. Thống kê tổng quan cho khoảng ngày (Không phụ thuộc Tab)
  const rangeStats = useMemo(() => {
    const rangeOrders = orders.filter(o => {
      const d = new Date(o.orderDate || o.timestamp).toLocaleDateString('en-CA');
      return d >= startDate && d <= endDate && o.status === 'completed';
    });

    return {
      total: rangeOrders.reduce((sum, o) => sum + o.total, 0),
      cash: rangeOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0),
      transfer: rangeOrders.filter(o => o.paymentMethod === 'transfer').reduce((sum, o) => sum + o.total, 0),
      postpaid: rangeOrders.filter(o => o.paymentMethod === 'postpaid').reduce((sum, o) => sum + o.total, 0),
      count: rangeOrders.length
    };
  }, [orders, startDate, endDate]);

  // 2. Danh sách đơn hàng đã lọc theo Tab, Search và Món
  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const orderDateStr = new Date(o.orderDate || o.timestamp).toLocaleDateString('en-CA');
      const matchesDate = orderDateStr >= startDate && orderDateStr <= endDate;
      const matchesTab = activeTab === 'all' || o.paymentMethod === activeTab;
      const matchesStaff = selectedStaffId === 'all' || o.staffId === selectedStaffId;
      const matchesItem = selectedItemId === 'all' || o.items.some(item => (item.id === selectedItemId || item.parentId === selectedItemId));
      const matchesMinPrice = minPrice === '' || o.total >= Number(minPrice);
      const matchesMaxPrice = maxPrice === '' || o.total <= Number(maxPrice);
      const matchesSearch = 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerPhone || '').includes(searchQuery);
      
      return matchesDate && matchesTab && matchesSearch && matchesStaff && matchesItem && matchesMinPrice && matchesMaxPrice && o.status === 'completed';
    });

    return result.sort((a, b) => {
      if (sortBy === 'time-desc') return b.timestamp - a.timestamp;
      if (sortBy === 'time-asc') return a.timestamp - b.timestamp;
      if (sortBy === 'price-desc') return b.total - a.total;
      if (sortBy === 'price-asc') return a.total - b.total;
      return 0;
    });
  }, [orders, startDate, endDate, activeTab, searchQuery, selectedStaffId, selectedItemId, minPrice, maxPrice, sortBy]);

  const currentTabTotal = filteredOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-4 md:p-8 pb-32 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3 uppercase tracking-tighter">
                <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                    <TrendingUp size={28} />
                </div>
                Trung tâm Doanh thu NC
            </h2>
            <p className="text-gray-400 text-[10px] font-black mt-2 ml-14 uppercase tracking-[0.2em]">Hệ thống kiểm soát dòng tiền thời gian thực</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
             <button onClick={() => setQuickDate('today')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">Hôm nay</button>
             <button onClick={() => setQuickDate('week')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">Tuần này</button>
             <button onClick={() => setQuickDate('month')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">Tháng này</button>
             <div className="w-px h-4 bg-gray-200 mx-1 hidden sm:block"></div>
             <button onClick={() => { setStartDate(new Date().toLocaleDateString('en-CA')); setEndDate(new Date().toLocaleDateString('en-CA')); setSearchQuery(''); setActiveTab('all'); setSelectedItemId('all'); }} className="p-2 text-gray-400 hover:text-indigo-600 rounded-xl"><RefreshCcw size={16}/></button>
          </div>
      </div>

      {/* Summary Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            label="TỔNG DOANH THU" 
            value={rangeStats.total} 
            icon={TrendingUp} 
            color="indigo" 
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <StatCard 
            label="TIỀN MẶT THỰC THU" 
            value={rangeStats.cash} 
            icon={Wallet} 
            color="orange" 
            isActive={activeTab === 'cash'}
            onClick={() => setActiveTab('cash')}
          />
          <StatCard 
            label="CHUYỂN KHOẢN (QR)" 
            value={rangeStats.transfer} 
            icon={CreditCard} 
            color="blue" 
            isActive={activeTab === 'transfer'}
            onClick={() => setActiveTab('transfer')}
          />
          <StatCard 
            label="GHI NỢ (CHỜ THU)" 
            value={rangeStats.postpaid} 
            icon={Clock} 
            color="teal" 
            isActive={activeTab === 'postpaid'}
            onClick={() => setActiveTab('postpaid')}
          />
      </div>

      {/* Smart Filter & Search Bar */}
      <div className="bg-white rounded-[36px] shadow-sm border border-gray-100 mb-8 overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-9 relative">
                      <Search className="absolute left-5 top-5 text-gray-400" size={20}/>
                      <input 
                        type="text" 
                        placeholder="Tìm khách hàng, số điện thoại hoặc mã đơn hàng..." 
                        value={searchQuery} 
                        onChange={e=>setSearchQuery(e.target.value)} 
                        className="w-full pl-14 pr-6 py-5 bg-gray-50 border-none rounded-[24px] outline-none font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm shadow-inner"
                      />
                  </div>
                  <div className="md:col-span-3">
                      <button 
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`w-full flex items-center justify-center gap-2 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest border transition-all ${showAdvanced ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'}`}
                      >
                        <Filter size={18} /> {showAdvanced ? 'Đóng bộ lọc' : 'Lọc nâng cao'}
                      </button>
                  </div>
              </div>

              {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-dashed animate-in slide-in-from-top-4 duration-300">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Calendar size={12}/> Từ ngày
                          </label>
                          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-inner"/>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Calendar size={12}/> Đến ngày
                          </label>
                          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-inner"/>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <UserIcon size={12}/> Người bán
                          </label>
                          <select value={selectedStaffId} onChange={e=>setSelectedStaffId(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-inner">
                              <option value="all">Tất cả nhân viên</option>
                              {users.filter(u => u.role === 'staff').map(u => (
                                  <option key={u.id} value={u.id}>{u.name}</option>
                              ))}
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Coffee size={12}/> Lọc theo món
                          </label>
                          <select value={selectedItemId} onChange={e=>setSelectedItemId(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-inner">
                              <option value="all">Tất cả các món</option>
                              {menuItems.filter(item => !item.isParent).map(item => (
                                  <option key={item.id} value={item.id}>{item.name}</option>
                              ))}
                          </select>
                      </div>
                      <div className="md:col-span-2 lg:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ArrowUpDown size={12}/> Sắp xếp danh sách
                          </label>
                          <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-gray-700 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 shadow-inner">
                              <option value="time-desc">Thời gian (Mới nhất)</option>
                              <option value="time-asc">Thời gian (Cũ nhất)</option>
                              <option value="price-desc">Giá trị (Cao xuống thấp)</option>
                              <option value="price-asc">Giá trị (Thấp lên cao)</option>
                          </select>
                      </div>
                      <div className="md:col-span-2 lg:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">Lọc theo giá trị đơn hàng</label>
                          <div className="flex items-center gap-4">
                              <input type="number" placeholder="Từ (đ)" value={minPrice} onChange={e=>setMinPrice(e.target.value)} className="flex-1 p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm shadow-inner focus:bg-white"/>
                              <div className="w-4 h-0.5 bg-gray-200"></div>
                              <input type="number" placeholder="Đến (đ)" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} className="flex-1 p-4 bg-gray-50 border-none rounded-2xl outline-none font-bold text-sm shadow-inner focus:bg-white"/>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-gray-50 p-2.5 gap-2.5 overflow-x-auto scrollbar-hide border-t">
              {[
                { id: 'all', label: 'Tất cả giao dịch', color: 'bg-indigo-600', icon: FileText },
                { id: 'cash', label: 'Tiền mặt', color: 'bg-orange-500', icon: Wallet },
                { id: 'transfer', label: 'Chuyển khoản QR', color: 'bg-blue-600', icon: CreditCard },
                { id: 'postpaid', label: 'Ghi nợ / Trả sau', color: 'bg-teal-600', icon: Clock }
              ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id as any)} 
                    className={`flex-1 min-w-[160px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === tab.id ? `${tab.color} text-white shadow-lg scale-105` : 'bg-white text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200'}`}
                  >
                      <tab.icon size={16} />
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-[44px] shadow-sm border border-gray-100 overflow-hidden relative">
        <div className="p-8 md:p-10 border-b border-gray-50 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900 tracking-tighter uppercase text-2xl">Nhật ký đơn hàng</h3>
                    <div className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">Live</div>
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Hiển thị {filteredOrders.length} trên tổng {rangeStats.count} đơn hàng</p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng theo tiêu chí đã chọn</div>
                <div className="text-3xl font-black text-indigo-900 tracking-tighter">
                    {currentTabTotal.toLocaleString()} <span className="text-sm font-bold opacity-30">đ</span>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-50">
                    <tr>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Mã đơn & Thời gian</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Chi tiết khách hàng</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Loại thanh toán</th>
                        <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-right">Tổng thanh toán</th>
                        <th className="px-10 py-6 text-right w-20"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-10 py-32 text-center">
                                <div className="flex flex-col items-center justify-center opacity-20">
                                    <Search size={80} className="mb-6 text-gray-400" strokeWidth={1} />
                                    <p className="font-black uppercase tracking-[0.3em] text-xs">Không tìm thấy giao dịch nào</p>
                                    <p className="text-[10px] font-bold mt-2 text-gray-500 uppercase">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredOrders.map(order => {
                            const staff = users.find(u => u.id === order.staffId);
                            return (
                                <tr key={order.id} className="hover:bg-indigo-50/30 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="font-black text-gray-900 text-sm uppercase tracking-tighter">
                                            #{order.id.slice(-6).toUpperCase()}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1.5 flex items-center gap-1.5">
                                            <Calendar size={10} /> 
                                            {new Date(order.orderDate || order.timestamp).toLocaleDateString('vi-VN')} • 
                                            <Clock size={10} />
                                            {new Date(order.timestamp).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <p className="font-black text-indigo-950 text-xs uppercase tracking-tight">{order.customerName || 'Khách vãng lai'}</p>
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 font-bold uppercase">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
                                            Bán bởi: <span className="text-indigo-600">{staff?.name || 'Hệ thống'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase border-2 ${
                                            order.paymentMethod === 'cash' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                            order.paymentMethod === 'transfer' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-teal-50 text-teal-600 border-teal-100'
                                        }`}>
                                            {order.paymentMethod === 'cash' ? <Wallet size={12}/> : order.paymentMethod === 'transfer' ? <CreditCard size={12}/> : <Clock size={12}/>}
                                            {order.paymentMethod === 'cash' ? 'Tiền mặt' : order.paymentMethod === 'transfer' ? 'VietQR 24/7' : 'Ghi nợ/Trả sau'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <p className="font-black text-gray-950 text-lg tracking-tighter">{order.total.toLocaleString()}đ</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{order.items.length} món đã chọn</p>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                                <Printer size={18}/>
                                            </button>
                                            <button 
                                                onClick={async () => { if(confirm("Cảnh báo: Đơn hàng sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu. Tiếp tục?")) await db.collection('nc_orders').doc(order.id).delete(); }} 
                                                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
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

const StatCard = ({ label, value, icon: Icon, color, isActive, onClick }: any) => {
    const colors: any = {
        indigo: 'from-indigo-600 to-blue-700 text-white shadow-indigo-200',
        orange: 'from-orange-500 to-red-600 text-white shadow-orange-200',
        blue: 'from-blue-600 to-indigo-700 text-white shadow-blue-200',
        teal: 'from-teal-600 to-emerald-700 text-white shadow-teal-200'
    };
    
    return (
        <button 
          onClick={onClick}
          className={`p-8 rounded-[40px] bg-gradient-to-br shadow-2xl ${colors[color]} relative overflow-hidden group hover:-translate-y-2 hover:shadow-lg transition-all duration-500 cursor-pointer active:scale-95 text-left w-full block ${isActive ? 'ring-4 ring-offset-2 ring-white scale-105 z-10' : 'opacity-90'}`}
        >
            {/* Background Icon Decoration */}
            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
                <Icon size={180} />
            </div>
            
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-80">{label}</p>
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                        <Icon size={18} />
                    </div>
                </div>
                
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black tracking-tighter drop-shadow-md">{value.toLocaleString()}</span>
                    <span className="text-sm font-bold opacity-60 uppercase">vnđ</span>
                </div>
                
                {isActive && (
                    <div className="mt-3 inline-block px-3 py-1 bg-white/20 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                        Đang lọc dữ liệu
                    </div>
                )}
            </div>
            
            {/* Decorative Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
    );
};

export default RevenueReport;
