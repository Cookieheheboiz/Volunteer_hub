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

// ============ ADMIN APIs ============
export const adminApi = {
  // Lấy tất cả events (bao gồm PENDING, APPROVED, REJECTED)
  async getAllEvents(): Promise<Event[]> {
    try {
      return await fetchWithAuth(`${API_URL}/admin/events`);
    } catch (error) {
      console.error("Error fetching all events:", error);
      throw error;
    }
  },

  // Lấy thống kê tổng quan
  async getStats(): Promise<{
    totalUsers: number;
    approvedEvents: number;
    pendingEvents: number;
    activeUsers: number;
    bannedUsers: number;
    usersByRole: {
      ADMIN?: number;
      EVENT_MANAGER?: number;
      VOLUNTEER?: number;
    };
  }> {
    try {
      return await fetchWithAuth(`${API_URL}/admin/stats`);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      throw error;
    }
  },

  // Lấy danh sách users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.role) queryParams.append("role", params.role);
      if (params?.search) queryParams.append("search", params.search);

      const url = `${API_URL}/admin/users${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      return await fetchWithAuth(url);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Toggle user status (khóa/mở khóa)
  async toggleUserStatus(
    userId: string
  ): Promise<{ message: string; user: User }> {
    try {
      return await fetchWithAuth(`${API_URL}/admin/users/${userId}/toggle-status`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error toggling user status:", error);
      throw error;
    }
  },

  // Approve event
  async approveEvent(
    eventId: string
  ): Promise<{ message: string; event: Event }> {
    try {
      return await fetchWithAuth(`${API_URL}/admin/events/${eventId}/approve`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error approving event:", error);
      throw error;
    }
  },

  // Reject event
  async rejectEvent(
    eventId: string
  ): Promise<{ message: string; event: Event }> {
    try {
      return await fetchWithAuth(`${API_URL}/admin/events/${eventId}/reject`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error rejecting event:", error);
      throw error;
    }
  },

  // Export events
  async exportEvents(): Promise<Blob> {
    try {
      const token = authApi.getToken();
      const response = await fetch(`${API_URL}/admin/export/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export events");
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting events:", error);
      throw error;
    }
  },
};

