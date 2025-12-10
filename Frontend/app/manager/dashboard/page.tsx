"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { ManagerOverviewDashboard } from "@/components/dashboard/manager-overview-dashboard";
import { EventDetail } from "@/components/events/event-detail";
import { CreateEventModal } from "@/components/events/create-event-modal";
import { authApi, eventApi } from "@/lib/api";
import type { User, Event, Notification } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { mockNotifications, mockPosts } from "@/lib/mock-data";

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
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

  const handleCreateEvent = async (eventData: any) => {
    try {
      await eventApi.createEvent(eventData);
      await loadEvents();
      setShowCreateModal(false);
      toast({
        title: "Tạo sự kiện thành công",
        description: "Sự kiện đang chờ duyệt.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
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
            onJoin={() => {}}
            onLeave={() => {}}
            onCreatePost={() => {}}
            onLikePost={() => {}}
            onAddComment={() => {}}
            onEdit={(event) => {
              setEditingEvent(event);
              setShowCreateModal(true);
            }}
            onDelete={() => {}}
            onApproveRegistration={() => {}}
            onRejectRegistration={() => {}}
            onMarkAttended={() => {}}
          />
        ) : currentView === "manager-overview" ? (
          <ManagerOverviewDashboard
            events={events}
            posts={mockPosts}
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
