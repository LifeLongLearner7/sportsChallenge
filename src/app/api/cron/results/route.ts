import { systemResultSync, systemFootballResultSync } from "@/lib/ai-actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized Operational Access', { status: 401 });
  }

  try {
    console.log("Vercel Cron: Initiating 02:00 AM Match Result Pulse...");
    const result = await systemResultSync();
    await systemFootballResultSync();
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      mode: result.mode 
    });
  } catch (error) {
    console.error("Vercel Cron Failure:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Neural link disconnection during result sync." 
    }, { status: 500 });
  }
}
