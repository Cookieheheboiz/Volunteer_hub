"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/src/components/layout/navbar";
import { Sidebar } from "@/src/components/layout/sidebar";
import { VolunteerDashboard } from "@/src/components/dashboard/volunteer-dashboard";
import { EventDetail } from "@/src/components/events/event-detail";
// 1. IMPORT COMPONENT V0
import { VolunteerOverview } from "@/src/components/dashboard/volunteer-overview";

import { authApi, eventApi, postApi } from "@/src/lib/api";
import type { User, Event, Notification, Post } from "@/src/lib/types";
import { useToast } from "@/src/hooks/use-toast";
import { mockNotifications } from "@/src/lib/mock-data";

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // 2. Mặc định vào Overview
  const [currentView, setCurrentView] = useState("overview");

  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getMe();
        if (user.role !== "VOLUNTEER") {
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
      const data = await eventApi.getAllEvents();
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

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    if (!selectedEventId) return;
    try {
      await postApi.createPost(selectedEventId, content, imageUrl);
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

  const handleJoin = async (eventId: string) => {
    try {
      await eventApi.registerForEvent(eventId);
      await loadEvents();
      toast({
        title: "Đăng ký thành công",
        description: "Yêu cầu của bạn đã được gửi.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể đăng ký sự kiện",
        variant: "destructive",
      });
    }
  };

  const handleLeave = async (eventId: string) => {
    try {
      await eventApi.cancelRegistration(eventId);
      await loadEvents();
      toast({
        title: "Đã hủy đăng ký",
        description: "Bạn đã hủy đăng ký tham gia sự kiện.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể hủy đăng ký",
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
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onUpdateUser={setCurrentUser}
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
            onJoin={handleJoin}
            onLeave={handleLeave}
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
          /* PHẦN ĐIỀU HƯỚNG VIEW */
          <>
            {currentView === "overview" ? (
              // 3. SỬA LẠI PHẦN TRUYỀN PROPS Ở ĐÂY
              <VolunteerOverview
                events={events} // Truyền danh sách sự kiện thật
                posts={posts} // Truyền danh sách bài viết thật
                currentUser={currentUser!} // Dấu ! để khẳng định user đã tồn tại
                onViewDetails={setSelectedEventId} // Kết nối hàm chuyển trang
              />
            ) : (
              // Nếu chọn Discover/History -> Hiện Dashboard cũ
              <VolunteerDashboard
                events={events}
                currentView={currentView}
                currentUser={currentUser}
                onViewDetails={setSelectedEventId}
                onJoin={handleJoin}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
