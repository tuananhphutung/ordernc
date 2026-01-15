
import React, { useState } from 'react';
import { User } from '../../types';
import { UserPlus, Lock, Unlock, Trash2, Check, Eye, EyeOff, UserCheck, ShieldAlert, Clock, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';

interface StaffManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const StaffManager: React.FC<StaffManagerProps> = ({ users }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const activeStaff = users.filter(u => u.role === 'staff' && u.status === 'active');
  const pendingStaff = users.filter(u => u.role === 'staff' && u.status === 'pending');
  const lockedStaff = users.filter(u => u.role === 'staff' && u.status === 'locked');

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.phone || !newStaff.password) return alert('Điền đủ thông tin');
    
    if (users.some(u => u.username === newStaff.phone)) {
        return alert("Số điện thoại này đã tồn tại!");
    }

    try {
        await db.collection('nc_users').add({
            name: newStaff.name,
            username: newStaff.phone,
            password: newStaff.password,
            role: 'staff',
            status: 'active',
            phone: newStaff.phone,
            isOnline: false
        });
        alert(`Đã thêm nhân viên thành công!`);
        setIsAdding(false);
        setNewStaff({ name: '', phone: '', password: '' });
    } catch (e: any) {
        alert(`Lỗi: ${e.message}`);
    }
  };

  const updateUserStatus = async (id: string, status: 'active' | 'locked' | 'delete') => {
    try {
        if (status === 'delete') {
            if (confirm('Xác nhận xóa hoặc từ chối nhân viên này?')) {
                await db.collection('nc_users').doc(id).delete();
            }
        } else {
            await db.collection('nc_users').doc(id).update({ status: status });
        }
    } catch (e) {
        console.error("Update error:", e);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 animate-in fade-in">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
         <div className="bg-white p-6 rounded-[24px] shadow-sm border border-indigo-50 flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-gray-500 text-sm font-medium">Tổng nhân viên</p>
                <p className="text-3xl font-black text-gray-800">{activeStaff.length + lockedStaff.length}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-full text-indigo-600"><UserPlus size={28}/></div>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-sm border border-indigo-50 flex items-center justify-between">
            <div className="space-y-1">
                <p className="text-gray-500 text-sm font-medium">Đang Online</p>
                <p className="text-3xl font-black text-green-600">{users.filter(u => u.role === 'staff' && u.isOnline).length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-full text-green-600"><Check size={28}/></div>
         </div>
         <div className={`p-6 rounded-[24px] shadow-sm border flex items-center justify-between transition-all ${pendingStaff.length > 0 ? 'bg-orange-50 border-orange-200 animate-pulse' : 'bg-white border-indigo-50'}`}>
            <div className="space-y-1">
                <p className="text-gray-500 text-sm font-medium">Chờ duyệt</p>
                <p className={`text-3xl font-black ${pendingStaff.length > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{pendingStaff.length}</p>
            </div>
            <div className={`${pendingStaff.length > 0 ? 'bg-orange-500 text-white shadow-lg' : 'bg-orange-50 text-orange-600'} p-4 rounded-full`}>
                <Clock size={28}/>
            </div>
         </div>
      </div>

      {/* Yêu cầu tham gia mới */}
      {pendingStaff.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <AlertCircle className="text-orange-500 animate-bounce" size={24} /> 
                    Yêu cầu tham gia mới ({pendingStaff.length})
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStaff.map(u => (
                    <div key={u.id} className="bg-white p-6 rounded-[24px] shadow-lg border-2 border-orange-100 animate-in slide-in-from-left-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Mới</span>
                        </div>
                        <div className="mb-6">
                            <p className="font-black text-gray-800 text-lg uppercase tracking-tight">{u.name}</p>
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                SĐT: {u.phone || u.username}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => updateUserStatus(u.id, 'active')} 
                                className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-green-100 hover:bg-green-700 active:scale-95 transition-all"
                            >
                                Duyệt ngay
                            </button>
                            <button 
                                onClick={() => updateUserStatus(u.id, 'delete')} 
                                className="flex-1 bg-red-50 text-red-500 py-3.5 rounded-xl font-bold text-sm hover:bg-red-100 active:scale-95 transition-all"
                            >
                                Từ chối
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
      )}

      {/* Danh sách nhân viên */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-black text-gray-800">Danh sách nhân viên</h3>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="w-full md:w-auto bg-[#0f172a] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 shadow-lg shadow-gray-200"
        >
            <UserPlus size={18} /> Thêm nhân viên mới
        </button>
      </div>

      {isAdding && (
        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-8 animate-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Họ tên" className="p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                <input type="text" placeholder="Số điện thoại" className="p-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} />
                <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" className="p-3 border rounded-xl bg-white w-full pr-12 outline-none focus:ring-2 focus:ring-indigo-500" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                </div>
            </div>
            <button onClick={handleAddStaff} className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold w-full md:w-auto hover:bg-indigo-700 transition-all">Lưu nhân viên NC</button>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-indigo-50 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-gray-400 font-bold border-b border-indigo-50">
                    <tr>
                        <th className="px-6 py-5 text-[10px] uppercase tracking-widest">Trạng thái</th>
                        <th className="px-6 py-5 text-[10px] uppercase tracking-widest">Tên nhân viên</th>
                        <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50/50">
                    {[...activeStaff, ...lockedStaff].map(u => (
                        <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-300'}`}></div>
                                    <span className={`text-xs font-bold ${u.status === 'locked' ? 'text-red-500' : 'text-gray-600'}`}>
                                        {u.status === 'locked' ? 'Bị khóa' : (u.isOnline ? 'Online' : 'Offline')}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <p className="font-bold text-gray-800">{u.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{u.username}</p>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex justify-end gap-1">
                                    {u.status === 'active' ? (
                                        <button onClick={() => updateUserStatus(u.id, 'locked')} className="p-2.5 text-orange-400 hover:bg-orange-50 rounded-xl"><Lock size={18} /></button>
                                    ) : (
                                        <button onClick={() => updateUserStatus(u.id, 'active')} className="p-2.5 text-green-500 hover:bg-green-50 rounded-xl"><Unlock size={18} /></button>
                                    )}
                                    <button onClick={() => updateUserStatus(u.id, 'delete')} className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {activeStaff.length === 0 && lockedStaff.length === 0 && (
                        <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400 italic">Chưa có nhân viên nào trong danh sách.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default StaffManager;
