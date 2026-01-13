import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side authentication check
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/signin?callbackUrl=/dashboard");
    }

    return <>{children}</>;
}
