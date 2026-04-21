import { vi } from 'vitest';

// Shared Mocks

export const mockDb = {
    insert: vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn(() => [{ id: 'test-id', serverId: 'server-1', channelId: 'channel-1', userId: 'user-1' }])
        }))
    })),
    query: {
        memberTable: {
            findFirst: vi.fn(),
            findMany: vi.fn(() => []),
        },
        channelTable: {
            findMany: vi.fn(() => []),
            findFirst: vi.fn(),
        },
        serverTable: {
            findFirst: vi.fn(),
            findMany: vi.fn(() => []),
        },
        messageTable: {
            findMany: vi.fn(() => []),
        }
    },
    update: vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'test-id' }])
            }))
        }))
    })),
    delete: vi.fn(() => ({
        where: vi.fn(() => ({
            returning: vi.fn(() => [{ id: 'test-id' }])
        }))
    }))
};

vi.mock('$lib/server/db', () => ({
    db: mockDb
}));

vi.mock('$lib/server/utils/session-checker', () => ({
    requireAuth: vi.fn(() => ({ id: 'user-1', email: 'test@example.com', name: 'testuser' }))
}));

vi.mock('$lib/server/utils/cloudinary', () => ({
    uploadToCloudinary: vi.fn(() => Promise.resolve({ url: 'http://cloudinary.com/test.png' })),
    deleteFromCloudinary: vi.fn(() => Promise.resolve()),
    extractPublicId: vi.fn(() => 'public-id')
}));

vi.mock('$app/server', () => ({
    form: (schema: any, fn: any) => fn,
    query: (schema: any, fn: any) => fn
}));

vi.mock('@sveltejs/kit', () => ({
    error: vi.fn((status, message) => { throw new Error(`${status}: ${message}`); }),
    redirect: vi.fn((status, location) => { throw new Error(`REDIRECT: ${location}`); })
}));
