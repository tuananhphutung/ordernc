
import React, { useState, useRef, useEffect } from 'react';
import { User, CheckInRecord, Shift } from '../types';
import { MapPin, Calendar, User as UserIcon, ShieldCheck, MapPinned, LogOut, Loader2, Save, X, Settings, Upload, Camera, Eye, EyeOff } from 'lucide-react';
import { db, uploadFileToFirebase } from '../firebase';

interface StaffProfileProps {
  user: User;
  onCheckIn: (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => void;
  checkInHistory: CheckInRecord[];
  shifts: Shift[];
}

const StaffProfile: React.FC<StaffProfileProps> = ({ user, onCheckIn, checkInHistory, shifts }) => {
  const [checkingIn, setCheckingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [checkType, setCheckType] = useState<'in' | 'out'>('in');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: user.name, password: user.password || '', avatar: user.avatar || '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleActionClick = async (type: 'in' | 'out') => {
    setCheckType(type);
    setCheckingIn(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
       alert("Trình duyệt không hỗ trợ định vị.");
       setCheckingIn(false);
       return;
    }

    const highAccuracyOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };

    const handleSuccess = (position: GeolocationPosition) => {
        onCheckIn(position.coords.latitude, position.coords.longitude, type);
        setCheckingIn(false);
    };

    const handleError = (error: GeolocationPositionError) => {
        setCheckingIn(false);
        if (error.code === error.PERMISSION_DENIED) {
            alert("Bắt buộc cấp quyền vị trí để chấm công.");
        } else if (confirm("GPS yếu, bạn muốn dùng Camera để chấm công?")) {
            openCamera();
        }
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, highAccuracyOptions);
  };

  const openCamera = async () => {
      setShowCamera(true);
      setCheckingIn(false); 
      try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (e: any) {
          alert("Lỗi mở camera.");
          setShowCamera(false);
      }
  };

  const closeCamera = () => {
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
      }
      setShowCamera(false);
  };

  const captureAndSubmit = () => {
      if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => {
                  if (blob) {
                      const file = new File([blob], `checkin_${Date.now()}.jpg`, { type: 'image/jpeg' });
                      onCheckIn(0, 0, checkType, file);
                      closeCamera();
                  }
              }, 'image/jpeg', 0.8);
          }
      }
  };

  const handleSaveProfile = async () => {
      setIsSavingProfile(true);
      try {
          // SỬA LỖI: Cập nhật vào nc_users
          await db.collection('nc_users').doc(user.id).update({
              name: editForm.name,
              password: editForm.password,
              avatar: editForm.avatar
          });
          setIsEditing(false);
          alert("Đã lưu hồ sơ NC!");
      } catch (e) {
          alert("Lỗi cập nhật.");
      } finally {
          setIsSavingProfile(false);
      }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setIsSavingProfile(true);
              const url = await uploadFileToFirebase(file, 'nc_avatars');
              setEditForm(prev => ({ ...prev, avatar: url }));
          } catch (e) {
              alert("Lỗi upload.");
          } finally {
              setIsSavingProfile(false);
          }
      }
  };

  const todayRecords = checkInHistory.filter(c => {
    const d = new Date(c.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).sort((a,b) => a.timestamp - b.timestamp);

  const lastRecord = todayRecords[todayRecords.length - 1];
  const isCheckedIn = lastRecord && lastRecord.type === 'in';
  
  return (
    <div className="p-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-2 rounded-xl text-white text-xs font-bold border border-white/20">
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
        </button>
        
        {isEditing ? (
            <div className="flex flex-col gap-4 animate-in fade-in">
                <div className="flex items-center gap-4">
                    <div className="relative cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                        {editForm.avatar ? (
                            <img src={editForm.avatar} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/50 shadow-lg" />
                        ) : (
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-dashed border-white/30"><UserIcon size={32}/></div>
                        )}
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange}/>
                    </div>
                    <div className="flex-1 space-y-2">
                        <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 outline-none" placeholder="Tên hiển thị" />
                        <div className="relative">
                            <input type={showEditPassword ? "text" : "password"} value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/50 outline-none pr-10" placeholder="Mật khẩu mới" />
                             <button onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-2.5 text-white/50">{showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                    </div>
                </div>
                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-white text-indigo-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                    {isSavingProfile ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Lưu hồ sơ Nước
                </button>
            </div>
        ) : (
            <div className="flex items-center gap-6">
                <div className="bg-white/10 p-1 rounded-2xl backdrop-blur-md border border-white/20">
                    {user.avatar ? (
                        <img src={user.avatar} className="w-24 h-24 rounded-2xl object-cover" />
                    ) : (
                         <div className="w-24 h-24 flex items-center justify-center"><UserIcon size={48} className="text-white/80" /></div>
                    )}
                </div>
                <div>
                    <h2 className="text-3xl font-black">{user.name}</h2>
                    <div className="flex items-center gap-2 mt-2 text-indigo-100/80">
                        <ShieldCheck size={18} />
                        <span className="uppercase tracking-widest text-xs font-bold">{user.role} - Online</span>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-indigo-50 h-full">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-500" /> Lịch làm việc
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-center">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Ca hôm nay</p>
                <p className="font-black text-indigo-800 text-lg">Hành chính (08:00 - 17:00)</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-indigo-50 h-full flex flex-col items-center">
          <h3 className="text-lg font-black text-gray-800 mb-10 w-full flex items-center gap-2">
            <MapPin className="text-indigo-500" /> Điểm danh
          </h3>

          {!isCheckedIn ? (
               <button onClick={() => handleActionClick('in')} disabled={checkingIn} className="group relative w-48 h-48 bg-green-50 rounded-full border-4 border-green-100 shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center overflow-hidden">
                  <div className={`absolute inset-0 bg-green-500/10 ${checkingIn ? 'animate-pulse' : ''}`}></div>
                  <MapPinned size={48} className="text-green-600 mb-2" />
                  <span className="font-black text-green-600 tracking-wider">BẮT ĐẦU CA</span>
               </button>
          ) : (
               <button onClick={() => handleActionClick('out')} disabled={checkingIn} className="group relative w-48 h-48 bg-red-50 rounded-full border-4 border-red-100 shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center overflow-hidden">
                  <div className={`absolute inset-0 bg-red-500/10 ${checkingIn ? 'animate-pulse' : ''}`}></div>
                  <LogOut size={48} className="text-red-600 mb-2" />
                  <span className="font-black text-red-600 tracking-wider">KẾT THÚC CA</span>
               </button>
          )}
          
          <p className="mt-8 text-sm text-gray-400 font-medium">Chấm công bằng định vị GPS của quán</p>
        </div>
      </div>

      {showCamera && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
              <div className="relative flex-1 bg-black flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  <button onClick={closeCamera} className="absolute top-4 right-4 text-white p-3 bg-black/50 rounded-full"><X size={32} /></button>
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center pb-safe">
                      <button onClick={captureAndSubmit} className="w-24 h-24 bg-white rounded-full border-8 border-gray-300 shadow-xl flex items-center justify-center active:scale-90 transition-all">
                          <div className="w-16 h-16 bg-white border-4 border-black rounded-full"></div>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffProfile;
