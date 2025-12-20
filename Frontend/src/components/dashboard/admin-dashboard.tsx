"use client";

import { useState } from "react";
import {
  Check,
  X,
  UserCircle,
  Shield,
  Calendar,
  Lock,
  Unlock,
  Download,
  FileJson,
  FileSpreadsheet,
  Eye,
  Users,
  CalendarCheck,
  Clock,
  TrendingUp,
  MessageCircle,
  UserPlus,
  Mail,
  Phone,
  Activity,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import type { Event, User, Post } from "@/src/lib/types";
import { adminApi } from "@/src/lib/api";

interface AdminDashboardProps {
  events: Event[];
  users: User[];
  posts: Post[];
  currentView: string;
  stats?: {
    totalUsers: number;
    approvedEvents: number;
    pendingEvents: number;
    activeUsers?: number;
    bannedUsers?: number;
  };
  onApprove: (eventId: string) => void;
  onReject: (eventId: string) => void;
  onViewDetails: (eventId: string) => void;
  onToggleUserStatus: (userId: string) => void;
}

export function AdminDashboard({
  events,
  users,
  posts,
  currentView,
  stats,
  onApprove,
  onReject,
  onViewDetails,
  onToggleUserStatus,
}: AdminDashboardProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);

  const pendingEvents = events.filter((e) => e?.status === "PENDING");
  const approvedEvents = events.filter((e) => e?.status === "APPROVED");
  const manageableUsers = users.filter((u) => u?.role !== "ADMIN");

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "EVENT_MANAGER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-emerald-100 text-emerald-800";
    }
  };

  const handleExportEvents = async (format: "csv" | "json") => {
    try {
      const blob =
        format === "csv"
          ? await adminApi.exportEventsCSV()
          : await adminApi.exportEventsJSON();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `events_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export events. Please try again.");
    }
  };

  const handleExportUsers = async (format: "csv" | "json") => {
    try {
      const blob =
        format === "csv"
          ? await adminApi.exportUsersCSV()
          : await adminApi.exportUsersJSON();

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export users. Please try again.");
    }
  };

  const handleViewUserDetails = (user: User) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

  // Mock data for user details
  const getUserStats = (user: User) => {
    if (user.role === "VOLUNTEER") {
      const userRegistrations = events
        .filter((e) => e?.registrations)
        .flatMap(
          (e) => e.registrations?.filter((r) => r?.user?.id === user.id) || []
        );
      const attended = userRegistrations.filter(
        (r) => r?.status === "ATTENDED"
      ).length;
      return {
        eventsAttended: attended,
        totalHours: attended * 4,
        eventsRegistered: userRegistrations.length,
      };
    } else if (user.role === "EVENT_MANAGER") {
      const createdEvents = events.filter((e) => e?.creator?.id === user.id);
      const approvedCreated = createdEvents.filter(
        (e) => e?.status === "APPROVED"
      ).length;
      return {
        eventsCreated: createdEvents.length,
        eventsApproved: approvedCreated,
      };
    }
    return {};
  };

  // Mock recent activity for user
  const getUserRecentActivity = (user: User) => {
    const activities: {
      action: string;
      date: string;
      icon: typeof Activity;
    }[] = [];

    // Check registrations
    events.forEach((event) => {
      event.registrations?.forEach((reg) => {
        if (reg?.user?.id === user.id) {
          activities.push({
            action: `Registered for "${event.title}"`,
            date: reg.registeredAt,
            icon: CalendarCheck,
          });
        }
      });
    });

    // Check posts
    posts.forEach((post) => {
      if (post?.author?.id === user.id) {
        const event = events.find((e) => e.id === post.eventId);
        activities.push({
          action: `Posted in "${event?.title || "Unknown Event"}"`,
          date: post.createdAt,
          icon: MessageCircle,
        });
      }
    });

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  // Calculate trending events (by registrations and posts)
  const getTrendingEvents = () => {
    return approvedEvents
      .map((event) => {
        const recentRegistrations = (event.registrations || []).filter((r) => {
          const regDate = new Date(r.registeredAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return regDate > weekAgo;
        }).length;
        const eventPosts = posts.filter((p) => p?.eventId === event.id);
        const totalComments = eventPosts.reduce(
          (acc, p) => acc + (p?.comments?.length || 0),
          0
        );
        const totalLikes = eventPosts.reduce(
          (acc, p) => acc + (p?.likedBy?.length || 0),
          0
        );
        return {
          ...event,
          recentJoins: recentRegistrations,
          totalComments,
          totalLikes,
          engagement: recentRegistrations * 2 + totalComments + totalLikes,
        };
      })
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 3);
  };

  // Get recently approved events or events with new activity
  const getRelevantUpdates = () => {
    const updates: {
      event: Event;
      type: "approved" | "new_post";
      detail: string;
    }[] = [];

    // Recently approved events (mock: all approved events)
    approvedEvents.slice(0, 2).forEach((event) => {
      updates.push({
        event,
        type: "approved",
        detail: "Just Approved",
      });
    });

    // Events with recent posts
    const eventsWithPosts = approvedEvents.filter((event) =>
      posts.some((p) => p.eventId === event.id)
    );
    eventsWithPosts.slice(0, 2).forEach((event) => {
      const eventPosts = posts.filter((p) => p.eventId === event.id);
      updates.push({
        event,
        type: "new_post",
        detail: `${eventPosts.length} new post${
          eventPosts.length > 1 ? "s" : ""
        }`,
      });
    });

    return updates.slice(0, 4);
  };

  if (currentView === "overview") {
    // Sử dụng stats từ API nếu có, không thì fallback về đếm từ data
    const totalUsers = stats?.totalUsers || users.length;
    const totalActiveEvents = stats?.approvedEvents || approvedEvents.length;
    const pendingApprovalsCount = stats?.pendingEvents || pendingEvents.length;
    const trendingEvents = getTrendingEvents();
    const relevantUpdates = getRelevantUpdates();

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 rounded-full">
                  <CalendarCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Events</p>
                  <p className="text-2xl font-bold">{totalActiveEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold">{pendingApprovalsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section A: Relevant Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Relevant Updates
              </CardTitle>
              <CardDescription>
                Recently approved events and new activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relevantUpdates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No recent updates
                </p>
              ) : (
                <div className="space-y-3">
                  {relevantUpdates.map((update, index) => (
                    <div
                      key={`${update.event.id}-${index}`}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onViewDetails(update.event.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {update.event.imageUrl && (
                          <img
                            src={update.event.imageUrl}
                            alt={update.event.title}
                            className="h-10 w-10 rounded object-cover shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {update.event.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(
                              update.event.startTime
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          update.type === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }
                        variant="secondary"
                      >
                        {update.detail}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section B: Trending Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Events
              </CardTitle>
              <CardDescription>
                High engagement and popular events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendingEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No trending events
                </p>
              ) : (
                <div className="space-y-3">
                  {trendingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => onViewDetails(event.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {event.imageUrl && (
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="h-12 w-12 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {event.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.startTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className="bg-orange-100 text-orange-800 shrink-0"
                          variant="secondary"
                        >
                          Hot
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-3 w-3" />+{event.recentJoins}{" "}
                          joined
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {event.totalComments} comments
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentView === "users") {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">User Management</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleExportUsers("csv")}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExportUsers("json")}
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manageableUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={user.avatarUrl || "/placeholder.svg"}
                          />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getRoleBadgeColor(user.role)}
                        variant="secondary"
                      >
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          user.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 bg-transparent"
                          onClick={() => handleViewUserDetails(user)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        {user.status === "ACTIVE" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
                            onClick={() => onToggleUserStatus(user.id)}
                          >
                            <Lock className="h-4 w-4" />
                            Ban
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-green-600 hover:bg-green-50 hover:text-green-700 bg-transparent"
                            onClick={() => onToggleUserStatus(user.id)}
                          >
                            <Unlock className="h-4 w-4" />
                            Unban
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Detail Dialog */}
        <Dialog open={userDetailOpen} onOpenChange={setUserDetailOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                {/* Header: Avatar, Name, Role, Status */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedUser.avatarUrl || "/placeholder.svg"}
                    />
                    <AvatarFallback className="text-xl">
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedUser.name}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <Badge
                        className={getRoleBadgeColor(selectedUser.role)}
                        variant="secondary"
                      >
                        {selectedUser.role.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          selectedUser.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Info Section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Contact Information
                  </h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>+1 (555) 123-4567</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined January 2025</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stats Section */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Statistics
                  </h4>
                  {selectedUser.role === "VOLUNTEER" ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">
                          {getUserStats(selectedUser).eventsAttended || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Events Attended
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {getUserStats(selectedUser).totalHours || 0}h
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Hours
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">
                          {getUserStats(selectedUser).eventsRegistered || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Registered
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {getUserStats(selectedUser).eventsCreated || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Events Created
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-emerald-600">
                          {getUserStats(selectedUser).eventsApproved || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Events Approved
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Recent Activity */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Recent Activity
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {getUserRecentActivity(selectedUser).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No recent activity
                      </p>
                    ) : (
                      getUserRecentActivity(selectedUser).map(
                        (activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 text-sm p-2 bg-muted/30 rounded"
                          >
                            <activity.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{activity.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (currentView === "approved-events") {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Approved Events</h1>
        </div>

        {approvedEvents.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No approved events found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {approvedEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {event.imageUrl && (
                      <div className="shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-24 w-24 rounded-md object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge
                          className="bg-emerald-100 text-emerald-800"
                          variant="secondary"
                        >
                          APPROVED
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(event.startTime).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-4 w-4" />
                          {event.creator.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.registrations?.length || 0} participants
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => onViewDetails(event.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Event Approval Queue (existing code)
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Event Approval Queue</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleExportEvents("csv")}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleExportEvents("json")}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              Export JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No events pending approval.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {event.imageUrl && (
                    <div className="shrink-0">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-24 w-24 rounded-md object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <Badge
                        className="bg-amber-100 text-amber-800"
                        variant="secondary"
                      >
                        PENDING
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.startTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCircle className="h-4 w-4" />
                        {event.creator.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => onViewDetails(event.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 bg-transparent"
                      onClick={() => onReject(event.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => onApprove(event.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
