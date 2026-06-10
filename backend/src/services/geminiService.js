const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo SDK của Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gọi Gemini 3.1 Flash Lite để phân tích Đa phương thức (Ảnh + Text) kèm Báo Giá Chuẩn
 */
async function analyzeAndGeneratePrompt(facialMetrics, gender, dob, imageBase64) {
    console.log(`[Gemini AI] Bắt đầu phân tích dữ liệu Đa phương thức... Giới tính: ${gender} | Ngày sinh: ${dob}`);

    try {
        // Dùng bản 3.1 Flash Lite để đảm bảo ổn định tuyệt đối
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        // 1. CHUYỂN HÓA ẢNH ĐỂ GEMINI CÓ THỂ "NHÌN" THẤY
        let imagePart = null;
        if (imageBase64) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };
        }

        // 2. SIÊU PROMPT TÍCH HỢP THỊ GIÁC, PHONG THỦY & BẢNG GIÁ THANH HẰNG BEAUTY
        const promptText = `You are an elite Permanent Makeup (PMU) Master and a highly revered expert in Eastern Facial Physiognomy (Bậc thầy Nhân Tướng Học Phương Đông) at Thanh Hằng Beauty.
        
        CRITICAL VISUAL OBSERVATION RULES (DO NOT HALLUCINATE):
        You are now provided with a REAL IMAGE of the client. You MUST base your entire analysis strictly on what you visually see in this image.
        1. EYES: Look at the eyes. Are they single eyelid (mắt 1 mí), small, or hooded? You MUST mention the exact eye shape and link it to Feng Shui.
        2. FOREHEAD: Look at the forehead. Is it narrow, average, or high/wide? Describe it accurately.
        3. GLABELLA (Ấn Đường): Look exactly between the eyebrows.
        4. LIPS & EYEBROWS: Accurately describe their real shape and color based ON THE IMAGE.
        
        CRITICAL TONE & VOCABULARY INSTRUCTIONS:
        - Use advanced Eastern Physiognomy terminology (e.g., Cung Tài Bạch, Cung Huynh Đệ, Cung Phu Thê, Quan Lộc, Điền Trạch, Khí Sắc).
        - The tone must be professional, mystical, empathetic, and highly authoritative. Frame PMU as "Cải vận" (changing destiny).
        
        The "analysis" string MUST be written in Vietnamese, formatted with line breaks (\\n), and follow this 2-part structure:
        
        🌟 CÁT TƯỚNG (ĐIỂM SÁNG PHONG THỦY BẢN THỂ):
        - [Tên bộ phận thực sự tốt trên ảnh]: [Nhận xét đúng sự thật trên mặt. Dùng từ ngữ nhân tướng học. Viết 3-4 câu].
        
        ⚠️ HUNG TƯỚNG (ĐIỂM CẦN CẢI THIỆN ĐỂ KHAI VẬN):
        - Lông mày (BẮT BUỘC): [Nhận xét đúng hình dáng thực tế trên ảnh. Liên kết với "Cung Huynh Đệ" hoặc "Quan Lộc". Viết 3-4 câu].
        - Môi (BẮT BUỘC): [CHỈ TẬP TRUNG phân tích về KHÍ SẮC MÔI. Liên kết sắc môi với Cung Nô Bộc/Giao tiếp. Viết 3-4 câu].
        - [Bộ phận khác nhìn thấy rõ khuyết điểm trên ảnh]: [Phân tích khuyết điểm thật sự nhìn thấy và tác động phong thủy].
        
        BẢNG GIÁ DỊCH VỤ PMU CHÍNH THỨC TẠI THANH HẰNG BEAUTY (PRICE LIST):
        - Phun Mày: 2.000.000 VNĐ (Master) | 4.000.000 VNĐ (Grand Master)
        - Phun Mí: 1.000.000 VNĐ (Master) | 2.000.000 VNĐ (Grand Master)
        - Phun Môi Nano Collagen: 2.500.000 VNĐ (Master) | 5.000.000 VNĐ (Grand Master)
        - Chân Mày Sợi Magic Brows: 3.000.000 VNĐ (Master) | 6.000.000 VNĐ (Grand Master)
        - Chân Mày Sợi Cover: 3.500.000 VNĐ (Master) | 7.000.000 VNĐ (Grand Master)
        
        CRITICAL GENDER-SPECIFIC & PRICING INSTRUCTIONS:
        The client's gender is ${gender === 'Nam' ? 'MALE' : 'FEMALE'}.
        Based on your visual analysis, recommend the MOST SUITABLE PMU service combo for this client in the "recommendedService" field.
        
        RULES FOR PRICING IN 'recommendedService':
        - Tự động ghép nối các dịch vụ từ BẢNG GIÁ ở trên. Format bắt buộc:
        "[Tên Combo Dịch vụ đề xuất] 
        👉 Mức giá Master: [Tổng tiền Master]
        👉 Mức giá Grand Master Thanh Hằng: [Tổng tiền Grand Master]"
        
        Ví dụ Nữ (Chân mày sợi Magic Brows + Phun môi Nano Collagen):
        "Combo Chân Mày Sợi Magic Brows & Phun Môi Nano Collagen Khai Vận 
        👉 Cấp độ Master: 5.500.000 VNĐ 
        👉 Cấp độ Grand Master Thanh Hằng: 11.000.000 VNĐ"
        
        - NẾU khuyên khách làm dịch vụ KHÔNG CÓ TRONG BẢNG GIÁ (Xóa xăm cũ, hạ viền, hút thâm sâu), HÃY THÊM câu: "Vui lòng liên hệ Hotline 0975.880.318 để được tư vấn phác đồ và báo giá chi tiết."
        
        For the "prompt" field (English PMU masterpiece prompt):
        - IF FEMALE: "Ultra-detailed, crisp Hairstroke eyebrows, soft Ombre shading. Elegant healed lip blush tattoo, semi-matte finish, MAXIMUM 30% glossiness, completely natural texture. Maintain 100% original facial structure."
        - IF MALE: "Ultra-realistic natural masculine eyebrow hairstrokes, slightly thicker, no makeup look. Natural male lips, dark lip correction, healthy natural skin-tone, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture. Maintain 100% original facial structure."
        
        You MUST respond ONLY with a valid JSON object exactly like this:
        {
            "score": <generate a random feng shui score between 65 and 88 based on the analysis>,
            "analysis": "<the structured analysis string using \\n for line breaks>",
            "recommendedService": "<PMU service name and exact pricing string>",
            "prompt": "<English PMU masterpiece prompt>"
        }
        
        Client Details: Gender: ${gender}, Date of Birth: ${dob}.
        Raw Facial Metrics from System: ${facialMetrics}`;

        // 3. GỬI CẢ TEXT VÀ ẢNH CHO AI
        const requestContent = imagePart ? [promptText, imagePart] : [promptText];
        const result = await model.generateContent(requestContent);
        
        const responseContent = result.response.text();
        
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Gemini không trả về định dạng JSON hợp lệ.");
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        console.log("[Gemini AI] => Phân tích đa phương thức & Báo giá thành công!");
        return parsedData;

    } catch (error) {
        console.error(`[Lỗi Gemini AI]: ${error.message}`);
        console.log("=> [KÍCH HOẠT DỰ PHÒNG] Trả về dữ liệu an toàn.");
        
        const isMale = gender === 'Nam';

        return {
            score: 80,
            analysis: "🌟 CÁT TƯỚNG (ĐIỂM SÁNG PHONG THỦY):\n- Tổng quan: Hình tướng khuôn mặt cơ bản hài hòa. Tuy nhiên để khai thông toàn bộ vượng khí, cần chỉnh lý một số tiểu tiết trên cung quan lộc và giao tiếp.\n\n⚠️ HUNG TƯỚNG (ĐIỂM CẦN CẢI THIỆN ĐỂ KHAI VẬN):\n- Lông mày: Khí sắc lông mày mờ nhạt, dáng mày chưa liền mạch. Trong nhân tướng học, điều này ảnh hưởng trực tiếp đến Cung Huynh Đệ và đường Công Danh, khiến tài lộc dễ thất thoát.\n- Môi: Sắc môi hiện tại thiếu đi sự tươi tắn. Khí sắc môi thâm xỉn sẽ tạo ra rào cản ở Cung Nô Bộc, dễ gây hiểu lầm trong giao tiếp.",
            recommendedService: isMale 
                ? "Combo Chân Mày Sợi Magic Brows & Khử thâm môi tự nhiên\n👉 Cấp độ Master: 5.500.000 VNĐ\n👉 Cấp độ Grand Master Thanh Hằng: 11.000.000 VNĐ\n(Lưu ý: Khử thâm sâu vui lòng liên hệ Hotline 0975.880.318 để báo giá chi tiết)"
                : "Combo Chân Mày Sợi Magic Brows & Phun Môi Nano Collagen\n👉 Cấp độ Master: 5.500.000 VNĐ\n👉 Cấp độ Grand Master Thanh Hằng: 11.000.000 VNĐ",
            prompt: isMale
                ? "Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution. Apply flawless PMU healing simulation for MALE. Ultra-realistic, natural masculine eyebrow hairstrokes, slightly thicker and bolder, no makeup look. Natural male lips, dark lip correction, healthy natural skin-tone look, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture. Maintain 100% original facial structure and skin texture."
                : "Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution. Apply flawless PMU healing simulation for FEMALE. Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading. Elegant healed lip blush tattoo effect appropriate for age, semi-matte finish, maximum 30% glossiness, completely natural texture. Maintain 100% original facial structure and skin texture."
        };
    }
}

module.exports = {
    analyzeAndGeneratePrompt
};