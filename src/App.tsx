/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Webcam from 'react-webcam';
import { 
  LogOut, Camera, RefreshCw, Upload, PhoneCall,
  Search, User, Phone, Calendar, Trash2, Edit2, Copy, Image as ImageIcon, ExternalLink, Columns
} from 'lucide-react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// @ts-ignore
import { fetchCustomers, saveCustomerAPI, updateCustomerAPI, deleteCustomerAPI } from './api/beautyApi';

const cropImageToPortrait = (base64Str: string, targetAspect = 3 / 4): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let srcWidth = img.width;
      let srcHeight = img.height;
      let targetWidth = srcWidth;
      let targetHeight = srcWidth / targetAspect;
      if (targetHeight > srcHeight) {
        targetHeight = srcHeight;
        targetWidth = srcHeight * targetAspect;
      }
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const offsetX = (srcWidth - targetWidth) / 2;
      const offsetY = (srcHeight - targetHeight) / 2;
      ctx?.drawImage(img, offsetX, offsetY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
  });
};

// --- HÀM TẠO WATERMARK: TRẢ VỀ BASE64 THAY VÌ TỰ ĐỘNG TẢI ---
const generateBeforeAfterWithWatermark = async (originalSrc: string, afterSrc: string): Promise<string | null> => {
  try {
    const orig = new Image(); orig.crossOrigin = "anonymous";
    const after = new Image(); after.crossOrigin = "anonymous";
    
    await Promise.all([
      new Promise(r => { orig.onload = r; orig.src = originalSrc; }),
      new Promise(r => { after.onload = r; after.src = afterSrc; })
    ]);

    const canvas = document.createElement('canvas');
    const width = orig.width;
    const height = orig.height;
    
    canvas.width = width * 2;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if(!ctx) return null;

    ctx.drawImage(orig, 0, 0, width, height);
    ctx.drawImage(after, width, 0, width, height);

    ctx.font = "bold 60px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = "white";
    ctx.fillText("ẢNH GỐC", 50, 50);
    
    ctx.fillStyle = "#c9a84c"; 
    ctx.fillText("AI GIẢ LẬP", width + 50, 50);

    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    
    ctx.fillStyle = "#c9a84c";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 12;
    ctx.fillText("Thanh Hằng Beauty", width / 2, height - 40);

    ctx.fillStyle = "#111111"; 
    ctx.shadowColor = "rgba(255,255,255,0.7)"; 
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; 
    ctx.strokeText("Hotline 0985.808.318", width + width / 2, height - 40);
    ctx.fillText("Hotline 0985.808.318", width + width / 2, height - 40);

    ctx.shadowBlur = 0; 
    ctx.strokeStyle = "transparent";
    ctx.globalAlpha = 0.2; 
    ctx.fillStyle = "rgba(255, 255, 255, 1)";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);

    const watermarkText = "Thanh Hằng Beauty - Hotline 0985.808.318";
    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width + 120; 
    const textHeight = 130; 
    const diag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2);

    for (let y = -diag; y < diag; y += textHeight) {
      const offsetX = (Math.abs(Math.round(y / textHeight)) % 2 === 0) ? 0 : textWidth / 2;
      for (let x = -diag - offsetX; x < diag; x += textWidth) {
        ctx.fillText(watermarkText, x, y);
      }
    }

    // Trả về chuỗi base64 của ảnh thay vì tải xuống
    return canvas.toDataURL('image/jpeg', 1.0);
    
  } catch (error) {
    alert("Có lỗi khi tạo ảnh ghép. Vui lòng thử lại!");
    return null;
  }
};

const Logo = ({ size = 'large' }: { size?: 'small' | 'large' }) => (
  <div className={`flex items-center justify-center gap-3 ${size === 'large' ? 'flex-col mb-8' : ''}`}>
    <img src="/Logo.png" alt="Thanh Hằng Beauty" className={size === 'large' ? 'h-24 object-contain drop-shadow-md' : 'h-10 object-contain drop-shadow-sm'} />
    <span className={`${size === 'large' ? 'text-sm' : 'text-[10px]'} opacity-80 uppercase tracking-widest font-bold gold-text drop-shadow-md`}>AI Phân Tích Phong Thủy</span>
  </div>
);

