/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const geminiService = require('../services/geminiService'); 

/**
 * Controller: Nhận số đo khuôn mặt từ MediaPipe, gọi Gemini phân tích và trả về Prompt
 * Route: POST /api/analyze-face
 */
exports.analyzeFaceAndGeneratePrompt = async (req, res) => {
    console.log("[Controller] Nhận yêu cầu phân tích thông số MediaPipe...");
    try {
        const { facialMetrics, gender, dob } = req.body;

        if (!facialMetrics) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông số tỷ lệ khuôn mặt để phân tích.' 
            });
        }

        // Gọi Gemini Service xử lý
        const result = await geminiService.analyzeAndGeneratePrompt(facialMetrics, gender, dob);

        if (!result) {
            throw new Error("AI không trả về dữ liệu.");
        }

        console.log("[Controller] Hoàn tất lên kịch bản tư vấn và Prompt.");
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("[Lỗi analyzeFaceAndGeneratePrompt]:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi máy chủ: " + error.message 
        });
    }
};