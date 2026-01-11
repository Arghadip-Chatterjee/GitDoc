import AnalysisDashboard from "@/components/AnalysisDashboard";
import UserNav from "@/components/UserNav";
import Link from "next/link";
import { ArrowRight, Github, Book, FileText, Share2, BrainCircuit } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="relative z-10">
        {/* Header with UserNav */}
        <div className="absolute top-4 right-4">
          <UserNav />
        </div>

        <div className="flex gap-4 mb-8 justify-center">
          {/* <Link href="/analyze" className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link> */}
          <Link href="/interview" className="px-8 py-4 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 border border-gray-700">
            Mock Interview <BrainCircuit className="w-4 h-4" />
          </Link>
        </div>
        <AnalysisDashboard />
      </div>
    </main>
  );
}
