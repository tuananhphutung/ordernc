
import React, { useState, useEffect, useRef } from 'react';
import LoginForm from './components/LoginForm';
import MainLayout from './components/MainLayout';
import PaymentModal from './components/PaymentModal';
import InstallPrompt from './components/InstallPrompt';
import AdminLayout from './components/admin/AdminLayout';
import Toast from './components/Toast';
import { LoginFormData, User, Order, CartItem, CheckInRecord, MenuItem, OrderSource, Shift, Notification } from './types';
import { Loader2, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';
import { db, uploadFileToFirebase } from './firebase';

const App: React.FC = () => {
  // Global State
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Local State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingOrderItems, setPendingOrderItems] = useState<CartItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingOrderInfo, setPendingOrderInfo] = useState<{source: OrderSource, name: string, phone: string} | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(true); 
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'permission-denied'>('connecting');
  const [showConnectionStatus, setShowConnectionStatus] = useState(true);

  // Toast & Sound
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
    const checkAndCreateAdmin = async () => {
        try {
            // TẠO ADMIN MỚI: adminnc | 123456
            const q = db.collection('nc_users').where('username', '==', 'adminnc');
            const querySnapshot = await q.get();
            if (querySnapshot.empty) {
                await db.collection('nc_users').add({
                    name: 'Quản trị Nước',
                    username: 'adminnc',
                    password: '123456',
                    role: 'admin',
                    status: 'active',
                    isOnline: false
                });
            }
        } catch (error: any) {
            if (error.code === 'permission-denied') setConnectionStatus('permission-denied');
        }
    };

    const heartbeat = async () => {
        try {
            const statusRef = db.collection('_system_nc').doc('connection_status');
            await statusRef.set({
                timestamp: new Date().toISOString(),
                status: 'ONLINE',
                last_updated: Date.now()
            }, { merge: true });
        } catch (e: any) {
            if (e.code === 'permission-denied') setConnectionStatus('permission-denied');
        }
    };

    checkAndCreateAdmin();
    const interval = setInterval(heartbeat, 15000);
    heartbeat();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleError = (error: any) => {
        if (error.code === 'permission-denied') setConnectionStatus('permission-denied');
        else setConnectionStatus('error');
        setIsLoggingIn(false);
    };

    // TẤT CẢ COLLECTION ĐỔI SANG nc_ ĐỂ TÁCH BIỆT DỮ LIỆU
    const unsubUsers = db.collection('nc_users').onSnapshot((snapshot) => {
        setConnectionStatus('connected');
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(items);
        
        const savedUserId = localStorage.getItem('nc_saved_user_id');
        if (currentUser) {
            if (currentUser.id !== 'offline_admin_nc') {
                const updatedMe = items.find(u => u.id === currentUser.id);
                if (updatedMe) {
                     if (updatedMe.status === 'locked') {
                         alert("Tài khoản đã bị khóa.");
                         handleLogout();
                     } else setCurrentUser(updatedMe); 
                }
            }
        } else if (savedUserId) {
            if (savedUserId === 'offline_admin_nc') {
                 setCurrentUser({
                    id: 'offline_admin_nc',
                    name: 'Quản trị Nước',
                    username: 'adminnc',
                    password: '123456',
                    role: 'admin',
                    status: 'active',
                    isOnline: true
                });
            } else {
                const foundUser = items.find(u => u.id === savedUserId);
                if (foundUser && foundUser.status === 'active') {
                    setCurrentUser(foundUser);
                    db.collection('nc_users').doc(foundUser.id).update({ isOnline: true }).catch(() => {});
                } else localStorage.removeItem('nc_saved_user_id');
            }
        }
        setIsLoggingIn(false);
    }, handleError);

    const unsubMenu = db.collection('nc_menu').onSnapshot((snapshot) => {
        setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    }, handleError);

    const unsubOrders = db.collection('nc_orders').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, handleError);

    const unsubShifts = db.collection('nc_shifts').onSnapshot((snapshot) => {
        setShifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift)));
    }, handleError);

    const unsubCheckIns = db.collection('nc_checkins').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        setCheckIns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CheckInRecord)));
    }, handleError);
    
    const unsubNotifs = db.collection('nc_notifications').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
        const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        setNotifications(notifs);

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const data = change.doc.data() as Notification;
                const isRecent = Date.now() - data.timestamp < 10000;
                if (isRecent && currentUser) {
                    const isForMe = data.userId === currentUser.id;
                    const isAdmin = currentUser.role === 'admin';
                    if (isForMe || (isAdmin && (data.type === 'order' || data.type === 'shift'))) {
                        playNotificationSound();
                        setToast({ message: data.message, type: data.type === 'order' ? 'order' : 'success' });
                    }
                }
            }
        });
    }, handleError);

    return () => {
        try { unsubUsers(); unsubMenu(); unsubOrders(); unsubShifts(); unsubCheckIns(); unsubNotifs(); } catch(e) {}
    };
  }, [currentUser?.id]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoggingIn(true);
    const cleanUsername = data.username.trim();
    const cleanPassword = data.password.trim();

    // KIỂM TRA ADMINNC
    if (cleanUsername === 'adminnc' && cleanPassword === '123456') {
        const adminUser = {
            id: 'offline_admin_nc', name: 'Quản trị Nước', username: 'adminnc', password: '123456',
            role: 'admin' as const, status: 'active' as const, isOnline: true
        };
        setCurrentUser(adminUser);
        localStorage.setItem('nc_saved_user_id', 'offline_admin_nc');
        setIsLoggingIn(false);
        return; 
    }

    try {
        let user = users.find(u => 
            (u.username.toLowerCase() === cleanUsername.toLowerCase() || u.phone === cleanUsername) && 
            u.password === cleanPassword
        );

        if (user) {
            if (user.role === 'staff' && (user.status === 'pending' || user.status === 'locked')) {
                alert(user.status === 'pending' ? 'Tài khoản chờ duyệt!' : 'Tài khoản đã khóa!');
                setIsLoggingIn(false);
                return;
            }
            db.collection('nc_users').doc(user.id).update({ isOnline: true }).catch(() => {});
            setCurrentUser({ ...user, isOnline: true });
            localStorage.setItem('nc_saved_user_id', user.id);
        } else alert('Sai thông tin!');
    } catch (e: any) {
        alert(`Lỗi: ${e.message}`);
    } finally {
        setIsLoggingIn(false);
    }
  };

  const handleRegister = async (data: any) => {
      if (users.some(u => u.phone === data.phone)) return alert('SĐT đã tồn tại!');
      try {
        await db.collection('nc_users').add({
            name: data.name, username: data.phone, password: data.password,
            role: 'staff', status: 'pending', phone: data.phone, isOnline: false
        });
        alert("Đăng ký thành công! Vui lòng chờ quản lý duyệt.");
      } catch (e: any) { alert(`Lỗi: ${e.message}`); }
  };

  const handleLogout = async () => {
    const userId = currentUser?.id;
    localStorage.removeItem('nc_saved_user_id');
    setCurrentUser(null);
    setCart([]);
    setShowPaymentModal(false);
    if (userId && userId !== 'offline_admin_nc') {
        try { await db.collection('nc_users').doc(userId).update({ isOnline: false }); } catch (e) {}
    }
  };

  const addNotification = async (userId: string, message: string, type: 'system' | 'order' | 'shift' = 'system') => {
      try {
        await db.collection('nc_notifications').add({ userId, message, isRead: false, timestamp: Date.now(), type });
      } catch (e) {}
  };

  const initiateOrder = (items: CartItem[], total: number, source: OrderSource, name: string, phone: string) => {
    setPendingOrderItems(items);
    setPendingTotal(total);
    setPendingOrderInfo({ source, name, phone });
    setShowPaymentModal(true);
  };

  const confirmOrder = async (method: 'cash' | 'transfer' | 'postpaid') => {
    const newOrder = {
      items: pendingOrderItems, total: pendingTotal, paymentMethod: method,
      status: 'completed' as const, timestamp: Date.now(),
      staffId: currentUser?.id || 'unknown', source: 'app' as const,
      customerName: pendingOrderInfo?.name || '', customerPhone: pendingOrderInfo?.phone || ''
    };

    try {
        const docRef = await db.collection('nc_orders').add(newOrder);
        const shortId = docRef.id.slice(-4).toUpperCase();
        const methodStr = method === 'cash' ? 'Tiền mặt' : method === 'transfer' ? 'Chuyển khoản' : 'Thanh toán sau';
        
        if (currentUser) await addNotification(currentUser.id, `Đơn hàng ID:${shortId} (${methodStr}) thành công!`, 'order');
        
        users.filter(u => u.role === 'admin').forEach(admin => {
             addNotification(admin.id, `Đơn mới (${methodStr}): ${pendingTotal.toLocaleString('vi-VN')}đ`, 'order');
        });
        
        pendingOrderItems.forEach(async (item) => {
            const menuItem = menuItems.find(m => m.id === item.id);
            if (menuItem) {
                const targetId = menuItem.parentId || menuItem.id;
                const targetItem = menuItems.find(m => m.id === targetId);
                if (targetItem) {
                     const newStock = Math.max(0, targetItem.stock - item.quantity);
                     db.collection('nc_menu').doc(targetId).update({ stock: newStock }).catch(() => {});
                }
            }
        });
    } catch (e) { alert("Lỗi lưu đơn hàng."); }
    setShowPaymentModal(false); setCart([]); setPendingOrderItems([]); setPendingTotal(0); setPendingOrderInfo(null);
  };

  const handleCheckIn = async (lat: number, lng: number, type: 'in' | 'out', imageFile?: File) => {
    try {
        let imageUrl = '';
        if (imageFile) imageUrl = await uploadFileToFirebase(imageFile, 'nc_checkin');
        await db.collection('nc_checkins').add({
            staffId: currentUser?.id || '', timestamp: Date.now(),
            latitude: lat, longitude: lng, address: type === 'in' ? 'Check In' : 'Check Out',
            type, imageUrl
        });
        if (currentUser) addNotification(currentUser.id, `${type === 'in' ? 'Check-in' : 'Check-out'} thành công!`, 'system');
    } catch (e: any) { alert(`Lỗi định vị: ${e.message}`); }
  };

  return (
    <>
      <InstallPrompt />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {isLoggingIn && (
          <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-pulse">
                 <span className="text-2xl font-black text-white">NC</span>
              </div>
              <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin text-indigo-500" />
                  <span className="font-medium text-gray-500">Đang khởi động Order Nước...</span>
              </div>
          </div>
      )}

      {!currentUser && !isLoggingIn ? (
        <LoginForm onSubmit={handleLogin} onRegister={handleRegister} />
      ) : currentUser && !isLoggingIn ? (
        currentUser.role === 'admin' ? (
            <AdminLayout 
                user={currentUser}
                onLogout={handleLogout} users={users} setUsers={setUsers}
                orders={orders} menuItems={menuItems} setMenuItems={setMenuItems}
                shifts={shifts} setShifts={setShifts} checkIns={checkIns} onNotify={addNotification}
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
      ) : null}
    </>
  );
};

export default App;
