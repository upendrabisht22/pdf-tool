/**
 * @file auth/index.ts
 * @description Pluggable Authentication and Session Management Provider.
 */
import { TierQuotaLimits, UserTier } from '@doc-platform/core';
export interface UserSession {
    userId: string | null;
    sessionId: string;
    tier: UserTier;
    email?: string;
    organizationId?: string;
    quotas: TierQuotaLimits;
}
export interface AuthProvider {
    resolveSession(headers: Record<string, string | undefined>): Promise<UserSession>;
    verifyApiKey(apiKey: string): Promise<UserSession | null>;
}
export declare class DefaultAuthProvider implements AuthProvider {
    resolveSession(headers: Record<string, string | undefined>): Promise<UserSession>;
    verifyApiKey(apiKey: string): Promise<UserSession | null>;
}
//# sourceMappingURL=index.d.ts.map