import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://thanh-hang-beauty-ai-app.onrender.com';
const BASE_API = `${API_URL}/api/v1`;

// --- CÁC API VỀ XỬ LÝ ẢNH & AI ---

export const compressImageForAnalysis = (base64Str: string, maxWidth = 800): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
  });
};

// Đã bổ sung gender và dob để gửi cho GPT tính toán phong thủy cá nhân hóa
export const analyzeFaceAPI = async (base64Image: string, gender: string = 'Nu', dob: string = '') => {
  return axios.post(`${BASE_API}/analyze-face`, { 
    image: base64Image,
    gender: gender,
    dob: dob
  });
};

export const generateBeautyPortrait = async (base64Image: string, maskImage: string, categories: string[], gender: string, analysisResult: any) => {
  return axios.post(`${BASE_API}/generate-portrait`, { image: base64Image, categories, gender, analysisResult });
};

// --- CÁC API VỀ QUẢN LÝ KHÁCH HÀNG ---

// Lấy danh sách khách hàng
export const fetchCustomers = async () => {
  return axios.get(`${BASE_API}/customers`);
};

// Lưu hồ sơ khách hàng mới
export const saveCustomerAPI = async (customerData: any) => {
  return axios.post(`${BASE_API}/customers`, customerData);
};

// Cập nhật trạng thái (Gọi/Tặng quà)
export const updateCustomerAPI = async (id: string, updateData: any) => {
  return axios.put(`${BASE_API}/customers/${id}`, updateData);
};

export const deleteCustomerAPI = async (id: string) => {
  return axios.delete(`${BASE_API}/customers/${id}`);
};