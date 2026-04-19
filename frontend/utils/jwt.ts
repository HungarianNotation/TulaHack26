export interface JwtPayload {
    sub?: string;
    login?: string;
    name?: string;
    company?: string;
    exp?: number;
    iat?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        
        console.log('🔐 Decoded JWT payload:', decoded);
        console.log('📋 Available fields:', Object.keys(decoded));
        
        return decoded;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
}