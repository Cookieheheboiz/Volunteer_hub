"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/src/components/layout/navbar";
import { Sidebar } from "@/src/components/layout/sidebar";
import { AdminDashboard } from "@/src/components/dashboard/admin-dashboard";
import { EventDetail } from "@/src/components/events/event-detail";
import { authApi, eventApi, postApi, adminApi } from "@/src/lib/api";
import type { User, Event, Notification, Post } from "@/src/lib/types";
import { useToast } from "@/src/hooks/use-toast";
import { mockNotifications, mockPosts, mockUsers } from "@/src/lib/mock-data";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    activeUsers: 0,
    bannedUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState("overview");
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      loadPosts(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getMe();
        if (user.role !== "ADMIN") {
          router.push("/");
          return;
        }
        setCurrentUser(user);
        loadEvents();
        loadUsers();
        loadStats();
      } catch (error) {
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  const loadEvents = async () => {
    try {
      const data = await eventApi.getAdminEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers({ limit: 100 });
      setUsers(data.users);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadPosts = async (eventId: string) => {
    try {
      const data = await postApi.getPostsByEvent(eventId);
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };



  const handleCreatePost = async (content: string) => {
    if (!selectedEventId) return;
    try {
      await postApi.createPost(selectedEventId, content);
      await loadPosts(selectedEventId);
      toast({
        title: "Đã đăng bài",
        description: "Bài viết của bạn đã được chia sẻ.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đăng bài",
        variant: "destructive",
      });
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await postApi.toggleLike(postId);
      if (selectedEventId) loadPosts(selectedEventId);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      await postApi.addComment(postId, content);
      if (selectedEventId) loadPosts(selectedEventId);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await adminApi.approveEvent(eventId);
      toast({
        title: "Thành công",
        description: "Đã duyệt sự kiện",
      });
      loadEvents();
      loadStats();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể duyệt sự kiện",
        variant: "destructive",
      });
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await adminApi.rejectEvent(eventId);
      toast({
        title: "Thành công",
        description: "Đã từ chối sự kiện",
      });
      loadEvents();
      loadStats();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối sự kiện",
        variant: "destructive",
      });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const result = await adminApi.toggleUserStatus(userId);
      toast({
        title: "Thành công",
        description: result.message,
      });
      // Reload cả users và stats
      await Promise.all([loadUsers(), loadStats()]);
    } catch (error: any) {
      console.error("Toggle user status error:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể cập nhật trạng thái user",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    authApi.removeToken();
    router.push("/");
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={currentUser}
        notifications={notifications}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onDeleteNotification={() => {}}
        onMarkAllNotificationsRead={() => {}}
      />

      <Sidebar
        role={currentUser.role}
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="p-4 md:p-6">
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            posts={posts.filter((p) => p.eventId === selectedEvent.id)}
            currentUser={currentUser}
            onBack={() => setSelectedEventId(null)}
            onJoin={() => {}}
            onLeave={() => {}}
            onCreatePost={handleCreatePost}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            onEdit={() => {}}
            onDelete={() => {}}
            onApproveRegistration={() => {}}
            onRejectRegistration={() => {}}
            onMarkAttended={() => {}}
          />
        ) : (
          <AdminDashboard
            events={events}
            users={users} // TODO: Fetch real users
            posts={posts}
            currentView={currentView}
            stats={stats}
            onApprove={handleApproveEvent}
            onReject={handleRejectEvent}
            onViewDetails={setSelectedEventId}
            onToggleUserStatus={handleToggleUserStatus}
          />
        )}
      </main>
    </div>
  );
}
