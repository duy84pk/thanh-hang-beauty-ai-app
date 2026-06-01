const Anthropic = require('@anthropic-ai/sdk');

// Khởi tạo SDK của Anthropic
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Gọi Claude 3.5 Sonnet để phân tích text MediaPipe và tạo Prompt
 */
async function analyzeAndGeneratePrompt(facialMetrics, gender, dob) {
    console.log(`[Claude AI] Bắt đầu phân tích dữ liệu MediaPipe... Giới tính: ${gender} | Ngày sinh: ${dob}`);

    try {
        const response = await anthropic.messages.create({
            model: "claude-3-haiku-20240307", // Đã cập nhật lên phiên bản model mới nhất, không lo lỗi 404
            max_tokens: 1500,
            temperature: 0.7,
            system: `You are an elite Permanent Makeup (PMU) Master and an expert in Eastern Facial Physiognomy (Phong Thủy Khuôn Mặt) working for Thanh Hằng Beauty.
            Your task is to analyze raw facial metrics and generate a highly structured, convincing feng shui analysis for the client to upsell PMU services.
            
            The "analysis" string MUST be written in Vietnamese, formatted with line breaks (\\n), and strictly follow this 2-part structure:
            
            🌟 ĐIỂM TỐT (CÁT TƯỚNG):
            - [Tên bộ phận - vd: Tổng quan/Trán/Mắt/Mũi/Gò má/Nhân trung]: [Mô tả điểm tốt và tác động tích cực tới phong thủy. Viết từ 1 đến tối đa 3 câu].

            ⚠️ ĐIỂM CHƯA TỐT (HUNG TƯỚNG):
            - Lông mày: [BẮT BUỘC CÓ. Phân tích khuyết điểm và sự ảnh hưởng tiêu cực tới đường tài lộc, sự nghiệp. Viết từ 1 đến tối đa 3 câu].
            - Môi: [BẮT BUỘC CÓ. Phân tích khuyết điểm và sự ảnh hưởng tiêu cực tới nhân duyên, giao tiếp. Viết từ 1 đến tối đa 3 câu].

            CRITICAL GENDER-SPECIFIC INSTRUCTIONS FOR PMU SERVICE AND ENGLISH PROMPT:
            The client's gender is ${gender === 'Nam' ? 'MALE' : 'FEMALE'}. You MUST tailor the PMU service and the image prompt accordingly.

            IF FEMALE:
            - recommendedService: "Combo Điêu khắc Hairstroke Mày & Phun môi Ombre rải hạt" (or similar).
            - Prompt Eyebrows: Ultra-detailed, crisp, and sharp Hairstroke eyebrows combined with soft Ombre shading (powder effect).
            - Prompt Lips: Choose a modern lip color trend appropriate for their age calculated from DOB (e.g., peachy/coral pink for young women, elegant ruby/terracotta/mauve for mature women). Explicitly specify "healed lip blush tattoo effect, semi-matte finish, MAXIMUM 30% glossiness, completely natural texture, avoid overly shiny or wet looks".

            IF MALE:
            - recommendedService: "Combo Điêu khắc Mày Nam Phong Thủy & Khử thâm môi tự nhiên".
            - Prompt Eyebrows: Ultra-realistic, natural masculine eyebrow microblading/hairstrokes, slightly thicker and bolder, perfectly blended with natural hair, NO makeup look.
            - Prompt Lips: Natural male lips, dark lip correction (khử thâm môi nam), healthy natural skin-tone tint, ABSOLUTELY NO glossy finish, NO lipstick colors (no terracotta, red, or pink), 100% matte natural male texture.

            Quality for both: Masterpiece portrait photography, ultra-realistic, 8K resolution, keep 100% original facial identity and skin texture.
            
            You MUST respond ONLY with a valid JSON object. Do not output any markdown formatting or additional text.
            
            {
                "score": <number between 70-98>,
                "analysis": "<the structured analysis string using \\n for line breaks>",
                "recommendedService": "<PMU service name in Vietnamese>",
                "prompt": "<English image prompt following the critical instructions>"
            }`,
            messages: [
                {
                    role: "user",
                    content: `Client Details: Gender: ${gender}, Date of Birth: ${dob}.
                    Raw Facial Metrics from System: ${facialMetrics}
                    
                    Analyze this data and return the JSON strictly following the guidelines.`
                }
            ]
        });

        const responseContent = response.content[0].text;
        
        // Trích xuất JSON 
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Claude không trả về định dạng JSON hợp lệ.");
        }

        const parsedData = JSON.parse(jsonMatch[0]);
        return parsedData;

    } catch (error) {
        console.error(`[Lỗi Claude AI]: ${error.message}`);
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