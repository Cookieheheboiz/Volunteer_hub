import type { User, Role, Event, Post } from "./types";

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
    const text = await response.text();
    throw new Error(
      `Server không phản hồi đúng định dạng JSON. Có thể do lỗi 404 hoặc 500. Nội dung: ${text.substring(
        0,
        100
      )}`
    );
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
    // Thêm kiểm tra window để tránh lỗi khi render phía server (Next.js) - Logic của HEAD
    if (typeof window === "undefined") return null;
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

  // --- API Đổi mật khẩu (Giữ lại từ HEAD) ---
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
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

// ============ ADMIN APIs (Sử dụng version đầy đủ từ Main) ============
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
      return await fetchWithAuth(
        `${API_URL}/admin/users/${userId}/toggle-status`,
        {
          method: "PATCH",
        }
      );
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

  // Export events to CSV
  async exportEventsCSV(status?: string): Promise<Blob> {
    try {
      const token = authApi.getToken();
      const queryParams = new URLSearchParams();
      if (status) queryParams.append("status", status);

      const url = `${API_URL}/admin/export/events/csv${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export events to CSV");
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting events to CSV:", error);
      throw error;
    }
  },

  // Export events to JSON
  async exportEventsJSON(status?: string): Promise<Blob> {
    try {
      const token = authApi.getToken();
      const queryParams = new URLSearchParams();
      if (status) queryParams.append("status", status);

      const url = `${API_URL}/admin/export/events/json${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export events to JSON");
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting events to JSON:", error);
      throw error;
    }
  },

  // Export users to CSV
  async exportUsersCSV(params?: {
    role?: string;
    status?: string;
  }): Promise<Blob> {
    try {
      const token = authApi.getToken();
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append("role", params.role);
      if (params?.status) queryParams.append("status", params.status);

      const url = `${API_URL}/admin/export/users/csv${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export users to CSV");
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting users to CSV:", error);
      throw error;
    }
  },

  // Export users to JSON
  async exportUsersJSON(params?: {
    role?: string;
    status?: string;
  }): Promise<Blob> {
    try {
      const token = authApi.getToken();
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append("role", params.role);
      if (params?.status) queryParams.append("status", params.status);

      const url = `${API_URL}/admin/export/users/json${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export users to JSON");
      }

      return await response.blob();
    } catch (error) {
      console.error("Error exporting users to JSON:", error);
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

  // Lấy tất cả sự kiện cho Admin (bao gồm PENDING)
  async getAdminEvents(): Promise<Event[]> {
    try {
      return await fetchWithAuth(`${API_URL}/events/admin/all`);
    } catch (error) {
      console.error("Error fetching admin events:", error);
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

  // Cập nhật event (EVENT_MANAGER)
  async updateEvent(
    eventId: string,
    eventData: {
      title: string;
      description: string;
      location: string;
      startTime: string;
      endTime: string;
    }
  ): Promise<Event> {
    try {
      return await fetchWithAuth(`${API_URL}/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  },

  // Xóa event (EVENT_MANAGER)
  async deleteEvent(eventId: string): Promise<{ message: string }> {
    try {
      return await fetchWithAuth(`${API_URL}/events/${eventId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
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

  // Hủy đăng ký tham gia event (VOLUNTEER)
  async cancelRegistration(eventId: string): Promise<{ message: string }> {
    try {
      return await fetchWithAuth(`${API_URL}/events/${eventId}/register`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error cancelling registration:", error);
      throw error;
    }
  },

  // Duyệt đăng ký (EVENT_MANAGER)
  async approveRegistration(eventId: string, userId: string): Promise<any> {
    try {
      return await fetchWithAuth(
        `${API_URL}/events/${eventId}/registrations/${userId}/approve`,
        {
          method: "PATCH",
        }
      );
    } catch (error) {
      console.error("Error approving registration:", error);
      throw error;
    }
  },

  // Từ chối đăng ký (EVENT_MANAGER)
  async rejectRegistration(eventId: string, userId: string): Promise<any> {
    try {
      return await fetchWithAuth(
        `${API_URL}/events/${eventId}/registrations/${userId}/reject`,
        {
          method: "PATCH",
        }
      );
    } catch (error) {
      console.error("Error rejecting registration:", error);
      throw error;
    }
  },
};

// ============ POST APIs (GỘP CẢ HAI) ============
export const postApi = {
  // Lấy danh sách bài viết của event (Dùng kiểu Post[] của Main)
  async getPostsByEvent(eventId: string): Promise<Post[]> {
    try {
      return await fetchWithAuth(`${API_URL}/posts/events/${eventId}/posts`);
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  },

  // Tạo bài viết mới (Giữ tính năng upload ảnh imageUrl của HEAD, nhưng trả về kiểu Post)
  async createPost(
    eventId: string,
    content: string,
    imageUrl?: string
  ): Promise<Post> {
    try {
      return await fetchWithAuth(`${API_URL}/posts/events/${eventId}/posts`, {
        method: "POST",
        body: JSON.stringify({ content, imageUrl }),
      });
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },

  // Thêm bình luận
  async addComment(postId: string, content: string): Promise<any> {
    try {
      return await fetchWithAuth(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },

  // Toggle like
  async toggleLike(postId: string): Promise<any> {
    try {
      return await fetchWithAuth(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      throw error;
    }
  },
};
