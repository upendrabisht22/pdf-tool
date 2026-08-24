"use strict";
/**
 * @file auth/index.ts
 * @description Pluggable Authentication and Session Management Provider.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAuthProvider = void 0;
const core_1 = require("@doc-platform/core");
class DefaultAuthProvider {
    async resolveSession(headers) {
        const authHeader = headers['authorization'];
        const sessionCookie = headers['x-session-id'] || headers['cookie'];
        // In production, verifies JWT with Supabase Auth or custom JWT
        if (authHeader && authHeader.startsWith('Bearer ey')) {
            return {
                userId: 'usr_pro_demo',
                sessionId: 'sess_authenticated',
                tier: 'PRO',
                email: 'user@example.com',
                quotas: core_1.TIER_LIMITS.PRO,
            };
        }
        // Default to secure anonymous session
        const sessionId = (typeof sessionCookie === 'string' && sessionCookie.length > 5)
            ? sessionCookie
            : `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        return {
            userId: null,
            sessionId,
            tier: 'ANONYMOUS',
            quotas: core_1.TIER_LIMITS.ANONYMOUS,
        };
    }
    async verifyApiKey(apiKey) {
        if (apiKey.startsWith('dp_live_')) {
            return {
                userId: 'usr_api_developer',
                sessionId: 'sess_api',
                tier: 'BUSINESS',
                quotas: core_1.TIER_LIMITS.BUSINESS,
            };
        }
        return null;
    }
}
exports.DefaultAuthProvider = DefaultAuthProvider;
//# sourceMappingURL=index.js.map