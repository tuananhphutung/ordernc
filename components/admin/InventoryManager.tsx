
import React, { useState, useRef } from 'react';
import { MenuItem } from '../../types';
import { Trash2, Coffee, Image as ImageIcon, Loader2, Edit3, Save, X, ZoomIn } from 'lucide-react';
import { uploadFileToFirebase, db } from '../../firebase';

interface InventoryManagerProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ menuItems }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<{
      name: string, price: string, stock: string, category: 'drink' | 'topping', image: string, isParent: boolean, parentId: string
  }>({
    name: '', price: '', stock: '', category: 'drink', image: '', isParent: false, parentId: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [imgZoom, setImgZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentItems = menuItems.filter(item => item.isParent);

  const handleSaveItem = async () => {
    if (!itemForm.name) return alert("Nhập tên");
    const data = {
        name: itemForm.name,
        price: Number(itemForm.price || 0),
        stock: Number(itemForm.stock || 0),
        category: itemForm.category,
        image: itemForm.image,
        isParent: itemForm.isParent,
        parentId: itemForm.parentId
    };

    try {
        if (editingId) {
            await db.collection('nc_menu').doc(editingId).update(data);
            alert("Đã cập nhật!");
        } else {
            await db.collection('nc_menu').add(data);
            alert("Đã thêm!");
        }
        resetForm();
    } catch (e: any) { alert("Lỗi"); }
  };

  const resetForm = () => {
      setEditingId(null);
      setItemForm({ name: '', price: '', stock: '', category: 'drink', image: '', isParent: false, parentId: '' });
      setImgZoom(100);
  };

  const startEdit = (item: MenuItem) => {
      setEditingId(item.id);
      setItemForm({
          name: item.name,
          price: item.price.toString(),
          stock: item.stock.toString(),
          category: item.category,
          image: item.image || '',
          isParent: item.isParent || false,
          parentId: item.parentId || ''
      });
  };

  const updateStockDirectly = async (id: string, value: string) => {
      const num = parseInt(value) || 0;
      await db.collection('nc_menu').doc(id).update({ stock: num });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const url = await uploadFileToFirebase(file, 'nc_menu_img');
        setItemForm(prev => ({ ...prev, image: url }));
    } catch (error) { console.error(error); } finally { setIsUploading(false); }
  };

  const renderItemCard = (item: MenuItem, isChild = false) => (
      <div key={item.id} className={`flex gap-4 bg-white p-4 rounded-2xl border ${isChild ? 'ml-8 mt-2 bg-indigo-50/20' : 'border-gray-200 shadow-sm'}`}>
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border relative group">
            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Coffee className="m-auto text-indigo-100" size={32}/>}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ZoomIn className="text-white" size={16} />
            </div>
        </div>
        <div className="flex-1">
            <div className="flex justify-between">
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-indigo-600 p-1"><Edit3 size={16}/></button>
                    <button onClick={async () => { if(confirm("Xóa?")) await db.collection('nc_menu').doc(item.id).delete(); }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                </div>
            </div>
            <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-bold text-indigo-600">{item.price.toLocaleString()}đ</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">KHO:</span>
                    <input 
                        type="number" 
                        defaultValue={item.stock} 
                        onBlur={(e) => updateStockDirectly(item.id, e.target.value)}
                        className="w-16 px-2 py-1 bg-gray-50 border rounded text-xs font-bold text-center outline-none focus:border-indigo-500"
                    />
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pb-32">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Coffee className="text-indigo-600"/> Thực đơn & Kho NC</h2>
      
      <div className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 space-y-3">
                <div 
                    onClick={() => !isUploading && fileInputRef.current?.click()} 
                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer bg-gray-50 overflow-hidden relative group"
                >
                    {isUploading ? <Loader2 className="animate-spin text-indigo-500"/> : (itemForm.image ? (
                        <img 
                            src={itemForm.image} 
                            style={{ transform: `scale(${imgZoom/100})` }}
                            className="w-full h-full object-cover transition-transform"
                        />
                    ) : <ImageIcon className="text-gray-300" size={32}/>)}
                </div>
                {itemForm.image && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Zoom ảnh: {imgZoom}%</label>
                        <input type="range" min="50" max="200" value={imgZoom} onChange={e => setImgZoom(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                    </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <input type="checkbox" checked={itemForm.isParent} onChange={e=>setItemForm({...itemForm, isParent: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                    <label className="text-sm font-bold text-indigo-900">Là Nhóm đồ uống (Gộp kho các món con)</label>
                </div>
                <input type="text" placeholder="Tên đồ uống" className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={itemForm.name} onChange={e=>setItemForm({...itemForm, name:e.target.value})}/>
                <input type="number" placeholder="Giá bán" className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={itemForm.price} onChange={e=>setItemForm({...itemForm, price:e.target.value})}/>
                <input type="number" placeholder="Số lượng kho" className="p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={itemForm.stock} onChange={e=>setItemForm({...itemForm, stock:e.target.value})}/>
                <select className="p-3 bg-gray-50 border rounded-xl outline-none" value={itemForm.parentId} onChange={e=>setItemForm({...itemForm, parentId: e.target.value})}>
                    <option value="">-- Thuộc nhóm --</option>
                    {parentItems.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="md:col-span-2 flex gap-3">
                    <button onClick={handleSaveItem} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
                        {editingId ? <><Save size={20}/> Cập nhật NC</> : <><Save size={20}/> Thêm mới NC</>}
                    </button>
                    {editingId && <button onClick={resetForm} className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200"><X size={24}/></button>}
                </div>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {menuItems.filter(i=>i.isParent).map(p => (
            <div key={p.id} className="bg-indigo-50/10 p-4 rounded-3xl border border-indigo-50">
                {renderItemCard(p)}
                <div className="space-y-2">{menuItems.filter(c=>c.parentId===p.id).map(c=>renderItemCard(c, true))}</div>
            </div>
        ))}
        {menuItems.filter(i=>!i.isParent && !i.parentId).map(i => renderItemCard(i))}
      </div>
    </div>
  );
};

export default InventoryManager;
