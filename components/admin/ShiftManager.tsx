
import React, { useState } from 'react';
import { User, Shift, CheckInRecord } from '../../types';
import { CalendarClock, MapPin, CheckCircle, AlertCircle, Plus, Camera, LogOut, LogIn } from 'lucide-react';
import { db } from '../../firebase';

interface ShiftManagerProps {
  users: User[];
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  checkIns: CheckInRecord[];
  onNotify: (userId: string, message: string) => void;
}

const ShiftManager: React.FC<ShiftManagerProps> = ({ users, shifts, checkIns, onNotify }) => {
  const [newShift, setNewShift] = useState<{staffIds: string[], date: string, start: string, end: string}>({
    staffIds: [], date: '', start: '08:00', end: '16:00'
  });

  const staffList = users.filter(u => u.role === 'staff' && u.status === 'active');

  const handleCreateShift = async () => {
    if (newShift.staffIds.length === 0 || !newShift.date) return alert('Vui lòng chọn nhân viên và ngày');
    
    const shiftData = {
        staffIds: newShift.staffIds,
        date: newShift.date,
        startTime: newShift.start,
        endTime: newShift.end
    };

    try {
        // SỬA LỖI: Sử dụng nc_shifts
        await db.collection('nc_shifts').add(shiftData);
        newShift.staffIds.forEach(uid => {
            onNotify(uid, `Bạn có lịch trực mới ngày ${newShift.date} (${newShift.start} - ${newShift.end})`);
        });

        alert('Đã tạo ca trực thành công!');
        setNewShift({ ...newShift, staffIds: [] });
    } catch (e) {
        alert("Lỗi khi tạo ca trực");
    }
  };

  const toggleStaffSelection = (id: string) => {
    setNewShift(prev => {
        if (prev.staffIds.includes(id)) return { ...prev, staffIds: prev.staffIds.filter(sid => sid !== id) };
        return { ...prev, staffIds: [...prev.staffIds, id] };
    });
  };

  return (
    <div className="p-8 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-indigo-50">
            <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="bg-indigo-600 text-white rounded-full p-1" size={24} /> Giao ca trực NC
            </h3>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ngày trực</label>
                    <input type="date" className="w-full p-3 bg-gray-50 border border-indigo-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={newShift.date} onChange={e => setNewShift({...newShift, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bắt đầu</label>
                        <input type="time" className="w-full p-3 bg-gray-50 border border-indigo-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={newShift.start} onChange={e => setNewShift({...newShift, start: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kết thúc</label>
                        <input type="time" className="w-full p-3 bg-gray-50 border border-indigo-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={newShift.end} onChange={e => setNewShift({...newShift, end: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Chọn nhân viên ({newShift.staffIds.length})</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border border-indigo-50 p-2 rounded-2xl bg-gray-50/30">
                        {staffList.map(u => (
                            <label key={u.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${newShift.staffIds.includes(u.id) ? 'bg-indigo-100/50 text-indigo-700' : 'hover:bg-white text-gray-600'}`}>
                                <input type="checkbox" checked={newShift.staffIds.includes(u.id)} onChange={() => toggleStaffSelection(u.id)} className="accent-indigo-600 w-5 h-5" />
                                <span className="font-bold">{u.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button onClick={handleCreateShift} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                    XÁC NHẬN & THÔNG BÁO
                </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-indigo-50">
             <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <CalendarClock className="text-indigo-600" /> Giám sát chấm công NC
            </h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {checkIns.length === 0 ? <p className="text-gray-300 italic text-center py-10">Chưa có dữ liệu</p> : 
                [...checkIns].slice(0, 15).map(ci => {
                    const staff = users.find(u => u.id === ci.staffId);
                    return (
                        <div key={ci.id} className="p-4 bg-indigo-50/20 border border-indigo-50 rounded-[24px] flex items-start gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-50">
                                {ci.type === 'out' ? <LogOut size={20}/> : <LogIn size={20}/>}
                             </div>
                             <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <p className="font-black text-gray-800">{staff?.name || 'Nhân viên mới'}</p>
                                    <span className="text-[10px] font-bold text-gray-400">{new Date(ci.timestamp).toLocaleTimeString('vi-VN')}</span>
                                </div>
                                <p className="text-[11px] text-indigo-500 font-bold mt-1 uppercase tracking-wider">{ci.type === 'out' ? 'Check-out' : 'Check-in'}</p>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <MapPin size={10} /> {ci.imageUrl ? 'Chụp ảnh xác nhận' : `${ci.latitude.toFixed(3)}, ${ci.longitude.toFixed(3)}`}
                                </p>
                             </div>
                        </div>
                    );
                })}
            </div>
          </div>
      </div>
    </div>
  );
};

export default ShiftManager;
