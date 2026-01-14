
import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { Plus, Minus, Trash2, Coffee, Save, Image as ImageIcon, Loader2, XCircle, Layers } from 'lucide-react';
import { uploadFileToFirebase, db } from '../../firebase';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems }) => {
  const [newItem, setNewItem] = useState<{
      name: string, price: string, stock: string, category: 'drink' | 'topping', image: string, isParent: boolean, parentId: string
  }>({
    name: '', price: '', stock: '', category: 'drink', image: '', isParent: false, parentId: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentItems = menuItems.filter(item => item.isParent);

  const handleAddItem = async () => {
    if (!newItem.name) return alert("Nhập tên món nước");
    if (!newItem.isParent && !newItem.price) return alert("Nhập giá");

    let finalStock = newItem.category === 'topping' ? 999999 : (newItem.parentId ? 0 : Number(newItem.stock || 0));

    const itemData: any = {
        name: newItem.name,
        price: newItem.isParent ? 0 : Number(newItem.price),
        stock: finalStock,
        category: newItem.category,
        image: newItem.image,
        isParent: newItem.isParent,
    };
    if (newItem.parentId) itemData.parentId = newItem.parentId;

    try {
        await db.collection('nc_menu').add(itemData);
        alert("Đã thêm thành công!");
        setNewItem({ name: '', price: '', stock: '', category: 'drink', image: '', isParent: false, parentId: '' });
    } catch (e: any) { alert(`Lỗi: ${e.message}`); }
  };

  const updateStock = async (id: string, newStock: number) => {
    try { await db.collection('nc_menu').doc(id).update({ stock: Math.max(0, newStock) }); } catch (e) {}
  };

  const deleteItem = async (item: MenuItem) => {
      if(confirm(`Xóa món "${item.name}"?`)) {
          try {
              const batch = db.batch();
              batch.delete(db.collection('nc_menu').doc(item.id));
              if (item.isParent) {
                  menuItems.filter(i => i.parentId === item.id).forEach(c => batch.update(db.collection('nc_menu').doc(c.id), { parentId: '' }));
              }
              await batch.commit();
          } catch (e) { alert("Lỗi khi xóa"); }
      }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const url = await uploadFileToFirebase(file, 'nc_menu_img');
        setNewItem(prev => ({ ...prev, image: url }));
    } catch (error) { console.error(error); } finally { setIsUploading(false); }
  };

  const renderItemCard = (item: MenuItem, isChild = false) => (
      <div key={item.id} className={`relative flex gap-4 bg-white p-4 rounded-xl border ${isChild ? 'ml-8 mt-2 bg-indigo-50/20' : 'border-gray-200 shadow-sm'}`}>
        <button onClick={() => deleteItem(item)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-indigo-200"><Coffee size={24} /></div>}
        </div>
        <div className="flex-1">
            <h4 className={`font-bold text-gray-800 ${item.isParent ? 'text-indigo-700' : ''}`}>{item.name}</h4>
            <div className="flex justify-between items-center mt-1">
                {!item.isParent && <span className="text-sm font-bold text-indigo-600">{item.price.toLocaleString('vi-VN')}đ</span>}
                {item.category !== 'topping' && !item.parentId ? (
                    <div className="flex items-center gap-2">
                        <button onClick={()=>updateStock(item.id, item.stock-1)} className="w-6 h-6 border rounded">-</button>
                        <span className="text-xs font-bold w-6 text-center">{item.stock}</span>
                        <button onClick={()=>updateStock(item.id, item.stock+1)} className="w-6 h-6 bg-indigo-100 rounded">+</button>
                    </div>
                ) : <span className="text-[10px] text-gray-400 font-bold uppercase">{item.category === 'topping' ? 'Topping' : 'Món con'}</span>}
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Coffee className="text-indigo-600"/> Quản lý Đồ uống</h2>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-3">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*"/>
                <div onClick={() => !isUploading && fileInputRef.current?.click()} className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer bg-gray-50 overflow-hidden">
                    {isUploading ? <Loader2 className="animate-spin text-indigo-500"/> : (newItem.image ? <img src={newItem.image} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-300"/>)}
                </div>
            </div>
            <div className="md:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-2">
                    <input type="checkbox" checked={newItem.isParent} onChange={e=>setNewItem({...newItem, isParent: e.target.checked, parentId: ''})} className="w-5 h-5 accent-indigo-600"/>
                    <label className="text-sm font-bold text-indigo-800">Tạo Nhóm đồ uống (Ví dụ: Trà trái cây)</label>
                </div>
                <input type="text" placeholder="Tên đồ uống" className="p-2 border rounded-lg md:col-span-2" value={newItem.name} onChange={e=>setNewItem({...newItem, name:e.target.value})}/>
                {!newItem.isParent && (
                    <>
                        <select className="p-2 border rounded-lg bg-white" value={newItem.parentId} onChange={e=>setNewItem({...newItem, parentId: e.target.value})}>
                            <option value="">-- Chọn nhóm (Không bắt buộc) --</option>
                            {parentItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select className="p-2 border rounded-lg bg-white" value={newItem.category} onChange={e=>setNewItem({...newItem, category: e.target.value as any})}>
                            <option value="drink">Đồ uống</option>
                            <option value="topping">Topping</option>
                        </select>
                        <input type="number" placeholder="Giá bán" className="p-2 border rounded-lg" value={newItem.price} onChange={e=>setNewItem({...newItem, price:e.target.value})}/>
                        <input type="number" placeholder="Kho đầu" className="p-2 border rounded-lg" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:e.target.value})} disabled={newItem.category==='topping'||!!newItem.parentId}/>
                    </>
                )}
                {newItem.isParent && <input type="number" placeholder="Kho nguyên liệu (vỏ ly/đế)" className="p-2 border rounded-lg md:col-span-2" value={newItem.stock} onChange={e=>setNewItem({...newItem, stock:e.target.value})}/>}
                <button onClick={handleAddItem} className="md:col-span-2 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">LƯU THỰC ĐƠN NC</button>
            </div>
        </div>
      </div>
      <div className="space-y-4">
        {menuItems.filter(i=>i.isParent).map(p => (
            <div key={p.id} className="bg-gray-50 p-4 rounded-2xl border">
                {renderItemCard(p)}
                <div className="mt-2 space-y-2">{menuItems.filter(c=>c.parentId===p.id).map(c=>renderItemCard(c, true))}</div>
            </div>
        ))}
        {menuItems.filter(i=>!i.isParent && !i.parentId).map(i => renderItemCard(i))}
      </div>
    </div>
  );
};

export default InventoryManager;
