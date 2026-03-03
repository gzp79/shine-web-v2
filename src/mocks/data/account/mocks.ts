import { HttpResponse, http } from 'msw';
import { authApiRoutes } from '@lib/server/api/authApiRoutes';

const mockSessions = {
    sessions: [
        {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            tokenHash: 'hash-session-1',
            fingerprint: 'fp-chrome-windows',
            createdAt: '2024-03-01T10:00:00Z',
            agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            country: 'US',
            region: 'California',
            city: 'San Francisco'
        },
        {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            tokenHash: 'hash-session-2',
            fingerprint: 'fp-safari-mac',
            createdAt: '2024-03-05T15:30:00Z',
            agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
            country: 'US',
            region: 'New York',
            city: 'New York'
        }
    ]
};

const mockTokens = {
    tokens: [
        {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            tokenHash: 'hash-token-1',
            kind: 'access',
            createdAt: '2024-03-01T10:00:00Z',
            expireAt: '2024-04-01T10:00:00Z',
            isExpired: false,
            agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            country: 'US',
            region: 'California',
            city: 'San Francisco'
        },
        {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            tokenHash: 'hash-token-2',
            kind: 'persistent',
            createdAt: '2021-08-01T12:00:00Z',
            expireAt: '2022-08-01T12:00:00Z',
            isExpired: true,
            agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)',
            country: null,
            region: null,
            city: null
        }
    ]
};

const mockIdentities = {
    links: [
        {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            provider: 'google',
            providerUserId: '123456789',
            linkedAt: '2024-01-15T00:00:00Z',
            name: 'John Doe',
            email: 'john@example.com'
        },
        {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            provider: 'github',
            providerUserId: 'gh-987654321',
            linkedAt: '2024-02-10T00:00:00Z',
            name: 'John Doe',
            email: 'john.doe@github.com'
        }
    ]
};

export const defaultActiveSessions = http.get(authApiRoutes.activeSessions(), () => {
    return HttpResponse.json(mockSessions, { status: 200 });
});

export const defaultActiveTokens = http.get(authApiRoutes.activeTokens(), () => {
    return HttpResponse.json(mockTokens, { status: 200 });
});

export const defaultLinkedIdentities = http.get(authApiRoutes.linkedIdentities(), () => {
    return HttpResponse.json(mockIdentities, { status: 200 });
});

export const revokeTokenHandler = http.delete(authApiRoutes.revokeToken(':tokenHash'), () => {
    return HttpResponse.json({}, { status: 200 });
});

export const revokeTokenFailureHandler = http.delete(authApiRoutes.revokeToken(':tokenHash'), () => {
    return HttpResponse.json({ message: 'Failed to revoke token' }, { status: 500 });
});

export const unlinkIdentityHandler = http.delete(authApiRoutes.unlinkIdentity(':provider', ':providerUserId'), () => {
    return HttpResponse.json({}, { status: 200 });
});
