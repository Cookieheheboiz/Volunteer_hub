import type { User, Role, Event } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

// Helper function để gọi API với token
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = authApi.getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server không phản hồi đúng định dạng JSON");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Có lỗi xảy ra");
  }

  return data;
};

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server không phản hồi đúng định dạng JSON. Kiểm tra lại backend hoặc CORS."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng nhập thất bại");
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Không thể kết nối tới server. Kiểm tra backend đã chạy chưa."
        );
      }
      throw error;
    }
  },

  async register(
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server không phản hồi đúng định dạng JSON. Kiểm tra lại backend hoặc CORS."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Không thể kết nối tới server. Kiểm tra backend đã chạy chưa."
        );
      }
      throw error;
    }
  },

  saveToken(token: string) {
    localStorage.setItem("authToken", token);
  },

  getToken(): string | null {
    return localStorage.getItem("authToken");
  },

  removeToken() {
    localStorage.removeItem("authToken");
  },

  async getMe(): Promise<User> {
    try {
      return await fetchWithAuth(`${API_URL}/auth/me`);
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw error;
    }
  },

  // --- API Đổi mật khẩu mới thêm ---
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    try {
      return await fetchWithAuth(`${API_URL}/auth/change-password`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },
};

// ============ EVENT APIs ============
export const eventApi = {
  // Lấy tất cả events đã được approved
  async getAllEvents(): Promise<Event[]> {
    try {
      return await fetchWithAuth(`${API_URL}/events`);
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  },

  async getMyEvents(): Promise<Event[]> {
    try {
      return await fetchWithAuth(`${API_URL}/events/my/events`);
    } catch (error) {
      console.error("Error fetching my events:", error);
      throw error;
    }
  },

  // Lấy chi tiết 1 event
  async getEventById(eventId: string): Promise<Event> {
    try {
      return await fetchWithAuth(`${API_URL}/events/${eventId}`);
    } catch (error) {
      console.error("Error fetching event details:", error);
      throw error;
    }
  },

  // Tạo event mới (EVENT_MANAGER)
  async createEvent(eventData: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
  }): Promise<Event> {
    try {
      return await fetchWithAuth(`${API_URL}/events`, {
        method: "POST",
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  },

  // Đăng ký tham gia event (VOLUNTEER)
  async registerForEvent(
    eventId: string
  ): Promise<{ message: string; registration: any }> {
    try {
      return await fetchWithAuth(`${API_URL}/events/${eventId}/register`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error registering for event:", error);
      throw error;
    }
  },
};