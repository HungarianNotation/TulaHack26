// mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type {
    AuthResponse,
    RegisterRequest,
    LoginRequest,
    CallRecordDto,
    CallDetailsDto,
    StatsResponse,
    RecordStatus,
    TranscriptSegmentDto,
    } from '@/services/types';

// --------------------- In-Memory Storage ---------------------
interface User {
    id: number;
    login: string;
    password: string;
    name?: string;
    company?: string;
    token: string;
}

interface CallRecord {
    id: number;
    userId: number;
    originalAudioPath: string;
    durationSeconds: number;
    status: RecordStatus;
    createdAt: string;
    segments?: TranscriptSegmentDto[];
}

// Глобальное состояние (сбрасывается при перезапуске dev-сервера)
let users: User[] = [];
let calls: CallRecord[] = [];
let nextUserId = 1;
let nextCallId = 1;

function findUserByLogin(login: string): User | undefined {
    return users.find((u) => u.login === login);
}

function findUserByToken(token: string): User | undefined {
    return users.find((u) => u.token === token);
}

function generateToken(): string {
    return `mock-jwt-${Date.now()}-${Math.random().toString(36)}`;
}

function extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }
    return null;
}

// Вспомогательная функция для проверки авторизации
function checkAuth(request: Request): User | HttpResponse {
    const token = extractTokenFromRequest(request);
    if (!token) {
        return new HttpResponse(null, { status: 401, statusText: 'Unauthorized' });
    }
    const user = findUserByToken(token);
    if (!user) {
        return new HttpResponse(null, { status: 401, statusText: 'Invalid token' });
    }
    return user;
}

function generateCallDetails(callId: number, userId: number): CallDetailsDto | null {
    const call = calls.find((c) => c.id === callId && c.userId === userId);
    if (!call) return null;

    if (!call.segments) {
        call.segments = [
        {
            id: 1,
            speakerId: 1,
            startTime: 0,
            endTime: 5.2,
            originalText: "Привет, меня зовут Джон, мой email john@example.com",
            redactedText: "Привет, меня зовут Джон, мой email [REDACTED]",
            containsPii: true,
            piiTypes: ["EMAIL"],
        },
        {
            id: 2,
            speakerId: 2,
            startTime: 5.2,
            endTime: 12.0,
            originalText: "Здравствуйте, номер вашего паспорта 1234 567890",
            redactedText: "Здравствуйте, номер вашего паспорта [REDACTED]",
            containsPii: true,
            piiTypes: ["PASSPORT"],
        },
        {
            id: 3,
            speakerId: 1,
            startTime: 12.0,
            endTime: 15.5,
            originalText: "Спасибо за информацию",
            redactedText: "Спасибо за информацию",
            containsPii: false,
            piiTypes: [],
        },
        ];
        call.status = "COMPLETED";
    }

    return {
        callRecord: {
        id: call.id,
        originalAudioPath: call.originalAudioPath,
        durationSeconds: call.durationSeconds,
        status: call.status,
        createdAt: call.createdAt,
        },
        segments: call.segments,
    };
}

// --------------------- Базовый URL для всех эндпоинтов ---------------------
const API_BASE_URL = 'http://localhost:8080/api';

