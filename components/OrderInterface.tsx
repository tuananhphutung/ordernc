
import React, { useState, useMemo } from 'react';
import { MenuItem, CartItem, OrderSource } from '../types';
import { Coffee, X, Trash2, Search, Calendar as CalendarIcon, ShoppingBag } from 'lucide-react';

interface OrderInterfaceProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  menuItems: MenuItem[];
  onPlaceOrder: (items: CartItem[], total: number, source: OrderSource, name: string, phone: string, date: string) => void;
}

const OrderInterface: React.FC<OrderInterfaceProps> = ({ cart, setCart, menuItems, onPlaceOrder }) => {
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'drink' | 'topping'>('all');

  const addToCart = (item: MenuItem) => {
    const targetId = item.parentId || item.id;
    const targetItem = menuItems.find(m => m.id === targetId);
    if (!targetItem) return;

    const currentUsageInCart = cart.reduce((sum, ci) => {
        const ciInfo = menuItems.find(m => m.id === ci.id);
        return (ciInfo?.parentId || ciInfo?.id) === targetId ? sum + ci.quantity : sum;
    }, 0);

    if (item.category !== 'topping' && (currentUsageInCart + 1 > targetItem.stock)) {
        alert("Món này hiện tại đã hết kho!");
        return;
    }

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null as any;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const handleCheckout = () => {
      if (cart.length === 0) return alert('Giỏ trống');
      onPlaceOrder(cart, totalAmount, 'app', customerName, customerPhone, orderDate);
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
                    type="text" placeholder="Tìm đồ uống..." 
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                 />
             </div>
             <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                 {['all', 'drink', 'topping'].map(cat => (
                     <button key={cat} onClick={() => setSelectedCategory(cat as any)} className={`px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border shadow-sm'}`}>
                         {cat === 'all' ? 'Tất cả' : cat === 'drink' ? 'Đồ uống' : 'Topping'}
                     </button>
                 ))}
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-32 md:pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
                <div key={item.id} onClick={() => addToCart(item)} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md active:scale-95 transition-all">
                    <div className="h-32 md:h-40 w-full bg-gray-50 relative">
                        {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Coffee className="m-auto text-indigo-50 h-full" size={40}/>}
                        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold">
                             {item.parentId ? `Gộp: ${menuItems.find(p=>p.id===item.parentId)?.stock}` : `Kho: ${item.stock}`}
                        </div>
                    </div>
                    <div className="p-3">
                        <h3 className="font-bold text-gray-800 text-xs truncate uppercase tracking-tight">{item.name}</h3>
                        <p className="font-black text-indigo-600 mt-1 text-sm">{item.price.toLocaleString()}đ</p>
                    </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col h-full shadow-2xl z-20">
         <CartContent cart={cart} totalAmount={totalAmount} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} orderDate={orderDate} setOrderDate={setOrderDate} updateQuantity={updateQuantity} removeFromCart={(id:string)=>setCart(prev=>prev.filter(i=>i.id!==id))} handleCheckout={handleCheckout} />
      </div>

      {/* Mobile Cart Button: Semi-transparent and floating */}
      <div className="md:hidden fixed bottom-24 inset-x-4 z-40">
        <button 
            onClick={() => setIsMobileCartOpen(true)} 
            className="w-full bg-indigo-900/80 backdrop-blur-lg text-white p-5 rounded-[24px] shadow-2xl flex items-center justify-between border border-white/20 active:scale-95 transition-all"
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    <ShoppingBag size={24} />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-indigo-900">
                        {cart.reduce((s,i)=>s+i.quantity,0)}
                    </span>
                </div>
                <span className="font-black text-xs uppercase tracking-widest">XEM GIỎ HÀNG</span>
            </div>
            <span className="font-black text-xl">{totalAmount.toLocaleString()}đ</span>
        </button>
      </div>

      {isMobileCartOpen && (
          <div className="md:hidden fixed inset-0 z-[60] animate-in fade-in">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)}></div>
              <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-[32px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20">
                  <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                      <h2 className="font-black text-indigo-900 tracking-widest uppercase">Giỏ hàng NC</h2>
                      <button onClick={() => setIsMobileCartOpen(false)} className="p-2 bg-white rounded-full shadow-sm"><X/></button>
                  </div>
                  <CartContent cart={cart} totalAmount={totalAmount} customerName={customerName} setCustomerName={setCustomerName} customerPhone={customerPhone} setCustomerPhone={setCustomerPhone} orderDate={orderDate} setOrderDate={setOrderDate} updateQuantity={updateQuantity} removeFromCart={(id:string)=>setCart(prev=>prev.filter(i=>i.id!==id))} handleCheckout={handleCheckout} />
              </div>
          </div>
      )}
    </div>
  );
};

const CartContent = ({ cart, totalAmount, customerName, setCustomerName, customerPhone, setCustomerPhone, orderDate, setOrderDate, updateQuantity, removeFromCart, handleCheckout }: any) => (
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? <div className="text-center text-gray-400 mt-20 font-medium">Chưa có đồ uống nào</div> : cart.map((item: any) => (
                <div key={item.id} className="flex gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                    <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                         {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <Coffee className="m-auto text-gray-300 h-full" size={24}/>}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs line-clamp-1 uppercase text-gray-800">{item.name}</h4>
                            <button onClick={()=>removeFromCart(item.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-sm font-black text-indigo-600">{item.price.toLocaleString()}đ</p>
                            <div className="flex items-center gap-3 bg-white p-1 rounded-lg shadow-sm border">
                                 <button onClick={()=>updateQuantity(item.id,-1)} className="w-6 h-6 flex items-center justify-center font-bold text-gray-400">-</button>
                                 <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                 <button onClick={()=>updateQuantity(item.id,1)} className="w-6 h-6 flex items-center justify-center font-bold text-indigo-600 bg-indigo-50 rounded">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="p-6 bg-white border-t space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
             <div className="space-y-2">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <CalendarIcon className="text-indigo-500" size={16}/>
                    <div className="flex-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ngày ghi nhận đơn</p>
                        <input type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)} className="w-full bg-transparent outline-none font-bold text-xs text-gray-700"/>
                    </div>
                </div>
                <input type="text" placeholder="Tên khách hàng" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"/>
                <input type="tel" placeholder="Số điện thoại" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"/>
             </div>
             <div className="flex justify-between items-center py-2 border-t border-dashed">
                 <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Tổng cộng</span>
                 <span className="font-black text-2xl text-indigo-900">{totalAmount.toLocaleString()}đ</span>
             </div>
             <button onClick={handleCheckout} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                 <ShoppingBag size={20}/> CHỐT ĐƠN NC
             </button>
        </div>
    </div>
);

export default OrderInterface;
