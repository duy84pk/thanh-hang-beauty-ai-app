const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo SDK của Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Gọi Gemini 1.5 Flash để phân tích text MediaPipe và tạo Prompt
 */
async function analyzeAndGeneratePrompt(facialMetrics, gender, dob) {
    console.log(`[Gemini AI] Bắt đầu phân tích dữ liệu... Giới tính: ${gender} | Ngày sinh: ${dob}`);

    try {
        // Sử dụng bản Flash để có tốc độ phản hồi chớp nhoáng
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const promptText = `You are an elite Permanent Makeup (PMU) Master and an expert in Eastern Facial Physiognomy (Phong Thủy Khuôn Mặt) working for Thanh Hằng Beauty.
        Your task is to analyze raw facial metrics and generate a highly structured, convincing feng shui analysis for the client to upsell PMU services.
        
        The "analysis" string MUST be written in Vietnamese, formatted with line breaks (\\n), and strictly follow this 2-part structure:
        
        🌟 ĐIỂM TỐT (CÁT TƯỚNG):
        - [Tên bộ phận - vd: Tổng quan/Trán/Mắt/Mũi/Gò má/Ấn đường]: [Mô tả điểm tốt và tác động tích cực tới phong thủy. Viết từ 3 đến 5 câu].

        ⚠️ ĐIỂM CHƯA TỐT (HUNG TƯỚNG):
        - Lông mày: [BẮT BUỘC CÓ. Phân tích khuyết điểm và sự ảnh hưởng tiêu cực tới đường tài lộc. Viết từ 3 đến 5 câu].
        - Môi: [BẮT BUỘC CÓ. Phân tích khuyết điểm và sự ảnh hưởng tiêu cực tới nhân duyên, giao tiếp. Viết từ 3 đến 5 câu].
        - Trán/Mắt/Mũi/Gò má/Ấn đường: [NẾU NHÌN THẤY TRÊN ẢNH XẤU. Phân tích khuyết điểm và sự ảnh hưởng tiêu cực tới nhân duyên, giao tiếp. Viết từ 3 đến 5 câu].

        CRITICAL GENDER-SPECIFIC INSTRUCTIONS:
        The client's gender is ${gender === 'Nam' ? 'MALE' : 'FEMALE'}. You MUST tailor the PMU service and the image prompt accordingly.

        IF FEMALE:
        - recommendedService: "Combo Điêu khắc Mày Hairstroke rải hạt & Phun môi vi chạm"
        - Prompt Eyebrows: Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading.
        - Prompt Lips: Choose a modern lip color trend appropriate for their age. Explicitly specify "healed lip blush tattoo effect, semi-matte finish, MAXIMUM 30% glossiness, completely natural texture".

        IF MALE:
        - recommendedService: "Combo Điêu khắc Mày Nam Phong Thủy & Khử thâm môi tự nhiên"
        - Prompt Eyebrows: Ultra-realistic, natural masculine eyebrow hairstrokes, slightly thicker and bolder, no makeup look.
        - Prompt Lips: Natural male lips, dark lip correction, healthy natural skin-tone look, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture.

        Quality for both: Masterpiece portrait photography, ultra-realistic, 8K resolution, keep 100% original facial identity.
        
        You MUST respond ONLY with a valid JSON object exactly like this:
        {
            "score": 85,
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
        return parsedData;

    } catch (error) {
        console.error(`[Lỗi Gemini AI]: ${error.message}`);
        console.log("=> [KÍCH HOẠT DỰ PHÒNG] Trả về dữ liệu an toàn.");
        
        const isMale = gender === 'Nam';

        return {
            score: 80,
            analysis: "🌟 ĐIỂM TỐT (CÁT TƯỚNG):\n- Tổng quan: Bố cục khuôn mặt có độ hài hòa cơ bản, các nét tương đối cân xứng. Điều này giúp đường đời gặp nhiều may mắn, dễ nhận được sự hỗ trợ từ quý nhân trong công việc.\n\n⚠️ ĐIỂM CHƯA TỐT (HUNG TƯỚNG):\n- Lông mày: Sợi lông mày còn thưa nhạt và thiếu độ sắc nét ở phần đuôi. Trong phong thủy, điều này dễ làm thất thoát tài lộc, tiền bạc làm ra khó giữ, công danh thiếu sự đột phá.\n- Môi: Sắc môi chưa được tươi tắn, viền môi thiếu rõ ràng hoặc có hiện tượng xỉn màu. Khuyết điểm này ảnh hưởng trực tiếp tới cung giao tiếp, dễ sinh hiểu lầm trong các mối quan hệ.",
            recommendedService: isMale 
                ? "Combo Điêu khắc Mày Nam Phong Thủy & Khử thâm môi tự nhiên"
                : "Combo Điêu khắc Mày Hairstroke rải hạt & Phun môi vi chạm",
            prompt: isMale
                ? "Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution. Apply flawless PMU healing simulation for MALE. Ultra-realistic, natural masculine eyebrow hairstrokes, slightly thicker and bolder, no makeup look. Natural male lips, dark lip correction, healthy natural skin-tone look, ABSOLUTELY NO glossy finish, NO lipstick colors, 100% matte natural texture. Maintain 100% original facial structure and skin texture."
                : "Masterpiece portrait photography, ultra-realistic, highly detailed, 8K resolution. Apply flawless PMU healing simulation for FEMALE. Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading. Elegant healed lip blush tattoo effect appropriate for age, semi-matte finish, maximum 30% glossiness, completely natural texture. Maintain 100% original facial structure and skin texture."
        };
    }
}

module.exports = {
    analyzeAndGeneratePrompt
};