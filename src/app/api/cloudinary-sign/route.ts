
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

export async function POST() {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = await cloudinary.utils.api_sign_request(
        {
            timestamp: timestamp,
            folder: 'gitdoc_uploads'
        },
        process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });
}
