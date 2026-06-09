const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo SDK của Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gọi Gemini để phân tích text MediaPipe và tạo Prompt
 */
async function analyzeAndGeneratePrompt(facialMetrics, gender, dob) {
    console.log(`[Gemini AI] Bắt đầu phân tích dữ liệu... Giới tính: ${gender} | Ngày sinh: ${dob}`);

    try {
        // LƯU Ý QUAN TRỌNG: Gọi bản 1.5-flash để đảm bảo tốc độ cực nhanh và không bị lỗi quá tải
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const promptText = `You are an elite Permanent Makeup (PMU) Master and a highly revered expert in Eastern Facial Physiognomy (Bậc thầy Nhân Tướng Học Phương Đông). You are working for Thanh Hằng Beauty.
        Your task is to analyze raw facial metrics and generate a highly structured, mystical, yet utterly convincing feng shui analysis for the client. The goal is to build deep trust and logically upsell PMU services to improve their destiny.
        
        CRITICAL TONE & VOCABULARY INSTRUCTIONS:
        - Use advanced Eastern Physiognomy terminology (e.g., Cung Tài Bạch, Cung Huynh Đệ, Cung Phu Thê, Quan Lộc, Điền Trạch, Khí Sắc, Hình Tướng, Cát Tướng, Hung Tướng).
        - The tone must be professional, slightly mystical, empathetic, but highly authoritative.
        - Frame PMU not just as a beauty treatment, but as "Cải vận" (changing destiny), "Khai thông tài lộc" (unlocking wealth), and "Thu hút quý nhân" (attracting benefactors).
        
        The "analysis" string MUST be written in Vietnamese, formatted with line breaks (\\n), and strictly follow this 2-part structure:
        
        🌟 CÁT TƯỚNG (ĐIỂM SÁNG PHONG THỦY):
        - [Tên bộ phận - vd: Tổng quan/Mắt/Gò má/Trán]: [Nhận xét từ 3-4 câu dùng từ ngữ nhân tướng học uyên thâm. Khen ngợi điểm mạnh mang lại phú quý, tài lộc hoặc hậu vận tốt].
        
        ⚠️ HUNG TƯỚNG (ĐIỂM CẦN CẢI THIỆN ĐỂ KHAI VẬN):
        - Lông mày (BẮT BUỘC): [Nhận xét 3-4 câu. Liên kết hình dáng/màu sắc lông mày với "Cung Huynh Đệ" hoặc "Đường Công Danh". Phân tích việc lông mày khuyết/nhạt/lộn xộn làm thất thoát vượng khí, cản trở tài lộc ra sao].
        - Môi (BẮT BUỘC): [Nhận xét 3-4 câu. CHỈ TẬP TRUNG phân tích về KHÍ SẮC MÔI (ví dụ: thâm sạm, nhợt nhạt, thiếu sinh khí). Liên kết sắc môi với "Cung Nô Bộc" hoặc "Nhân Duyên", giải thích màu môi xỉn làm giảm sức hút, dễ gặp thị phi, trắc trở trong giao tiếp. TUYỆT ĐỐI KHÔNG nhận xét môi dày hay mỏng, trừ khi ảnh thể hiện sự mất cân đối cực kỳ nghiêm trọng].
        - [Bộ phận khác nếu có khuyết điểm rõ rệt]: [Nhận xét 3-4 câu liên kết phong thủy].
        
        CRITICAL GENDER-SPECIFIC INSTRUCTIONS:
        The client's gender is ${gender === 'Nam' ? 'MALE' : 'FEMALE'}. You MUST tailor the PMU service and the image prompt accordingly.
        
        IF FEMALE:
        - recommendedService: "Combo Điêu khắc Mày Hairstroke rải hạt & Phun môi vi chạm (Khai mở Tài Lộc & Nhân Duyên)"
        - Prompt Eyebrows: Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading.
        - Prompt Lips: Choose a modern lip color trend appropriate for their age. Explicitly specify "healed lip blush tattoo effect, semi-matte finish, MAXIMUM 30% glossiness, completely natural texture".
        
        IF MALE:
        - recommendedService: "Combo Điêu khắc Mày Nam Phong Thủy & Khử thâm môi tự nhiên (Tăng cường Uy Quyền & Vượng Khí)"
        - Prompt Eyebrows: Ultra-realistic, natural masculine eyebrow hairstrokes, slightly thicker and bolder, no makeup look.
        - Prompt Lips: Natural male lips, dark lip correction, healthy natural skin-tone look, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture.
        
        Quality for both: Masterpiece portrait photography, ultra-realistic, 8K resolution, keep 100% original facial identity.
        
        You MUST respond ONLY with a valid JSON object exactly like this:
        {
            "score": <generate a random feng shui score between 65 and 88 based on the analysis>,
            "analysis": "<the structured analysis string using \\n for line breaks>",
            "recommendedService": "<PMU service name in Vietnamese>",
            "prompt": "<English image prompt>"
        }
        
        Client Details: Gender: ${gender}, Date of Birth: ${dob}.
        Raw Facial Metrics from System: ${facialMetrics}`;

        const result = await model.generateContent(promptText);
        const responseContent = result.response.text();
        
        // Trích xuất JSON 
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Gemini không trả về định dạng JSON hợp lệ.");
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        console.log("[Gemini AI] => Phân tích thành công!");
        return parsedData;

    } catch (error) {
        console.error(`[Lỗi Gemini AI]: ${error.message}`);
        console.log("=> [KÍCH HOẠT DỰ PHÒNG] Trả về dữ liệu an toàn.");
        
        const isMale = gender === 'Nam';

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