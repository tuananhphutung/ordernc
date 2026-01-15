
import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PaymentModal from './components/PaymentModal';
import InstallPrompt from './components/InstallPrompt';
import AdminLayout from './components/admin/AdminLayout';
import Toast from './components/Toast';
import { LoginFormData, User, Order, CartItem, CheckInRecord, MenuItem, OrderSource, Shift, Notification } from './types';
import { Loader2 } from 'lucide-react';
import { db, uploadFileToFirebase } from './firebase';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrderItems, setPendingOrderItems] = useState<CartItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingOrderInfo, setPendingOrderInfo] = useState<{source: OrderSource, name: string, phone: string, date: string} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(true); 

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'order'} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }
  };

  useEffect(() => {
    const unsubUsers = db.collection('nc_users').onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        
        // Kiểm tra xem có nhân viên mới đăng ký không để thông báo cho Admin
        if (currentUser?.role === 'admin') {
            const newPending = items.filter(u => u.status === 'pending').length;
            const prevPending = users.filter(u => u.status === 'pending').length;
            if (newPending > prevPending) {
                setToast({ message: "Có nhân viên mới vừa đăng ký! Hãy kiểm tra danh sách chờ.", type: 'info' });
                playNotificationSound();
            }
        }

        setUsers(items);
        const savedUserId = localStorage.getItem('nc_saved_user_id');
        if (currentUser) {
            if (currentUser.id !== 'offline_admin_nc') {
                const updatedMe = items.find(u => u.id === currentUser.id);
                if (updatedMe && updatedMe.status === 'locked') handleLogout();
                else if (updatedMe) setCurrentUser(updatedMe);
            }
        } else if (savedUserId) {
            if (savedUserId === 'offline_admin_nc') {
                 setCurrentUser({ id: 'offline_admin_nc', name: 'Quản trị Nước', username: 'adminnc', role: 'admin', status: 'active', isOnline: true });
            } else {
                const foundUser = items.find(u => u.id === savedUserId);
                if (foundUser && foundUser.status === 'active') {
                    setCurrentUser(foundUser);
                    db.collection('nc_users').doc(foundUser.id).update({ isOnline: true }).catch(() => {});
                }
            }
        }
        setIsLoggingIn(false);
    });
    const unsubMenu = db.collection('nc_menu').onSnapshot(s => setMenuItems(s.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem))));
    const unsubOrders = db.collection('nc_orders').orderBy('timestamp', 'desc').onSnapshot(s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() } as Order))));
    const unsubShifts = db.collection('nc_shifts').onSnapshot(s => setShifts(s.docs.map(d => ({ id: d.id, ...d.data() } as Shift))));
    const unsubCheckIns = db.collection('nc_checkins').orderBy('timestamp', 'desc').onSnapshot(s => setCheckIns(s.docs.map(d => ({ id: d.id, ...d.data() } as CheckInRecord))));
    const unsubNotifs = db.collection('nc_notifications').orderBy('timestamp', 'desc').onSnapshot(s => setNotifications(s.docs.map(d => ({ id: d.id, ...d.data() } as Notification))));

    return () => { unsubUsers(); unsubMenu(); unsubOrders(); unsubShifts(); unsubCheckIns(); unsubNotifs(); };
  }, [currentUser?.id, users.length]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoggingIn(true);
    if (data.username === 'adminnc' && data.password === '123456') {
        setCurrentUser({ id: 'offline_admin_nc', name: 'Quản trị Nước', username: 'adminnc', role: 'admin', status: 'active', isOnline: true });
        localStorage.setItem('nc_saved_user_id', 'offline_admin_nc');
        setIsLoggingIn(false);
        return; 
    }
    const user = users.find(u => (u.username === data.username || u.phone === data.username) && u.password === data.password);
    if (user && user.status === 'active') {
        db.collection('nc_users').doc(user.id).update({ isOnline: true });
        setCurrentUser(user);
        localStorage.setItem('nc_saved_user_id', user.id);
    } else if (user && user.status === 'pending') {
        alert('Tài khoản của bạn đang chờ Admin duyệt. Vui lòng quay lại sau!');
    } else alert('Thông tin sai hoặc chưa kích hoạt');
    setIsLoggingIn(false);
  };

  const handleRegister = async (data: { name: string, phone: string, password: string }) => {
    const existing = users.find(u => u.username === data.phone || u.phone === data.phone);
    if (existing) {
        setToast({ message: "Số điện thoại này đã tồn tại trên hệ thống!", type: 'error' });
        return;
    }
    try {
        await db.collection('nc_users').add({
            name: data.name,
            username: data.phone,
            phone: data.phone,
            password: data.password,
            role: 'staff',
            status: 'pending',
            isOnline: false,
            createdAt: Date.now()
        });
        setToast({ message: "Đăng ký thành công! Vui lòng chờ Admin duyệt tài khoản.", type: 'success' });
    } catch (e) {
        setToast({ message: "Lỗi đăng ký. Vui lòng thử lại sau.", type: 'error' });
    }
  };

  const handleLogout = async () => {
    const id = currentUser?.id;
    if (id && id !== 'offline_admin_nc') await db.collection('nc_users').doc(id).update({ isOnline: false });
    localStorage.removeItem('nc_saved_user_id');
    setCurrentUser(null);
  };

  const initiateOrder = (items: CartItem[], total: number, source: OrderSource, name: string, phone: string, date: string) => {
    setPendingOrderItems(items);
    setPendingTotal(total);
    setPendingOrderInfo({ source, name, phone, date });
    setShowPaymentModal(true);
  };

  const confirmOrder = async (method: 'cash' | 'transfer' | 'postpaid') => {
    const orderDateTimestamp = pendingOrderInfo?.date ? new Date(pendingOrderInfo.date).getTime() : Date.now();
    const newOrder = {
      items: pendingOrderItems, total: pendingTotal, paymentMethod: method,
      status: 'completed' as const, timestamp: Date.now(), orderDate: orderDateTimestamp,
      staffId: currentUser?.id || 'unknown', source: 'app' as const,
      customerName: pendingOrderInfo?.name || '', customerPhone: pendingOrderInfo?.phone || ''
    };
    try {
        await db.collection('nc_orders').add(newOrder);
        pendingOrderItems.forEach(async (item) => {
            const menuRef = db.collection('nc_menu').doc(item.parentId || item.id);
            const doc = await menuRef.get();
            if (doc.exists) {
                const currentStock = doc.data()?.stock || 0;
                await menuRef.update({ stock: Math.max(0, currentStock - item.quantity) });
            }
        });
        setToast({ message: "Đã lưu đơn hàng thành công!", type: 'success' });
    } catch (e) { alert("Lỗi lưu đơn."); }
    setShowPaymentModal(false); setCart([]); setPendingOrderItems([]); setPendingTotal(0);
  };

  const handleCheckIn = async (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => {
    let imageUrl = '';
    if (imageFile) imageUrl = await uploadFileToFirebase(imageFile, 'nc_checkin');
    await db.collection('nc_checkins').add({ staffId: currentUser?.id || '', timestamp: Date.now(), latitude: lat, longitude: lng, type, imageUrl });
  };

  return (
    <>
      <InstallPrompt />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isLoggingIn ? (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-indigo-500 w-12 h-12 mb-4" />
              <span className="font-medium text-gray-500">Đang tải Order Nước...</span>
          </div>
      ) : !currentUser ? (
        <LoginForm onSubmit={handleLogin} onRegister={handleRegister} />
      ) : (
        currentUser.role === 'admin' ? (
            <AdminLayout 
                user={currentUser} onLogout={handleLogout} users={users} setUsers={setUsers}
                orders={orders} menuItems={menuItems} setMenuItems={setMenuItems}
                shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={() => {}}
            />
        ) : (
            <>
            <MainLayout 
                user={currentUser} onLogout={handleLogout} orders={orders}
                cart={cart} setCart={setCart} menuItems={menuItems}
                onPlaceOrder={initiateOrder} onCheckIn={handleCheckIn}
                checkInHistory={checkIns.filter(c => c.staffId === currentUser.id)}
                notifications={notifications.filter(n => n.userId === currentUser.id)}
                shifts={shifts}
            />
            {showPaymentModal && <PaymentModal total={pendingTotal} onClose={() => setShowPaymentModal(false)} onConfirm={confirmOrder} />}
            </>
        )
      )}
    </>
  );
};

export default App;
