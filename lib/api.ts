import { API_CONFIG } from './config';

// Types
export interface SignupData {
    name: string;
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        token: string;
    };
}

export interface ApiError {
    success: false;
    message: string;
}

// API Client Class
class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const config: RequestInit = {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            };

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    success: false,
                    message: data.message || 'An error occurred',
                    status: response.status,
                };
            }

            return data;
        } catch (error: any) {
            // Network errors or other fetch failures
            if (error.success === false) {
                throw error;
            }

            throw {
                success: false,
                message: error.message || 'Network error. Please check your connection.',
            };
        }
    }

    // Authentication Methods
    async signup(data: SignupData): Promise<AuthResponse> {
        try {
            return await this.request<AuthResponse>(
                API_CONFIG.ENDPOINTS.AUTH.SIGNUP,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                }
            );
        } catch (error: any) {
            throw error;
        }
    }

    async login(data: LoginData): Promise<AuthResponse> {
        try {
            return await this.request<AuthResponse>(
                API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                {
                    method: 'POST',
                    body: JSON.stringify(data),
                }
            );
        } catch (error: any) {
            throw error;
        }
    }

    async generateCode(prompt: string, language: string, token: string, chatId?: number): Promise<any> {
        try {
            const body: any = { prompt, language };
            if (chatId) {
                body.chatId = chatId;
            }
            return await this.request(API_CONFIG.ENDPOINTS.GENERATE, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
        } catch (error: any) {
            throw error;
        }
    }

    async getChats(token: string): Promise<any> {
        try {
            return await this.request(API_CONFIG.ENDPOINTS.CHATS.LIST, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error: any) {
            throw error;
        }
    }

    async getChat(chatId: number, token: string): Promise<any> {
        try {
            return await this.request(API_CONFIG.ENDPOINTS.CHATS.DETAIL(chatId), {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error: any) {
            throw error;
        }
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Auth Service - Wrapper with additional logic
export class AuthService {
    private static TOKEN_KEY = 'auth_token';
    private static USER_KEY = 'user_data';

    static async signup(data: SignupData): Promise<AuthResponse> {
        try {
            const response = await apiClient.signup(data);

            if (response.success && response.data) {
                this.saveAuthData(response.data.token, response.data.user);
            }

            return response;
        } catch (error: any) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    static async login(data: LoginData): Promise<AuthResponse> {
        try {
            const response = await apiClient.login(data);

            if (response.success && response.data) {
                this.saveAuthData(response.data.token, response.data.user);
            }

            return response;
        } catch (error: any) {
            console.error('Login error:', error);
            throw error;
        }
    }



    static async getChats(): Promise<any> {
        const token = this.getToken();
        if (!token) return { success: false, message: 'Not authenticated' };
        try {
            return await apiClient.getChats(token);
        } catch (error: any) {
            console.error('Get chats error:', error);
            throw error;
        }
    }

    static async getChat(chatId: number): Promise<any> {
        const token = this.getToken();
        if (!token) return { success: false, message: 'Not authenticated' };
        try {
            return await apiClient.getChat(chatId, token);
        } catch (error: any) {
            console.error('Get chat error:', error);
            throw error;
        }
    }

    static async generateCode(prompt: string, language: string, chatId?: number): Promise<any> {
        const token = this.getToken();
        if (!token) return { success: false, message: 'Not authenticated' };
        try {
            return await apiClient.generateCode(prompt, language, token, chatId);
        } catch (error: any) {
            console.error('Generate code error:', error);
            throw error;
        }
    }

    static saveAuthData(token: string, user: User): void {
        try {
            // Save to localStorage for easy access
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));

            // Save to cookie for middleware support (expires in 7 days)
            const expires = new Date();
            expires.setDate(expires.getDate() + 7);
            document.cookie = `${this.TOKEN_KEY}=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
        } catch (error) {
            console.error('Failed to save auth data:', error);
        }
    }

    static getToken(): string | null {
        try {
            return localStorage.getItem(this.TOKEN_KEY);
        } catch (error) {
            console.error('Failed to get token:', error);
            return null;
        }
    }

    static getUser(): User | null {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Failed to get user data:', error);
            return null;
        }
    }

    static logout(): void {
        try {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.USER_KEY);
            // Clear cookie
            document.cookie = `${this.TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    }

    static isAuthenticated(): boolean {
        return !!this.getToken();
    }
}
