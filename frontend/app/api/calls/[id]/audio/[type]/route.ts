import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string; type: string } }
    ) {
    // Получаем токен из заголовка Authorization или из cookie (если храните там)
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');

    if (!token) {
        // Попробуем взять из cookie (если вы сохраняете токен в cookie)
        const cookieToken = request.cookies.get('jwt_token')?.value;
        if (cookieToken) token = cookieToken;
    }

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const backendUrl = `http://localhost:8080/api/calls/${params.id}/audio/${params.type}`;

    try {
        const response = await fetch(backendUrl, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });

        if (!response.ok) {
        return NextResponse.json(
            { error: `Audio not available: ${response.status}` },
            { status: response.status }
        );
        }

        const audioBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'audio/wav';

        return new NextResponse(audioBuffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="audio_${params.id}_${params.type}.wav"`,
            'Cache-Control': 'no-cache',
        },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Internal proxy error' }, { status: 500 });
    }
}