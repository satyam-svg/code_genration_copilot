// API Configuration
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://code-generation-copilot-backend-1.onrender.com/api/v1',
    ENDPOINTS: {
        AUTH: {
            SIGNUP: '/auth/signup',
            LOGIN: '/auth/login',
        },
        GENERATE: '/generate',
        CHATS: {
            LIST: '/chats',
            DETAIL: (id: number) => `/chats/${id}`,
        },
    },
} as const;
