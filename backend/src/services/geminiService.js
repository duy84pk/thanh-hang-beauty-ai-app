const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo SDK của Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gọi Gemini 3.1 Flash Lite để phân tích Đa phương thức (Ảnh + Text)
 */
async function analyzeAndGeneratePrompt(facialMetrics, gender, dob, imageBase64) {
    console.log(`[Gemini AI] Bắt đầu phân tích dữ liệu Đa phương thức... Giới tính: ${gender} | Ngày sinh: ${dob}`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

        // 1. CHUYỂN HÓA ẢNH ĐỂ GEMINI CÓ THỂ "NHÌN" THẤY
        let imagePart = null;
        if (imageBase64) {
            // Cắt bỏ phần đầu của chuỗi base64 để lấy đúng cục dữ liệu ảnh
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg"
                }
            };
        }

        // 2. SIÊU PROMPT TÍCH HỢP THỊ GIÁC & PHONG THỦY ĐỈNH CAO
        const promptText = `You are an elite Permanent Makeup (PMU) Master and a highly revered expert in Eastern Facial Physiognomy (Bậc thầy Nhân Tướng Học Phương Đông) at Thanh Hằng Beauty.
        
        CRITICAL VISUAL OBSERVATION RULES (DO NOT HALLUCINATE):
        You are now provided with a REAL IMAGE of the client. You MUST base your entire analysis strictly on what you visually see in this image.
        1. EYES: Look at the eyes. Are they single eyelid (mắt 1 mí), small, or hooded? You MUST mention the exact eye shape and link it to Feng Shui (e.g., Mắt nhỏ/1 mí thường thể hiện sự kín kẽ, nội tâm sâu sắc nhưng đôi khi thiếu đi sự cởi mở trong giao tiếp).
        2. FOREHEAD: Look at the forehead. Is it narrow, average, or high/wide? Describe it accurately. DO NOT say it is wide if it is narrow.
        3. GLABELLA (Ấn Đường): Look exactly between the eyebrows. If it is clear, DO NOT say messy hair covers it. 
        4. LIPS & EYEBROWS: Accurately describe their real shape and color based ON THE IMAGE.
        
        CRITICAL TONE & VOCABULARY INSTRUCTIONS:
        - Use advanced Eastern Physiognomy terminology (e.g., Cung Tài Bạch, Cung Huynh Đệ, Cung Phu Thê, Quan Lộc, Điền Trạch, Khí Sắc, Hình Tướng, Cát Tướng, Hung Tướng).
        - The tone must be professional, slightly mystical, empathetic, but highly authoritative.
        - Frame PMU not just as a beauty treatment, but as "Cải vận" (changing destiny).
        
        The "analysis" string MUST be written in Vietnamese, formatted with line breaks (\\n), and strictly follow this 2-part structure:
        
        🌟 CÁT TƯỚNG (ĐIỂM SÁNG PHONG THỦY BẢN THỂ):
        - [Tên bộ phận thực sự tốt trên ảnh - vd: Trán/Mắt/Mũi]: [Nhận xét đúng sự thật trên mặt. Dùng từ ngữ nhân tướng học uyên thâm. Khen ngợi điểm mạnh mang lại phú quý, tài lộc hoặc hậu vận tốt. Viết 3-4 câu].
        
        ⚠️ HUNG TƯỚNG (ĐIỂM CẦN CẢI THIỆN ĐỂ KHAI VẬN):
        - Lông mày (BẮT BUỘC): [Nhận xét đúng hình dáng thực tế trên ảnh. Liên kết với "Cung Huynh Đệ" hoặc "Quan Lộc". Phân tích việc lông mày khuyết/nhạt/lộn xộn làm thất thoát vượng khí ra sao. Viết 3-4 câu].
        - Môi (BẮT BUỘC): [CHỈ TẬP TRUNG phân tích về KHÍ SẮC MÔI (ví dụ: thâm sạm, nhợt nhạt). Liên kết sắc môi với Cung Nô Bộc/Giao tiếp. TUYỆT ĐỐI KHÔNG nhận xét độ dày mỏng trừ khi quá rõ ràng. Viết 3-4 câu].
        - [Bộ phận khác nhìn thấy rõ khuyết điểm trên ảnh - vd Mắt 1 mí, Ấn đường hẹp]: [Phân tích khuyết điểm thật sự nhìn thấy và tác động phong thủy].
        
        CRITICAL GENDER-SPECIFIC INSTRUCTIONS:
        The client's gender is ${gender === 'Nam' ? 'MALE' : 'FEMALE'}.
        IF FEMALE: 
        - recommendedService: "Combo Điêu khắc Mày Hairstroke rải hạt & Phun môi vi chạm (Khai mở Tài Lộc & Nhân Duyên)"
        - Prompt: "Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading. Elegant healed lip blush tattoo effect appropriate for age, semi-matte finish, MAXIMUM 30% glossiness, completely natural texture. Maintain 100% original facial structure and skin texture."
        
        IF MALE: 
        - recommendedService: "Combo Điêu khắc Mày Nam Phong Thủy & Khử thâm môi tự nhiên (Tăng cường Uy Quyền & Vượng Khí)"
        - Prompt: "Ultra-realistic, natural masculine eyebrow hairstrokes, slightly thicker and bolder, no makeup look. Natural male lips, dark lip correction, healthy natural skin-tone look, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture. Maintain 100% original facial structure and skin texture."
        
        Quality for both: Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution.
        
        You MUST respond ONLY with a valid JSON object exactly like this:
        {
            "score": <generate a random feng shui score between 65 and 88 based on the analysis>,
            "analysis": "<the structured analysis string using \\n for line breaks>",
            "recommendedService": "<PMU service name in Vietnamese>",
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
        console.log("[Gemini AI] => Phân tích đa phương thức (Ảnh + Text) thành công!");
        return parsedData;

    } catch (error) {
        console.error(`[Lỗi Gemini AI]: ${error.message}`);
        console.log("=> [KÍCH HOẠT DỰ PHÒNG] Trả về dữ liệu an toàn.");
        
        const isMale = gender === 'Nam';

        // ĐÂY LÀ ĐOẠN VĂN MẪU TÔI ĐÃ CẮT BỚT, GIỜ TRẢ LẠI ĐẦY ĐỦ 100% CHO ANH
        return {
            score: 80,
            analysis: "🌟 CÁT TƯỚNG (ĐIỂM SÁNG PHONG THỦY):\n- Tổng quan: Hình tướng khuôn mặt cơ bản hài hòa. Tuy nhiên để khai thông toàn bộ vượng khí, cần chỉnh lý một số tiểu tiết trên cung quan lộc và giao tiếp.\n\n⚠️ HUNG TƯỚNG (ĐIỂM CẦN CẢI THIỆN ĐỂ KHAI VẬN):\n- Lông mày: Khí sắc lông mày mờ nhạt, dáng mày chưa liền mạch. Trong nhân tướng học, điều này ảnh hưởng trực tiếp đến Cung Huynh Đệ và đường Công Danh, khiến tài lộc dễ thất thoát, công việc thiếu sự đột phá.\n- Môi: Sắc môi hiện tại thiếu đi sự hồng hào, tươi tắn. Khí sắc môi thâm xỉn sẽ tạo ra rào cản ở Cung Nô Bộc, làm suy giảm năng lượng thu hút nhân duyên tốt và dễ gây hiểu lầm trong giao tiếp.",
            recommendedService: isMale 
                ? "Combo Điêu khắc Mày Nam Phong Thủy & Khử thâm môi tự nhiên (Tăng cường Uy Quyền & Vượng Khí)"
                : "Combo Điêu khắc Mày Hairstroke rải hạt & Phun môi vi chạm (Khai mở Tài Lộc & Nhân Duyên)",
            prompt: isMale
                ? "Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution. Apply flawless PMU healing simulation for MALE. Ultra-realistic, natural masculine eyebrow hairstrokes, slightly thicker and bolder, no makeup look. Natural male lips, dark lip correction, healthy natural skin-tone look, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture. Maintain 100% original facial structure and skin texture."
                : "Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution. Apply flawless PMU healing simulation for FEMALE. Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading. Elegant healed lip blush tattoo effect appropriate for age, semi-matte finish, maximum 30% glossiness, completely natural texture. Maintain 100% original facial structure and skin texture."
        };
    }
}

module.exports = {
    analyzeAndGeneratePrompt
};