const calculateDistance = (p1: any, p2: any) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export default function App() {
  const [state, setState] = useState({ 
    currentRole: null, currentUser: null, currentStep: 1, 
    customerData: null, capturedImage: null, analysisResult: null 
  });
  const [isAdminView, setIsAdminView] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  
  const handleLogin = (role: string, credentials?: any) => {
    if (role === 'Admin' && credentials?.username === 'admin' && credentials?.password === '123') {
      setIsAdminView(true);
      setState((prev: any) => ({ ...prev, currentRole: 'Admin', currentUser: { id: 'admin', username: 'admin', role: 'Admin', name: 'Quản trị viên' } }));
      return true;
    }
    if (role === 'Staff') {
      setState((prev: any) => ({ ...prev, currentRole: 'Staff', currentUser: { id: 'staff', username: 'staff', role: 'Staff', name: 'Nhân viên Tư vấn' }, currentStep: 1 }));
      return true;
    }
    if (role === 'Customer') {
      setState((prev: any) => ({ ...prev, currentRole: 'Customer', currentUser: { id: 'guest', username: 'guest', role: 'Customer', name: 'Khách Hàng' }, currentStep: 1 }));
      return true;
    }
    return false;
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "IMAGE",
        numFaces: 1
      });

      const img = new Image();
      img.src = (state.capturedImage as unknown as string);
      await new Promise((resolve) => { img.onload = resolve; });

      const result = faceLandmarker.detect(img);

      if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
        alert("Hệ thống không nhận diện được khuôn mặt. Vui lòng chụp thẳng và rõ nét hơn!");
        setIsAnalyzing(false);
        return;
      }

      const landmarks = result.faceLandmarks[0];
      const leftEyeWidth = calculateDistance(landmarks[33], landmarks[133]);
      const rightEyeWidth = calculateDistance(landmarks[362], landmarks[263]);
      const lipThickness = calculateDistance(landmarks[13], landmarks[14]);
      
      const facialMetricsRaw = `Dữ liệu đo lường hệ thống: Đã xác thực 478 điểm trên khuôn mặt. Tỷ lệ kích thước mắt trái (${leftEyeWidth.toFixed(4)}), mắt phải (${rightEyeWidth.toFixed(4)}). Độ dày môi (${lipThickness.toFixed(4)}). Yêu cầu đối chiếu phong thủy nhân tướng học để đề xuất dịch vụ PMU phù hợp.`;

      const gender = (state.customerData as any)?.gender || 'Nu';
      const dob = (state.customerData as any)?.dob || '';

      const response = await fetch('https://thanh-hang-beauty-ai-app.onrender.com/api/v1/analyze-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facialMetrics: facialMetricsRaw, gender: gender, dob: dob })
      });

      const apiResult = await response.json();

      if (apiResult.success) {
         setState((prev: any) => ({ ...prev, currentStep: 3, analysisResult: apiResult.data }));
      } else {
         alert("Lỗi từ server: " + apiResult.message);
      }
      setIsAnalyzing(false);

    } catch (error) {
      alert("Lỗi khi phân tích: " + error);
      setState((prev: any) => ({ ...prev, capturedImage: null }));
      setIsAnalyzing(false);
    }
  };

  const resetToNewCustomer = () => {
    setState({ 
      currentRole: state.currentRole, currentUser: state.currentUser, currentStep: 1, 
      customerData: null, capturedImage: null, analysisResult: null 
    });
  };

  const handleSaveProfile = async () => {
    try {
      const payload = { 
        fullName: (state.customerData as any)?.fullName || 'Khách Vãng Lai', 
        phone: (state.customerData as any)?.phone || '0000000000', 
        gender: (state.customerData as any)?.gender || 'Nu', 
        dob: (state.customerData as any)?.dob || '', 
        advisedServices: [(state.analysisResult as any)?.recommendedService || 'Tư vấn Phong thủy'] 
      };
      await saveCustomerAPI(payload);
      alert("Đã lưu hồ sơ khách hàng thành công!");
      resetToNewCustomer();
    } catch (error) {
      alert("Hệ thống lưu trữ đang bận, vui lòng thử lại sau.");
      resetToNewCustomer();
    }
  };

  const handleConfirmStep1 = async (formData: any) => {
    if (state.currentRole === 'Customer') {
      try {
        const res = await fetchCustomers();
        if (res.data && res.data.success) {
          const today = new Date();
          const todayStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
          const hasUsedToday = res.data.data.some((c: any) => c.phone === formData.phone && c.date === todayStr);
          if (hasUsedToday) { setShowLimitAlert(true); return; }
        }
      } catch (error) { console.error(error); }
    }
    setState((p: any) => ({ ...p, currentStep: 2, customerData: formData }));
  };

  if (!state.currentRole) return <LoginPage onLogin={handleLogin} />;
  if (state.currentRole === 'Admin' && isAdminView) return <AdminDashboard onSwitchView={() => setIsAdminView(false)} />;

  return (
    <div className="min-h-screen text-white flex flex-col relative bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg-lotus.jpg')" }}>
      <div className="absolute inset-0 bg-[#0f1117]/20 z-0 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col flex-1">
        <header className="h-20 px-6 border-b border-gold/40 flex items-center justify-between sticky top-0 z-50 bg-black/50 backdrop-blur-sm shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <Logo size="small" />
          <div className="flex items-center gap-4 text-sm">
            {state.currentRole === 'Admin' && <button onClick={() => setIsAdminView(true)} className="hidden sm:block px-4 py-2 border border-gold rounded-lg text-gold font-bold text-xs uppercase tracking-wider hover:bg-gold hover:text-black transition-colors">Trang Quản Trị</button>}
            <div className="text-right hidden sm:block"><p className="font-medium gold-text">Xin chào, {(state.currentUser as any)?.name}</p></div>
            <button onClick={() => window.location.reload()} className="p-2 hover:bg-gold/20 rounded-full text-gold transition-colors"><LogOut size={20} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {state.currentStep === 1 && <Step1CustomerInfo onConfirm={handleConfirmStep1} />}
            {state.currentStep === 2 && <Step2FaceScan onCapture={(img: any) => setState((p: any) => ({ ...p, capturedImage: img }))} capturedImage={state.capturedImage} onAnalyze={startAnalysis} isAnalyzing={isAnalyzing} />}
            {state.currentStep === 3 && state.analysisResult && state.capturedImage && (
              <Step3ActionHub result={state.analysisResult} image={state.capturedImage} customerName={(state.customerData as any)?.fullName} onFinish={handleSaveProfile} />
            )}
          </AnimatePresence>
        </main>

        {showLimitAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-md w-full">
              <div className="relative bg-[#0f1117] border border-gold/40 rounded-2xl p-8 text-center shadow-2xl">
                <h3 className="text-xl font-bold gold-text uppercase mb-4 tracking-widest">THÔNG BÁO TỪ HỆ THỐNG</h3>
                <p className="text-gray-100 text-sm leading-relaxed mb-6">Xin chào Quý khách hàng. Mỗi số điện thoại của Quý khách hàng sẽ chỉ được sử dụng app 1 lần/ngày.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => setShowLimitAlert(false)} className="py-3 border border-gray-600 rounded-lg text-gray-300 font-bold hover:text-white bg-transparent">Đóng</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step1CustomerInfo({ onConfirm }: any) {
  const [formData, setFormData] = useState({ fullName: '', phone: '', dob: '', gender: 'Nu' });
  const [isChecking, setIsChecking] = useState(false);
  const handleNext = async () => { if (!formData.fullName.trim() || !formData.phone.trim()) return alert("Vui lòng nhập đầy đủ Họ và tên, Số điện thoại!"); setIsChecking(true); await onConfirm(formData); setIsChecking(false); };
  return (
    <div className="max-w-2xl w-full bg-black/50 border border-gold/50 rounded-2xl p-8 mt-10">
      <h2 className="text-2xl font-bold gold-text mb-6 uppercase text-center">Nhập thông tin khách hàng</h2>
      <div className="space-y-4">
        <input type="text" placeholder="Họ và tên (*)" onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} className="w-full p-4 rounded-lg border border-gray-500 bg-black/40 focus:border-gold outline-none text-white placeholder-gray-400" />
        <input type="tel" placeholder="Số điện thoại (*)" onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full p-4 rounded-lg border border-gray-500 bg-black/40 focus:border-gold outline-none text-white placeholder-gray-400" />
        <div className="flex gap-4">
          <select value={formData.gender} onChange={e => setFormData(p => ({ ...p, gender: e.target.value }))} className="flex-1 p-4 rounded-lg border border-gray-500 bg-black/40 focus:border-gold outline-none text-white appearance-none cursor-pointer"><option value="Nu" className="bg-gray-900 text-white">Nữ</option><option value="Nam" className="bg-gray-900 text-white">Nam</option></select>
          <input type="date" onChange={e => setFormData(p => ({ ...p, dob: e.target.value }))} className="flex-[2] p-4 rounded-lg border border-gray-500 bg-black/40 focus:border-gold outline-none text-white [color-scheme:dark]" />
        </div>
        <button onClick={handleNext} disabled={isChecking} className="w-full btn-gold mt-4 disabled:opacity-50">{isChecking ? 'Đang kiểm tra...' : 'Tiếp tục'}</button>
      </div>
    </div>
  );
}

