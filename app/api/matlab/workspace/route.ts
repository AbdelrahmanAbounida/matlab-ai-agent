import { NextResponse } from "next/server";

export async function GET() {
  const bridgeUrl = process.env.MATLAB_BRIDGE_URL || "http://localhost:5000";

  try {
    const response = await fetch(`${bridgeUrl}/workspace`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch {
    // Bridge not available
  }

  // Demo mode response
  return NextResponse.json({
    success: true,
    variables: [
      { name: "x", type: "double", size: "1x100" },
      { name: "y", type: "double", size: "1x100" },
      { name: "signal", type: "double", size: "1x1000" },
      { name: "data", type: "struct", size: "1x1" },
      { name: "coefficients", type: "double", size: "1x5" },
    ],
    demoMode: true,
  });
}
