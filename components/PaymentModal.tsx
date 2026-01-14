
import React, { useState } from 'react';
import { X, CheckCircle, QrCode, Banknote, Loader2, Clock } from 'lucide-react';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onConfirm: (method: 'cash' | 'transfer' | 'postpaid') => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ total, onClose, onConfirm }) => {
  const [method, setMethod] = useState<'cash' | 'transfer' | 'postpaid' | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const qrImageSrc = "https://img.vietqr.io/image/SHB-0359140685-compact.png"; 

  const handleMethodSelect = (m: 'cash' | 'transfer' | 'postpaid') => {
    setMethod(m);
    if (m === 'transfer') {
        setShowQR(true);
        setIsWaiting(true);
    } else {
        setShowQR(false);
        setIsWaiting(false);
    }
  };

  const handleConfirm = () => {
    if (method) {
        onConfirm(method);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 p-4 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-white font-bold text-lg">Thanh toán đơn hàng</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-500 mb-1">Tổng tiền cần thanh toán</p>
            <h2 className="text-4xl font-bold text-gray-800">
              {total.toLocaleString('vi-VN')} đ
            </h2>
          </div>

          {!showQR ? (
            <div className="space-y-4">
              <p className="font-medium text-gray-700">Chọn phương thức:</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleMethodSelect('cash')}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                    method === 'cash'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-100 hover:border-indigo-200 text-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${method === 'cash' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>
                    <Banknote size={24} />
                  </div>
                  <span className="font-bold">Tiền mặt (tại quán)</span>
                </button>

                <button
                  onClick={() => handleMethodSelect('transfer')}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                    method === 'transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-100 hover:border-indigo-200 text-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${method === 'transfer' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                    <QrCode size={24} />
                  </div>
                  <span className="font-bold">Chuyển khoản (VietQR)</span>
                </button>

                <button
                  onClick={() => handleMethodSelect('postpaid')}
                  className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                    method === 'postpaid'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-100 hover:border-indigo-200 text-gray-600'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${method === 'postpaid' ? 'bg-teal-500 text-white' : 'bg-gray-100'}`}>
                    <Clock size={24} />
                  </div>
                  <span className="font-bold">Thanh toán sau (Postpaid)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
               <div className="relative group">
                 <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-4 relative overflow-hidden">
                    <img 
                        src={`${qrImageSrc}?amount=${total}&addInfo=Thanh toan don hang`} 
                        alt="QR Code" 
                        className="w-56 h-auto mix-blend-multiply"
                        onError={(e) => {
                            e.currentTarget.src = "https://via.placeholder.com/250x250?text=QR+Code+Error";
                        }}
                    />
                    <div className="absolute top-0 left-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold text-center py-1">
                        SHB - Napas247
                    </div>
                  </div>
               </div>
              
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full mb-6 animate-pulse">
                 <Loader2 size={18} className="animate-spin" />
                 <span className="font-medium text-sm">Đang chờ khách thanh toán...</span>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!method}
            className={`w-full mt-6 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              !method
                ? 'bg-gray-300 cursor-not-allowed'
                : method === 'cash'
                ? 'bg-orange-500 hover:bg-orange-600'
                : method === 'transfer'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-teal-600 hover:bg-teal-700'
            }`}
          >
            {isWaiting ? <><CheckCircle size={20} /> Xác nhận đã nhận tiền</> : 'Xác nhận hoàn thành'}
          </button>
          
          {showQR && (
            <button 
                onClick={() => { setShowQR(false); setMethod(null); }}
                className="w-full mt-4 py-2 text-gray-400 font-medium hover:text-gray-600 text-sm"
            >
                Quay lại chọn phương thức khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
