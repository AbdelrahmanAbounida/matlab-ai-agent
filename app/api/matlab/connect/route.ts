import { NextResponse } from "next/server";

export async function POST() {
  // In production, this would attempt to connect to the Python MATLAB bridge
  const bridgeUrl = process.env.MATLAB_BRIDGE_URL || "http://localhost:5000";

  try {
    const response = await fetch(`${bridgeUrl}/status`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        connected: true,
        version: data.matlabVersion || "MATLAB R2024a",
        bridgeVersion: data.bridgeVersion,
      });
    }
  } catch {
    // Bridge not available - return error
  }

  return NextResponse.json({
    connected: false,
    error: "No MATLAB detected. Make sure MATLAB is running and the bridge server is started.",
  });
}
