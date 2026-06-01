const { fal } = require("@fal-ai/client");

class FalService {
    constructor() {
        if (!process.env.FAL_KEY) console.warn("[CẢNH BÁO BẢO MẬT] Thiếu FAL_KEY trong .env");
    }

    async generatePortrait(base64Image, maskImage, categories, gender = 'Nu') {
        const workflowId = "fal-ai/flux/dev/image-to-image"; 
        
        try {
            let promptFeatures = [];
            let isMale = (gender === 'Nam');

            // SỬ DỤNG TỪ KHÓA CHUYÊN NGÀNH PHUN XĂM
            if (isMale) {
                if (categories.includes('eyebrows')) promptFeatures.push("healed male microblading, realistic individual hair strokes, sparse and natural, no blocky makeup");
                if (categories.includes('lips')) promptFeatures.push("healed dark lip correction tattoo, natural pale matte lips, realistic lip wrinkles, absolutely no lipstick");
            } else {
                if (categories.includes('eyebrows')) promptFeatures.push("healed hairstroke eyebrow tattoo, extremely fine individual hair strokes drawn with microblade, hyper-realistic hair texture, no blocky makeup");
                if (categories.includes('lips')) promptFeatures.push("healed aquarelle lip blush tattoo, soft powdery watercolor tint, natural lip wrinkles visible, matte finish, absolutely NO gloss, NO thick lipstick");
            }

            const inpaintPrompt = `Macro photography, extreme close up. Apply ONLY to the automated masked area: ${promptFeatures.join(', ')}. Raw unedited photo, natural lighting, perfect seamless edge blending.`;
            const negativePrompt = "lipstick, lip gloss, heavy makeup, blocky eyebrows, drawn on eyebrows, smooth skin, glossy skin, foundation, airbrushed, CGI, deformed, blurring outside mask";

            console.log(`[Google AI Mask + Flux] Đang xử lý vùng chọn tự động cho: ${gender.toUpperCase()}`);

            const aiPayload = {
                image_url: base64Image, 
                mask_url: maskImage,    // Nhận mặt nạ tự động từ Google MediaPipe gửi lên
                prompt: inpaintPrompt,
                negative_prompt: negativePrompt, 
                strength: 0.82,         // Đẩy lực mạnh để gẩy sợi rõ nét
                num_inference_steps: 35, 
                guidance_scale: 7.5,
                mask_blur: 0            // KHÓA CỨNG VIỀN: Tuyệt đối không phá nền da xung quanh
            };

            const aiProcess = fal.subscribe(workflowId, {
                input: aiPayload,
                logs: true
            });

            const timeoutProcess = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("TIME_OUT: Vượt quá thời gian chờ (35s)")), 35000);
            });

            const result = await Promise.race([aiProcess, timeoutProcess]);
            const finalImageUrl = result.image_url || result.image?.url || result.images?.[0]?.url || result.url || result.data?.images?.[0]?.url || (result.data && result.data[0]?.url);
            
            if (!finalImageUrl) throw new Error("Không tìm thấy URL ảnh từ Fal.ai.");
            return finalImageUrl;
            
        } catch (error) {
            console.error(`[Fal.ai Lỗi] ${error.message}`);
            throw error; 
        }
    }
}

module.exports = new FalService();