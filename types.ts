
export interface LoginFormData {
  username: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: 'admin' | 'staff';
  status: 'active' | 'pending' | 'locked';
  isOnline?: boolean;
  avatar?: string;
  phone?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'drink' | 'topping'; // Đổi từ food sang drink
  image?: string;
  stock: number;
  isParent?: boolean;
  parentId?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

// Chỉ giữ lại nguồn đơn tại quán (app)
export type OrderSource = 'app';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'postpaid'; // Bổ sung postpaid
  status: 'pending' | 'completed';
  timestamp: number;
  staffId: string;
  source: OrderSource;
  customerName?: string;
  customerPhone?: string;
}

export interface CheckInRecord {
  id: string;
  staffId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl?: string;
  type: 'in' | 'out';
}

export interface Shift {
  id: string;
  staffIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  timestamp: number;
  type: 'shift' | 'system' | 'order';
}