function Step2FaceScan({ onCapture, capturedImage, onAnalyze, isAnalyzing }: any) {
  const webcamRef = useRef<any>(null); const fileInputRef = useRef<HTMLInputElement>(null);
  const capture = React.useCallback(async () => { if (webcamRef.current) { const imageSrc = webcamRef.current.getScreenshot(); const croppedImage = await cropImageToPortrait(imageSrc, 3/4); onCapture(croppedImage); } }, [webcamRef, onCapture]);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = async () => { const base64Str = reader.result as string; const croppedImage = await cropImageToPortrait(base64Str, 3/4); onCapture(croppedImage); }; reader.readAsDataURL(file); } };
  
  if (isAnalyzing) return <div className="py-20 text-center bg-black/50 border border-gold/50 rounded-2xl p-10 mt-10"><RefreshCw size={64} className="animate-spin text-gold mx-auto mb-4" /><h2 className="text-2xl gold-text font-bold uppercase">AI Đang quét & phân tích...</h2></div>;
  
  return (
    <div className="max-w-3xl w-full bg-black/50 border border-gold/50 rounded-2xl p-8 mt-4">
      <h2 className="text-2xl font-bold gold-text uppercase text-center mb-6">Quét khuôn mặt</h2>
      <div className="relative aspect-[3/4] max-w-sm mx-auto bg-black/60 rounded-2xl overflow-hidden mb-6 flex items-center justify-center border-2 border-gold/50">{!capturedImage ? (<><Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" }} forceScreenshotSourceSize={true} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-90" /><div className="absolute inset-x-8 inset-y-12 border-2 border-dashed border-gold/60 rounded-[50%] pointer-events-none" /></>) : (<img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />)}</div>
      <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto w-full">{!capturedImage ? (<><button onClick={capture} className="flex-1 btn-gold !h-14 font-black tracking-widest text-xs"><Camera className="inline mr-2" size={18} /> Chụp Màn Hình</button><input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} /><button onClick={() => fileInputRef.current?.click()} className="flex-1 border-2 border-gold text-gold font-bold h-14 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold/20 text-xs bg-black/40"><Upload size={18} /> Tải Ảnh Lên</button></>) : (<><button onClick={() => onCapture(null)} className="flex-1 py-3 border-2 border-gray-400 text-gray-100 font-bold rounded-lg uppercase hover:border-white hover:text-white bg-black/40">Thử Lại</button><button onClick={onAnalyze} className="flex-[2] btn-gold">Phân Tích AI & Phong Thủy</button></>)}</div>
    </div>
  );
}

