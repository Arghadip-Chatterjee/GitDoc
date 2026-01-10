
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testMermaidUpload() {
    console.log("Checking Cloudinary Config...");
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error("Missing Cloudinary Env Vars (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)");
        // Try to debug what we have
        console.log("Env keys available:", Object.keys(process.env).filter(k => k.includes('CLOUD')));
        process.exit(1);
    }

    cloudinary.config({
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const mermaidCode = `graph TD
    A[Hard] -->|Text| B(Round)
    B --> C{Decision}
    C -->|One| D[Result 1]
    C -->|Two| E[Result 2]`;

    console.log("Mermaid Code:", mermaidCode);

    try {
        const base64Code = Buffer.from(mermaidCode).toString('base64');
        const mermaidImageUrl = `https://mermaid.ink/img/${base64Code}?bgColor=FFFFFF`;

        console.log("Generated Mermaid URL:", mermaidImageUrl);
        console.log("Attempting Upload to Cloudinary...");

        const uploadRes = await cloudinary.uploader.upload(mermaidImageUrl, {
            folder: "gitdoc_generated_diagrams_TEST",
            public_id: `TEST_DIAGRAM_${Date.now()}`
        });

        console.log("Upload Success!");
        console.log("Secure URL:", uploadRes.secure_url);

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testMermaidUpload();
