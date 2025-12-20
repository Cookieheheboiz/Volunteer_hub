"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/src/components/layout/navbar";
import { Sidebar } from "@/src/components/layout/sidebar";
// Giữ nguyên component AdminDashboard cũ để xử lý các tab cũ
import { AdminDashboard } from "@/src/components/dashboard/admin-dashboard"; 
import { EventDetail } from "@/src/components/events/event-detail";
// Import thêm EventCard
import { EventCard } from "@/src/components/events/event-card"; 
// 1. IMPORT THÊM SEARCH ICON VÀ INPUT
import { FileSpreadsheet, Download, ChevronDown, FileJson, Search } from "lucide-react"; 
import { Input } from "@/src/components/ui/input"; // Import Input
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

import { authApi, eventApi, postApi, adminApi } from "@/src/lib/api";
import type { User, Event, Notification, Post } from "@/src/lib/types";
import { useToast } from "@/src/hooks/use-toast";
import { mockNotifications } from "@/src/lib/mock-data";

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
  
  // State view hiện tại
  const [currentView, setCurrentView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState(""); // 2. STATE TÌM KIẾM
  
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
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

  // 2. HÀM XỬ LÝ EXPORT CHO DROPDOWN
  const handleExport = (type: "csv" | "json") => {
    const approvedEvents = events.filter((e) => e.status === "APPROVED");

    if (approvedEvents.length === 0) {
      toast({
        title: "No Data",
        description: "There are no approved events to export.",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `approved_events_${timestamp}`;
    
    let content = "";
    let mimeType = "";
    let extension = "";

    if (type === "json") {
      content = JSON.stringify(approvedEvents, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else {
      const headers = ["ID", "Title", "Date", "Location", "Creator", "Participants"];
      const rows = approvedEvents.map(e => {
        const date = new Date(e.startTime).toLocaleDateString();
        const clean = (text: string) => `"${(text || "").replace(/"/g, '""')}"`;
        return [
          clean(e.id),
          clean(e.title),
          clean(date),
          clean(e.location),
          clean(e.creator.name),
          e.registrations.filter(r => r.status === "APPROVED" || r.status === "ATTENDED").length
        ].join(",");
      });
      content = [headers.join(","), ...rows].join("\n");
      mimeType = "text/csv;charset=utf-8;";
      extension = "csv";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.${extension}`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Downloaded ${fileName}.${extension}`,
    });
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  
  // 3. LOGIC LỌC: CHỈ LẤY APPROVED & KẾT HỢP TÌM KIẾM
  const approvedEvents = events
    .filter((e) => e.status === "APPROVED")
    .filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={currentUser}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
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
            isAdmin={true}
            onApproveEvent={() => handleApproveEvent(selectedEvent.id)}
            onRejectEvent={() => handleRejectEvent(selectedEvent.id)}
          />
        ) : (
          <>
            {/* 1. XỬ LÝ RIÊNG TAB "APPROVED EVENTS" */}
            {currentView === "approved-events" ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-emerald-700">Approved Events</h1>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      {/* 4. THANH TÌM KIẾM MỚI */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search approved events..."
                          className="pl-9 bg-background"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* 3. DROPDOWN MENU EXPORT */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" />
                            Export Data
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleExport("csv")}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExport("json")}>
                            <FileJson className="mr-2 h-4 w-4" />
                            Export as JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {approvedEvents.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                      <p>
                        {searchQuery 
                          ? `No approved events found matching "${searchQuery}"`
                          : "No approved events found."}
                      </p>
                    </div>
                  ) : (
                    approvedEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        // Dùng onClick để xem chi tiết
                        onViewDetails={setSelectedEventId}
                        // Hiển thị tiếng Anh
                        actionLabel="View Details" 
                      />
                    ))
                  )}
                </div>
              </div>
            ) : (
              // 2. CÁC VIEW CÒN LẠI (Overview, Approval Queue, Users) -> ĐỂ COMPONENT CŨ XỬ LÝ
              <AdminDashboard
                events={events}
                users={users}
                posts={posts}
                currentView={currentView}
                stats={stats}
                onApprove={handleApproveEvent}
                onReject={handleRejectEvent}
                onViewDetails={setSelectedEventId}
                onToggleUserStatus={handleToggleUserStatus}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}