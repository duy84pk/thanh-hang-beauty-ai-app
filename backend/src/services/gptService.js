const { OpenAI } = require('openai');

// Khởi tạo OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Hàm gọi GPT-4o để phân tích khuôn mặt và phong thủy
 */
async function analyzeFace(base64Image, gender, dob) {
    console.log(`[GPT-4o] Bắt đầu phân tích Phong Thủy... Giới tính: ${gender} | Ngày sinh: ${dob}`);

    try {
        // Đảm bảo đúng định dạng base64 cho OpenAI Vision
        const imageUrl = base64Image.startsWith('data:image') 
            ? base64Image 
            : `data:image/jpeg;base64,${base64Image}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            // Ép GPT luôn trả về JSON chuẩn
            response_format: { type: "json_object" }, 
            messages: [
                {
                    role: "system",
                    content: `You are an expert in Facial Physiognomy (Phong Thủy Khuôn Mặt) and PMU (Permanent Makeup) aesthetics. 
                    You MUST respond ONLY in valid JSON format. Do not include any other text.`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Analyze the facial proportions and feng shui for this client (Gender: ${gender}, DOB: ${dob}).
                            Focus on the eyebrows and lips. Avoid mentioning real identity or sensitive biometric data; just focus on aesthetic and feng shui landmarks.
                            
                            Return the result strictly in this exact JSON structure:
                            {
                                "status": "success",
                                "analysis": "Detailed aesthetic and feng shui analysis...",
                                "advice": "Specific PMU advice based on golden ratio and feng shui to improve their features..."
                            }`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl,
                                detail: "low" // Đặt low để xử lý nhanh và tiết kiệm token
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500,
        });

        const responseContent = response.choices[0].message.content;
        const parsedData = JSON.parse(responseContent);
        
        // BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ TRẢ DỮ LIỆU VỀ CHO CONTROLLER
        return parsedData;

    } catch (error) {
        console.error(`[Lỗi OpenAI GPT]: ${error.message}`);
        console.log("=> [KÍCH HOẠT DỰ PHÒNG] Trả về dữ liệu an toàn để App chạy tiếp tục mượt mà.");
        
        // BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ TRẢ DỰ PHÒNG KHI OPENAI BỊ LỖI
        return {
            status: "fallback",
            analysis: "Khuôn mặt có nét hài hòa cơ bản. Cần điều chỉnh thêm tỷ lệ vàng ở lông mày và môi để thu hút tài lộc.",
            advice: "Enhance PMU elegantly based on golden ratio proportions and natural harmony."
        };
    }
}

module.exports = {
    analyzeFace
};