import { systemAutomatedSync } from "@/lib/ai-actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // 1. Secure authorization check for Vercel Cron
  // NOTE: You must set CRON_SECRET in your Vercel Environment Variables.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized Operational Access', { status: 401 });
  }

  try {
    console.log("Vercel Cron Triggered: Initiating 03:00 AM Strategic Pulse...");
    const result = await systemAutomatedSync();
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      mode: result.mode 
    });
  } catch (error) {
    console.error("Vercel Cron Failure:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Neural link disconnection during automated sync." 
    }, { status: 500 });
  }
}
