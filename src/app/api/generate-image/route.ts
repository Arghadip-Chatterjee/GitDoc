
import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        // Call OpenAI Image API with dall-e-3 model
        // Call OpenAI Responses API with gpt-5 model as requested
        const response: any = await (openai as any).responses.create({
            model: "gpt-5",
            input: prompt,
            tools: [{ type: "image_generation" }],
        });

        // Try to find image URL or Base64 in likely fields (Fallback logic)
        console.log("GPT-5 Response:", JSON.stringify(response, null, 2));
        const imageBase64 = response.image || response.data?.[0]?.b64_json || response.output?.[0]?.image || response.choices?.[0]?.message?.content;

        const imageBase64 = response.data?.[0]?.b64_json;
        if (!imageBase64) throw new Error("No image data returned from OpenAI");

        // Upload to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(
            `data:image/png;base64,${imageBase64}`,
            {
                folder: "gitdoc_generated",
            }
        );

        return NextResponse.json({ image: uploadResponse.secure_url });

    } catch (error: any) {
        console.error("Image Generation Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
