"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { VolunteerDashboard } from "@/components/dashboard/volunteer-dashboard";
import { EventDetail } from "@/components/events/event-detail";
import { authApi, eventApi } from "@/lib/api";
import type { User, Event, Notification } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { mockNotifications, mockPosts } from "@/lib/mock-data";

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState("discover");
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getMe();
        if (user.role !== "VOLUNTEER") {
          router.push("/"); // Redirect if not volunteer
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
            posts={mockPosts.filter((p) => p.eventId === selectedEvent.id)}
            currentUser={currentUser}
            onBack={() => setSelectedEventId(null)}
            onJoin={handleJoin}
            onLeave={() => {}}
            onCreatePost={() => {}}
            onLikePost={() => {}}
            onAddComment={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
            onApproveRegistration={() => {}}
            onRejectRegistration={() => {}}
            onMarkAttended={() => {}}
          />
        ) : (
          <VolunteerDashboard
            events={events}
            currentView={currentView}
            currentUser={currentUser}
            onViewDetails={setSelectedEventId}
            onJoin={handleJoin}
          />
        )}
      </main>
    </div>
  );
}