// --------------------- MSW Handlers ---------------------
export const handlers = [
    // 1. Регистрация
    http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
        const body = (await request.json()) as RegisterRequest;
        const { login, password, name, company } = body;

        if (!login) {
        return HttpResponse.json({ error: 'Login is required' }, { status: 400 });
        }

        if (findUserByLogin(login)) {
        return HttpResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        const newUser: User = {
        id: nextUserId++,
        login,
        password: password || 'default123',
        name,
        company,
        token: generateToken(),
        };
        users.push(newUser);

        const response: AuthResponse = { token: newUser.token };
        return HttpResponse.json(response, { status: 201 });
    }),

    // 2. Логин
    http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        const body = (await request.json()) as LoginRequest;
        const { login, password } = body;

        const user = findUserByLogin(login);
        if (!user || (password && user.password !== password)) {
        return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Обновляем токен для имитации нового сеанса
        user.token = generateToken();

        const response: AuthResponse = { token: user.token };
        return HttpResponse.json(response);
    }),

    // 3. Защищённый тестовый эндпоинт
    http.get(`${API_BASE_URL}/test`, async ({ request }) => {
        const auth = checkAuth(request);
        if (auth instanceof HttpResponse) return auth;

        const testData = [
        { id: 1, name: 'Test entry 1', value: 42 },
        { id: 2, name: 'Test entry 2', value: 73 },
        ];
        return HttpResponse.json(testData);
    }),

    // 4. Загрузка аудиофайла
    http.post(`${API_BASE_URL}/calls/upload`, async ({ request }) => {
        const auth = checkAuth(request);
        if (auth instanceof HttpResponse) return auth;
        const user = auth as User;

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || !(file instanceof File)) {
        return HttpResponse.json({ error: 'File is required' }, { status: 400 });
        }

        const newCall: CallRecord = {
        id: nextCallId++,
        userId: user.id,
        originalAudioPath: `uploads/mock_${Date.now()}_${file.name}`,
        durationSeconds: Math.floor(Math.random() * 300) + 30,
        status: 'UPLOADED',
        createdAt: new Date().toISOString(),
        };
        calls.push(newCall);

        return HttpResponse.json({
        message: 'File uploaded successfully',
        callRecordId: newCall.id,
        });
    }),

    // 5. Получение всех звонков пользователя
    http.get(`${API_BASE_URL}/calls/my`, async ({ request }) => {
        const auth = checkAuth(request);
        if (auth instanceof HttpResponse) return auth;
        const user = auth as User;

        const userCalls = calls
        .filter((c) => c.userId === user.id)
        .map((c) => ({
            id: c.id,
            originalAudioPath: c.originalAudioPath,
            durationSeconds: c.durationSeconds,
            status: c.status,
            createdAt: c.createdAt,
        }));

        return HttpResponse.json(userCalls);
    }),

    // 6. Детали звонка (с транскриптом)
    http.get(`${API_BASE_URL}/calls/:id`, async ({ params, request }) => {
        const auth = checkAuth(request);
        if (auth instanceof HttpResponse) return auth;
        const user = auth as User;

        const callId = parseInt(params.id as string);
        if (isNaN(callId)) {
        return HttpResponse.json({ error: 'Invalid call ID' }, { status: 400 });
        }

        const details = generateCallDetails(callId, user.id);
        if (!details) {
        return HttpResponse.json({ error: 'Call not found' }, { status: 404 });
        }

        return HttpResponse.json(details);
    }),

    // 7. Скачивание анонимизированного аудио
    http.get(`${API_BASE_URL}/calls/:id/audio/redacted`, async ({ params, request }) => {
        const auth = checkAuth(request);
        if (auth instanceof HttpResponse) return auth;
        const user = auth as User;

        const callId = parseInt(params.id as string);
        const call = calls.find((c) => c.id === callId && c.userId === user.id);
        if (!call) {
        return HttpResponse.json({ error: 'Call not found' }, { status: 404 });
        }

        // Фиктивный аудио-буфер (100KB тишины)
        const dummyAudioBuffer = Buffer.alloc(1024 * 100);
        return new HttpResponse(dummyAudioBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'audio/wav',
            'Content-Disposition': `attachment; filename="redacted_${callId}.wav"`,
        },
        });
    }),

    // 8. Статистика
    http.get(`${API_BASE_URL}/calls/stats`, async ({ request }) => {
        const auth = checkAuth(request);
        if (auth instanceof HttpResponse) return auth;
        const user = auth as User;

        const userCalls = calls.filter((c) => c.userId === user.id);
        const totalCallsProcessed = userCalls.length;

        let totalPiiIncidentsFound = 0;
        const piiTypeDistribution: Record<string, number> = {};

        for (const call of userCalls) {
        if (call.segments) {
            for (const segment of call.segments) {
            if (segment.containsPii) {
                totalPiiIncidentsFound++;
                for (const piiType of segment.piiTypes) {
                piiTypeDistribution[piiType] = (piiTypeDistribution[piiType] || 0) + 1;
                }
            }
            }
        }
        }

        const stats: StatsResponse = {
        totalCallsProcessed,
        totalPiiIncidentsFound,
        piiTypeDistribution,
        };

        return HttpResponse.json(stats);
    }),
];