function Step3ActionHub({ result, image, customerName, onFinish }: any) {
  const fileInputAfterRef = useRef<HTMLInputElement>(null);
  
  // State mới để lưu bức ảnh đã được ghép
  const [mergedImage, setMergedImage] = useState<string | null>(null);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(result.prompt);
    alert("Đã copy Prompt! Hãy dán vào trợ lý AI.");
  };

  const handleDownloadPhoto = () => {
    const link = document.createElement('a');
    link.download = `AnhGoc_${customerName?.replace(/\s+/g, '') || 'Khach'}.jpg`;
    link.href = image;
    link.click();
  };

  const handleUploadAfterImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const afterBase64 = reader.result as string;
        const croppedAfter = await cropImageToPortrait(afterBase64, 3/4);
        
        // Nhận lại base64 của ảnh ghép thay vì tải
        const generatedBase64 = await generateBeforeAfterWithWatermark(image, croppedAfter);
        if (generatedBase64) {
          setMergedImage(generatedBase64);
        }

        if(fileInputAfterRef.current) fileInputAfterRef.current.value = ""; 
      };
      reader.readAsDataURL(file);
    }
  };

  // Hàm Gộp: Tải ảnh về máy VÀ gọi onFinish để lưu hồ sơ
  const handleSaveAndDownload = () => {
    const link = document.createElement('a');
    const safeName = customerName?.replace(/\s+/g, '_') || 'KhachHang';
    link.download = `ThanhHangBeauty_${mergedImage ? 'TruocSau' : 'AnhGoc'}_${safeName}.jpg`;
    link.href = mergedImage || image;
    link.click();
    
    // Gọi API lưu thông tin và quay về trang chủ
    onFinish();
  };

  // NẾU ĐÃ CÓ ẢNH GHÉP -> ĐỔI TOÀN BỘ GIAO DIỆN SANG XEM ẢNH FULL MÀN HÌNH
  if (mergedImage) {
    return (
      <div className="w-full flex flex-col items-center gap-6 max-w-6xl mt-4">
        <h2 className="text-2xl font-bold gold-text uppercase tracking-widest text-center">So Sánh Kết Quả</h2>
        
        {/* Khung ảnh rộng hiển thị trọn vẹn bức ảnh Before/After */}
        <div className="w-full relative rounded-2xl overflow-hidden border-2 border-gold/60 bg-black/60 shadow-[0_0_30px_rgba(201,168,76,0.2)]">
          <img src={mergedImage} className="w-full h-auto object-contain max-h-[70vh]" alt="Before After" />
        </div>
        
        <button onClick={handleSaveAndDownload} className="w-full max-w-md btn-gold py-4 font-bold uppercase tracking-widest text-lg mt-4">
          Lưu ảnh
        </button>
      </div>
    );
  }

  // NẾU CHƯA CÓ ẢNH GHÉP -> HIỂN THỊ GIAO DIỆN PHÂN TÍCH NHƯ CŨ
  return (
    <div className="w-full flex flex-col md:flex-row gap-8 max-w-6xl mt-4">
      <div className="flex-1 relative rounded-2xl overflow-hidden border-2 border-gold/60 h-[600px] bg-black/60">
        <img src={image} className="w-full h-full object-cover opacity-95" />
      </div>
      <div className="flex-[1.2] bg-black/50 border border-gold/50 rounded-2xl p-8 flex flex-col h-[600px]">
        <h2 className="text-2xl font-bold gold-text uppercase mb-4 tracking-widest text-center border-b border-gold/30 pb-4">
          Kết Quả Phân Tích & Tư Vấn
        </h2>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
           <div className="p-5 bg-black/40 rounded-lg border border-gray-600">
             <h3 className="font-bold text-gray-300 mb-2 uppercase text-xs">Đánh giá Nhân tướng:</h3>
             <p className="text-gray-100 text-sm leading-relaxed whitespace-pre-line">{result.analysis}</p>
           </div>
           <div className="p-5 bg-gold/10 rounded-lg border border-gold/40">
             <h3 className="font-bold text-gold mb-2 uppercase text-xs">Dịch vụ Đề xuất (AI):</h3>
             <p className="text-white font-bold text-lg">{result.recommendedService}</p>
           </div>
           <div className="p-5 bg-black/60 rounded-lg border border-blue-500/30">
             <h3 className="font-bold text-blue-400 mb-2 uppercase text-xs">Prompt (Lệnh vẽ cho AI):</h3>
             <div className="bg-gray-900 p-3 rounded border border-gray-700 text-green-400 font-mono text-xs h-24 overflow-y-auto">
               {result.prompt}
             </div>
           </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gold/30 grid grid-cols-2 gap-4">
          <button onClick={() => window.open('https://gemini.google.com/gem/1gWgRg4ER6YK0oFEh0WlSNbP0FbQwLuUj?usp=sharing', '_blank')} className="py-3 px-4 border border-blue-400 text-blue-400 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-400/20 text-sm transition-colors">
            <ExternalLink size={18} /> Gọi Trợ Lý AI
          </button>
          
          <button onClick={handleCopyPrompt} className="py-3 px-4 border border-green-500 text-green-500 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-500/20 text-sm transition-colors">
            <Copy size={18} /> Copy Prompt
          </button>
          
          <button onClick={handleDownloadPhoto} className="py-3 px-4 border border-amber-500 text-amber-500 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-amber-500/20 text-sm transition-colors">
            <ImageIcon size={18} /> Tải Ảnh Gốc
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputAfterRef} 
            className="hidden" 
            onChange={handleUploadAfterImage} 
          />
          <button onClick={() => fileInputAfterRef.current?.click()} className="py-3 px-4 border border-purple-500 text-purple-500 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-500/20 text-sm transition-colors">
            <Columns size={18} /> Before & After
          </button>
        </div>
        
        {/* Nút ở dưới cùng cũng được đổi tên và gọi chung 1 hàm lưu */}
        <button onClick={handleSaveAndDownload} className="w-full btn-gold mt-6 font-bold uppercase tracking-widest text-sm">
          Lưu ảnh
        </button>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg-lotus.jpg')" }}>
      <div className="absolute inset-0 bg-[#0f1117]/20 z-0 pointer-events-none"></div>
      <div className="relative z-10 bg-black/50 border border-gold/50 rounded-2xl p-10 w-full max-w-md text-center">
        <Logo size="large" />
        <div className="mt-10 space-y-4">
          <button onClick={() => onLogin('Admin', {username:'admin', password:'123'})} className="btn-gold w-full py-4 text-sm font-bold">ĐĂNG NHẬP QUẢN TRỊ VIÊN</button>
          <button onClick={() => onLogin('Staff')} className="w-full py-4 rounded-lg font-bold text-sm border border-gray-400 text-gray-200 hover:text-white hover:border-gray-200">ĐĂNG NHẬP NHÂN VIÊN</button>
          <button onClick={() => onLogin('Customer')} className="border-2 border-gold text-gold py-4 rounded-lg w-full font-bold hover:bg-gold/20">TRẢI NGHIỆM KHÁCH HÀNG</button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onSwitchView }: any) {
  const [customers, setCustomers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [filter, setFilter] = useState('all'); 
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  
  useEffect(() => { fetchCustomers().then((res: any) => { if(res.data && res.data.success) setCustomers(res.data.data) }).catch(console.error); }, []);
  
  const isBirthdayThisMonth = (dob?: string) => { if (!dob) return false; return parseInt(dob.split('-')[1], 10) === (new Date().getMonth() + 1); };
  const toggleCallStatus = async (id: string) => { const customer: any = customers.find((c: any) => c.id === id); if (!customer) return; setCustomers(customers.map((c: any) => c.id === id ? { ...c, isCalled: !customer.isCalled } : c)); try { await updateCustomerAPI(id, { isCalled: !customer.isCalled }); } catch (error) { setCustomers(customers.map((c: any) => c.id === id ? { ...c, isCalled: customer.isCalled } : c)); } };
  const toggleBirthdayStatus = async (id: string) => { const customer: any = customers.find((c: any) => c.id === id); if (!customer) return; setCustomers(customers.map((c: any) => c.id === id ? { ...c, isBirthdayWished: !customer.isBirthdayWished } : c)); try { await updateCustomerAPI(id, { isBirthdayWished: !customer.isBirthdayWished }); } catch (error) { setCustomers(customers.map((c: any) => c.id === id ? { ...c, isBirthdayWished: customer.isBirthdayWished } : c)); } };
  const handleDelete = async (id: string, name: string) => { if (window.confirm(`Xóa hồ sơ của khách hàng: ${name}?`)) { try { await deleteCustomerAPI(id); setCustomers(customers.filter((c: any) => c.id !== id)); } catch (error) { alert("Lỗi khi xóa khách hàng!"); } } };
  const handleEditSave = async () => { if (!editingCustomer) return; try { await updateCustomerAPI(editingCustomer.id, { fullName: editingCustomer.fullName, phone: editingCustomer.phone, gender: editingCustomer.gender, dob: editingCustomer.dob }); setCustomers(customers.map((c: any) => c.id === editingCustomer.id ? editingCustomer : c)); setEditingCustomer(null); } catch (error) { alert("Có lỗi xảy ra khi lưu!"); } };
  
  const filteredCustomers = customers.filter((c: any) => { const matchesSearch = c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm); if (filter === 'called') return matchesSearch && c.isCalled; if (filter === 'uncalled') return matchesSearch && !c.isCalled; if (filter === 'birthday') return matchesSearch && isBirthdayThisMonth(c.dob); return matchesSearch; });
  
  return (
    <div className="min-h-screen text-white flex flex-col relative bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/bg-lotus.jpg')" }}>
      <div className="absolute inset-0 bg-[#0f1117]/20 z-0 pointer-events-none"></div>
      <div className="relative z-10 flex flex-col flex-1">
        <header className="h-16 px-6 border-b border-gold/40 flex items-center justify-between bg-black/50">
          <span className="text-xl font-bold tracking-widest gold-text font-serif">✦ TRANG QUẢN TRỊ ✦</span>
          <button onClick={onSwitchView} className="px-6 py-2 border border-gold rounded-lg gold-text font-bold text-sm hover:bg-gold/20">VỀ LẠI APP</button>
        </header>
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-black/50 border border-gold/40 p-4 rounded-xl">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" size={18} />
              <input type="text" placeholder="Tìm theo Tên hoặc Số điện thoại..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-500 bg-black/50 focus:border-gold outline-none text-white" />
            </div>
            <div className="flex flex-wrap gap-1 bg-black/50 p-1.5 rounded-xl border border-gray-600">
              <button onClick={() => setFilter('birthday')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'birthday' ? 'bg-pink-500/30 text-pink-400 border border-pink-500/60' : 'text-gray-200 hover:text-pink-400'}`}>Sinh nhật tháng này</button>
              <button onClick={() => setFilter('all')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'all' ? 'gold-gradient text-black' : 'text-gray-200 hover:text-gold'}`}>Tất cả</button>
              <button onClick={() => setFilter('uncalled')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'uncalled' ? 'bg-amber-500/30 text-amber-400 border border-amber-500/60' : 'text-gray-200 hover:text-gold'}`}>Chưa gọi</button>
              <button onClick={() => setFilter('called')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filter === 'called' ? 'bg-green-500/30 text-green-400 border border-green-500/60' : 'text-gray-200 hover:text-gold'}`}>Đã gọi</button>
            </div>
          </div>
          <div className="bg-black/50 rounded-xl overflow-hidden flex-1 flex flex-col border border-gold/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gold/20 border-b border-gold/50 text-gold"><th className="p-4 font-bold whitespace-nowrap"><User className="inline mr-2" size={16}/> Khách Hàng</th><th className="p-4 font-bold whitespace-nowrap"><Phone className="inline mr-2" size={16}/> Số Điện Thoại</th><th className="p-4 font-bold whitespace-nowrap">Giới Tính</th><th className="p-4 font-bold whitespace-nowrap">Ngày Sinh</th><th className="p-4 font-bold whitespace-nowrap"><Calendar className="inline mr-2" size={16}/> Ngày Quét</th><th className="p-4 font-bold w-1/4">Nội Dung AI Tư Vấn</th><th className="p-4 font-bold text-center whitespace-nowrap">Thao Tác</th></tr></thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (<tr><td colSpan={7} className="p-8 text-center text-gray-200 italic">Chưa có dữ liệu.</td></tr>) : (filteredCustomers.map((customer: any) => (
                    <tr key={customer.id} className={`border-b border-gray-600/50 hover:bg-gold/10 ${customer.isCalled ? 'opacity-60 bg-black/60' : 'bg-transparent'}`}>
                      <td className="p-4 font-bold text-white">{customer.fullName}</td>
                      <td className="p-4 font-mono text-gold font-bold">{customer.phone}</td>
                      <td className="p-4 text-sm text-gray-200">{customer.gender}</td>
                      <td className="p-4 text-sm text-gray-200"><div>{customer.dob ? customer.dob.split('-').reverse().join('/') : '---'}</div>{isBirthdayThisMonth(customer.dob) && (<label className="flex items-center gap-2 mt-2 cursor-pointer w-max"><input type="checkbox" checked={customer.isBirthdayWished} onChange={() => toggleBirthdayStatus(customer.id)} className="w-3.5 h-3.5 accent-pink-500 cursor-pointer rounded border-gray-400"/><span className={`text-[10px] font-bold tracking-widest uppercase ${customer.isBirthdayWished ? 'text-gray-500 line-through' : 'text-pink-400'}`}>{customer.isBirthdayWished ? 'Đã tặng quà' : 'Tặng quà SN'}</span></label>)}</td>
                      <td className="p-4 text-sm text-gray-200">{customer.date}</td>
                      <td className="p-4"><div className="flex flex-wrap gap-2">{customer.advisedServices?.map((service: string, idx: number) => (<span key={idx} className="bg-black/60 text-gray-100 text-xs px-2 py-1 rounded border border-gold/40">{service}</span>))}</div></td>
                      <td className="p-4"><div className="flex flex-row items-center justify-center gap-3"><button onClick={() => toggleCallStatus(customer.id)} className={`p-2 rounded-full border ${customer.isCalled ? 'border-green-500/60 text-green-400 bg-green-500/20' : 'border-gold text-gold hover:bg-gold hover:text-black bg-black/60'}`}><PhoneCall size={16}/></button><button onClick={() => setEditingCustomer({...customer})} className="p-2 rounded-full border border-blue-400/50 text-blue-400 hover:bg-blue-500 hover:text-white bg-black/60"><Edit2 size={16}/></button><button onClick={() => handleDelete(customer.id, customer.fullName)} className="p-2 rounded-full border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white bg-black/60"><Trash2 size={16}/></button></div></td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {editingCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f1117] border border-gold/50 rounded-2xl p-8 max-w-md w-full"><h2 className="text-xl font-bold gold-text uppercase mb-6 text-center">Chỉnh Sửa Hồ Sơ</h2><div className="space-y-4"><div><label className="text-xs text-gray-400 font-bold mb-1 block uppercase">Họ và Tên</label><input type="text" value={editingCustomer.fullName} onChange={e => setEditingCustomer({...editingCustomer, fullName: e.target.value})} className="w-full p-3 rounded-lg border border-gray-600 bg-black/50 focus:border-gold outline-none text-white" /></div><div><label className="text-xs text-gray-400 font-bold mb-1 block uppercase">Số điện thoại</label><input type="tel" value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} className="w-full p-3 rounded-lg border border-gray-600 bg-black/50 focus:border-gold outline-none text-white" /></div><div className="flex gap-4"><div className="flex-1"><label className="text-xs text-gray-400 font-bold mb-1 block uppercase">Giới tính</label><select value={editingCustomer.gender} onChange={e => setEditingCustomer({...editingCustomer, gender: e.target.value})} className="w-full p-3 rounded-lg border border-gray-600 bg-black/50 focus:border-gold outline-none text-white"><option value="Nu" className="bg-gray-900">Nữ</option><option value="Nam" className="bg-gray-900">Nam</option></select></div><div className="flex-[2]"><label className="text-xs text-gray-400 font-bold mb-1 block uppercase">Ngày sinh</label><input type="date" value={editingCustomer.dob} onChange={e => setEditingCustomer({...editingCustomer, dob: e.target.value})} className="w-full p-3 rounded-lg border border-gray-600 bg-black/50 focus:border-gold outline-none text-white [color-scheme:dark]" /></div></div></div><div className="flex gap-4 mt-8"><button onClick={() => setEditingCustomer(null)} className="flex-1 py-3 border border-gray-500 rounded-lg text-gray-300 font-bold hover:text-white">Hủy</button><button onClick={handleEditSave} className="flex-1 btn-gold">Lưu Thay Đổi</button></div></motion.div></div>
      )}
    </div>
  );
}