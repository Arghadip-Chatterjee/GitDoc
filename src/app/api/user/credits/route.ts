import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCreditStatus } from "@/lib/credits";

export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Get credit status
        const creditStatus = await getCreditStatus(userId);

        return NextResponse.json(creditStatus);

    } catch (error: any) {
        console.error("Credit status error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch credit status" },
            { status: 500 }
        );
    }
}
