
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, OrderSource } from '../types';
import { ShoppingCart, Plus, Minus, Coffee, X, Trash2, Tag, User, Phone, Video, Search } from 'lucide-react';

interface OrderInterfaceProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  menuItems: MenuItem[];
  onPlaceOrder: (items: CartItem[], total: number, source: OrderSource, name: string, phone: string) => void;
}

const OrderInterface: React.FC<OrderInterfaceProps> = ({ cart, setCart, menuItems, onPlaceOrder }) => {
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'drink' | 'topping'>('all');

  const addToCart = (item: MenuItem) => {
    const targetId = item.parentId || item.id;
    const targetItem = menuItems.find(m => m.id === targetId);
    if (!targetItem) return;

    const currentUsageInCart = cart.reduce((sum, cartItem) => {
        const cartItemInfo = menuItems.find(m => m.id === cartItem.id);
        const cartTargetId = cartItemInfo?.parentId || cartItemInfo?.id;
        return cartTargetId === targetId ? sum + cartItem.quantity : sum;
    }, 0);

    if (item.category !== 'topping' && (currentUsageInCart + 1 > targetItem.stock)) {
        alert("Món này hiện tại đã hết hàng!");
        return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const menuItem = menuItems.find(m => m.id === id);
        if (!menuItem) return item;
        const newQty = item.quantity + delta;
        if (delta < 0) return { ...item, quantity: Math.max(0, newQty) };
        const targetId = menuItem.parentId || menuItem.id;
        const targetItem = menuItems.find(m => m.id === targetId);
        const currentUsage = prev.reduce((sum, ci) => {
            const ciInfo = menuItems.find(m => m.id === ci.id);
            return (ciInfo?.parentId || ciInfo?.id) === targetId ? sum + ci.quantity : sum;
        }, 0);
        if (menuItem.category !== 'topping' && (currentUsage + 1 > (targetItem?.stock || 0))) {
            alert("Hết hàng!");
            return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleCheckout = () => {
      if (cart.length === 0) return alert('Giỏ trống');
      onPlaceOrder(cart, totalAmount, 'app', customerName, customerPhone);
      setCustomerName(''); setCustomerPhone(''); setIsMobileCartOpen(false);
  };

  const filteredItems = useMemo(() => {
      return menuItems.filter(item => {
          if (item.isParent) return false;
          const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
      });
  }, [menuItems, selectedCategory, searchQuery]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex h-full bg-indigo-50/30 overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 bg-white border-b border-gray-200 flex flex-col md:flex-row gap-3 shadow-sm z-10">
             <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Tìm tên đồ uống..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                 <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-100 shadow-sm'}`}>Tất cả</button>
                 <button onClick={() => setSelectedCategory('drink')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${selectedCategory === 'drink' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-100 shadow-sm'}`}>Đồ uống</button>
                 <button onClick={() => setSelectedCategory('topping')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${selectedCategory === 'topping' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-100 shadow-sm'}`}>Topping</button>
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-24 md:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
                <div key={item.id} onClick={() => addToCart(item)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md active:scale-95 transition-all">
                    <div className="h-32 md:h-40 w-full bg-gray-50 relative">
                        {item.image ? (
                             item.image.includes('/video/upload/') ? <video src={item.image} className="w-full h-full object-cover" muted autoPlay loop playsInline /> : <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-indigo-100"><Coffee size={40}/></div>}
                        <div className="absolute top-2 left-2">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded shadow-sm text-white ${item.category === 'topping' ? 'bg-purple-500' : 'bg-indigo-500'}`}>
                                {item.category === 'topping' ? 'TOPPING' : `KHO: ${item.parentId ? menuItems.find(p=>p.id===item.parentId)?.stock : item.stock}`}
                             </span>
                        </div>
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{item.name}</h3>
                        <p className="font-bold text-indigo-600 mt-1">{item.price.toLocaleString('vi-VN')} đ</p>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col h-full shadow-xl z-20">
         <CartContent cart={cart} totalAmount={totalAmount} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} updateQuantity={updateQuantity} removeFromCart={(id:string)=>setCart(prev=>prev.filter(i=>i.id!==id))} handleCheckout={handleCheckout} />
      </div>

      <div className="md:hidden fixed bottom-24 right-4 left-4 z-30">
        <button onClick={() => setIsMobileCartOpen(true)} className="w-full bg-indigo-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            <span className="font-bold">Giỏ hàng ({cart.reduce((s,i)=>s+i.quantity,0)})</span>
            <span className="font-bold text-lg">{totalAmount.toLocaleString('vi-VN')} đ</span>
        </button>
      </div>

      {isMobileCartOpen && (
          <div className="md:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileCartOpen(false)}></div>
              <div className="absolute inset-x-0 bottom-0 top-10 bg-white rounded-t-2xl flex flex-col">
                  <CartContent cart={cart} totalAmount={totalAmount} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} updateQuantity={updateQuantity} removeFromCart={(id:string)=>setCart(prev=>prev.filter(i=>i.id!==id))} handleCheckout={handleCheckout} />
              </div>
          </div>
      )}
    </div>
  );
};

const CartContent = ({ cart, totalAmount, customerName, setCustomerName, customerPhone, setCustomerPhone, updateQuantity, removeFromCart, handleCheckout }: any) => (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center md:hidden">
            <h2 className="font-bold text-lg">Giỏ hàng NC</h2>
            <button onClick={() => window.dispatchEvent(new CustomEvent('close-mobile-cart'))} className="p-2 bg-white rounded-full"><X size={20}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? <p className="text-center text-gray-400 mt-20">Chưa có đồ uống</p> : cart.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                         {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center"><Coffee size={16}/></div>}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between"><h4 className="font-bold text-sm line-clamp-1">{item.name}</h4><button onClick={()=>removeFromCart(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button></div>
                        <p className="text-sm font-bold text-indigo-600">{item.price.toLocaleString('vi-VN')} đ</p>
                        <div className="flex items-center gap-2 mt-2">
                             <button onClick={()=>updateQuantity(item.id,-1)} className="w-6 h-6 border rounded">-</button>
                             <span className="font-bold text-xs">{item.quantity}</span>
                             <button onClick={()=>updateQuantity(item.id,1)} className="w-6 h-6 bg-indigo-500 text-white rounded">+</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="p-4 bg-gray-50 border-t space-y-3">
             <div className="space-y-2">
                <input type="text" placeholder="Tên khách" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-2 border rounded-lg text-sm"/>
                <input type="tel" placeholder="Số điện thoại" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full p-2 border rounded-lg text-sm"/>
             </div>
             <div className="flex justify-between font-bold text-lg"><span>Tổng tiền</span><span>{totalAmount.toLocaleString('vi-VN')} đ</span></div>
             <button onClick={handleCheckout} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-100">THANH TOÁN TẠI QUÁN</button>
        </div>
    </div>
);

export default OrderInterface;
