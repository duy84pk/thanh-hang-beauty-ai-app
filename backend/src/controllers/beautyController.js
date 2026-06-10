/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const geminiService = require('../services/geminiService'); 

/**
 * Controller: Nhận số đo khuôn mặt VÀ ẢNH từ Frontend, gọi Gemini phân tích và trả về Prompt
 * Route: POST /api/v1/analyze-face
 */
exports.analyzeFaceAndGeneratePrompt = async (req, res) => {
    console.log("[Controller] Nhận yêu cầu phân tích dữ liệu...");
    try {
        // 1. Hứng thêm biến image từ Frontend gửi lên
        const { facialMetrics, gender, dob, image } = req.body;

        if (!facialMetrics) {
            return res.status(400).json({ 
                success: false, 
                message: 'Thiếu thông số tỷ lệ khuôn mặt để phân tích.' 
            });
        }

        // Báo cáo xem đã nhận được ảnh thành công chưa
        if (image) {
            console.log("[Controller] Đã nhận được hình ảnh khách hàng để phân tích Đa phương thức!");
        } else {
            console.log("[Controller] CẢNH BÁO: Không nhận được hình ảnh đính kèm!");
        }

        // 2. Truyền biến image vào hàm của Gemini
        const result = await geminiService.analyzeAndGeneratePrompt(facialMetrics, gender, dob, image);

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