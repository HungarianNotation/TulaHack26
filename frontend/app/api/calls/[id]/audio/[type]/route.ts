import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; type: string } },
) {
  const authHeader = request.headers.get("authorization");
  let token = authHeader?.replace("Bearer ", "");

  if (!token) {
    const cookieToken = request.cookies.get("jwt_token")?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const backendBaseUrl = process.env.BACKEND_URL || "http://localhost:8080";
  const backendUrl = `${backendBaseUrl}/api/calls/${params.id}/audio/${params.type}`;

  try {
    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // ВАЖНО: Отключаем кэширование в Next.js
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Audio not available: ${response.status}` },
        { status: response.status },
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "audio/wav";

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="audio_${params.id}_${params.type}.wav"`,
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate", // Принудительно запрещаем кэш браузеру
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Internal proxy error" },
      { status: 500 },
    );
  }
}
