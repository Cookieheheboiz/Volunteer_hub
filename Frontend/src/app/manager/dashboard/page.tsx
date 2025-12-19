"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/src/components/layout/navbar";
import { Sidebar } from "@/src/components/layout/sidebar";
import { ManagerDashboard } from "@/src/components/dashboard/manager-dashboard";
import { ManagerOverviewDashboard } from "@/src/components/dashboard/manager-overview-dashboard";
import { EventDetail } from "@/src/components/events/event-detail";
import { CreateEventModal } from "@/src/components/events/create-event-modal";
import { authApi, eventApi, postApi } from "@/src/lib/api";
import type { User, Event, Notification, Post } from "@/src/lib/types";
import { useToast } from "@/src/hooks/use-toast";
import { mockNotifications, mockPosts } from "@/src/lib/mock-data";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState("manager-overview");
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getMe();
        if (user.role !== "EVENT_MANAGER") {
          router.push("/");
          return;
        }
        setCurrentUser(user);
        loadEvents();
      } catch (error) {
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (selectedEventId) {
      loadPosts(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const data = await eventApi.getMyEvents();
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
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

  const handleApproveRegistration = async (eventId: string, userId: string) => {
    try {
      await eventApi.approveRegistration(eventId, userId);
      toast({
        title: "Thành công",
        description: "Đã duyệt đăng ký.",
      });
      loadEvents();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể duyệt đăng ký.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRegistration = async (eventId: string, userId: string) => {
    try {
      await eventApi.rejectRegistration(eventId, userId);
      toast({
        title: "Thành công",
        description: "Đã từ chối đăng ký.",
      });
      loadEvents();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể từ chối đăng ký.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAttended = async (eventId: string, userId: string) => {
    try {
      await eventApi.markAttended(eventId, userId);
      toast({
        title: "Thành công",
        description: "Đã xác nhận hoàn thành sự kiện cho tình nguyện viên.",
      });
      loadEvents();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xác nhận hoàn thành.",
        variant: "destructive",
      });
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      if (editingEvent) {
        await eventApi.updateEvent(editingEvent.id, eventData);
        toast({
          title: "Cập nhật sự kiện thành công",
          description: "Thông tin sự kiện đã được cập nhật.",
        });
      } else {
        await eventApi.createEvent(eventData);
        toast({
          title: "Tạo sự kiện thành công",
          description: "Sự kiện đang chờ duyệt.",
        });
      }
      await loadEvents();
      setShowCreateModal(false);
      setEditingEvent(null);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await eventApi.deleteEvent(eventId);
      toast({
        title: "Xóa sự kiện thành công",
        description: "Sự kiện đã được xóa khỏi hệ thống.",
      });
      setSelectedEventId(null);
      loadEvents();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa sự kiện",
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
            posts={posts}
            currentUser={currentUser}
            onBack={() => setSelectedEventId(null)}
            onJoin={() => {}}
            onLeave={() => {}}
            onCreatePost={handleCreatePost}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            onEdit={(event) => {
              setEditingEvent(event);
              setShowCreateModal(true);
            }}
            onDelete={handleDeleteEvent}
            onApproveRegistration={handleApproveRegistration}
            onRejectRegistration={handleRejectRegistration}
            onMarkAttended={handleMarkAttended}
          />
        ) : currentView === "manager-overview" ? (
          <ManagerOverviewDashboard
            events={events}
            posts={posts}
            notifications={notifications}
            currentUser={currentUser}
            onViewDetails={setSelectedEventId}
          />
        ) : (
          <ManagerDashboard
            events={events}
            currentUser={currentUser}
            currentView={currentView}
            onViewDetails={setSelectedEventId}
            onCreateEvent={() => setShowCreateModal(true)}
          />
        )}
      </main>

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingEvent(null);
        }}
        onCreate={handleCreateEvent}
        editingEvent={editingEvent}
      />
    </div>
  );
}
