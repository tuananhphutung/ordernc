
import React, { useState } from 'react';
import { User, Order, Shift } from '../../types';
import { TrendingUp, Clock, Sparkles, Send, Loader2, Trash2, LogOut } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db } from '../../firebase';

interface DashboardProps {
  adminUser: User;
  users: User[];
  orders: Order[];
  shifts: Shift[]; 
}

const Dashboard: React.FC<DashboardProps> = ({ adminUser, users, orders, shifts }) => {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAIAnalyze = async () => {
    if (!aiQuery.trim()) return;
    setIsAnalyzing(true); setAiResponse('');
    try {
        const simplifiedOrders = orders.slice(0, 25).map(o => ({
            id: o.id.slice(-4), total: o.total, items: o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
        }));
        const contextData = { shop: "Hệ thống Order Nước", recent_orders: simplifiedOrders, stats: { total_rev: orders.reduce((s,o)=>s+o.total,0) } };
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Bạn là trợ lý ảo cho cửa hàng đồ uống. Dữ liệu: ${JSON.stringify(contextData)} Câu hỏi: "${aiQuery}" Trả lời ngắn gọn bằng tiếng Việt.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
        setAiResponse(response.text || "AI chưa có câu trả lời.");
    } catch (e: any) { setAiResponse(`Lỗi AI: ${e.message}`); } finally { setIsAnalyzing(false); }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-4 md:p-8 pb-24 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" /> Tổng quan Order Nước
          </h2>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><Sparkles className="text-yellow-300" /> Trợ lý Đồ uống AI</h3>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex items-center border border-white/20">
            <input type="text" value={aiQuery} onChange={(e)=>setAiQuery(e.target.value)} placeholder="Hỏi AI về doanh thu đồ uống..." className="flex-1 bg-transparent border-none outline-none text-white px-4 py-2"/>
            <button onClick={handleAIAnalyze} disabled={isAnalyzing || !aiQuery.trim()} className="p-3 bg-white text-indigo-600 rounded-xl">
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            </button>
        </div>
        {aiResponse && <div className="mt-4 bg-black/20 p-4 rounded-2xl text-sm max-h-40 overflow-auto">{aiResponse}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Doanh thu Nước</p>
          <p className="text-3xl font-black text-indigo-800 mt-1">{totalRevenue.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-indigo-50 shadow-sm">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Đơn hàng NC</p>
          <p className="text-3xl font-black text-indigo-800 mt-1">{orders.length} đơn</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg">
          <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Món NC bán chạy</p>
          <p className="text-2xl font-black mt-1">---</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
