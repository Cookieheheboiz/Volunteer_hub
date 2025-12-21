"use client";

import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Check,
  X,
  UserCheck,
  AlertTriangle,
  FileSpreadsheet,
  Filter,
  ShieldCheck, // <--- Mới thêm
  Ban, // <--- Mới thêm
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { uploadApi, eventApi } from "@/src/lib/api";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import type { Event, Post, User } from "@/src/lib/types";

interface EventDetailProps {
  event: Event;
  posts: Post[];
  currentUser: User;
  onBack: () => void;
  onJoin: (eventId: string) => void;
  onLeave: (eventId: string) => void;
  onCreatePost: (content: string, imageUrl?: string) => void;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (eventId: string) => void;
  onApproveRegistration?: (eventId: string, userId: string) => void;
  onRejectRegistration?: (eventId: string, userId: string) => void;
  onMarkAttended?: (eventId: string, userId: string) => void;

  // --- THÊM PROPS CHO ADMIN ---
  isAdmin?: boolean;
  onApproveEvent?: (eventId: string) => void;
  onRejectEvent?: (eventId: string) => void;
}

export function EventDetail({
  event,
  posts,
  currentUser,
  onBack,
  onJoin,
  onLeave,
  onCreatePost,
  onLikePost,
  onAddComment,
  onEdit,
  onDelete,
  onApproveRegistration,
  onRejectRegistration,
  onMarkAttended,
  // Destructure props admin
  isAdmin,
  onApproveEvent,
  onRejectEvent,
}: EventDetailProps) {
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState("");
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [expandedComments, setExpandedComments] = useState<
    Record<string, boolean>
  >({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {}
  );
  const [reportFilter, setReportFilter] = useState<
    "ALL" | "ATTENDED" | "APPROVED" | "PENDING"
  >("ALL");

  const isOwner = event.creator.id === currentUser.id;
  const isEventManager = currentUser.role === "EVENT_MANAGER";
  const isEventPast = new Date(event.startTime) < new Date();
  const isEventEnded = new Date(event.endTime) < new Date();

  // Determine event time status
  const now = new Date();
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  let eventTimeStatus: "upcoming" | "ongoing" | "past" = "upcoming";
  if (now >= endTime) {
    eventTimeStatus = "past";
  } else if (now >= startTime && now < endTime) {
    eventTimeStatus = "ongoing";
  }

  const handlePostImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPostImage(true);
      const url = await uploadApi.upload(file);
      setPostImage(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingPostImage(false);
    }
  };

  // Check current user's registration status
  const userRegistration = event.registrations.find(
    (r) => r.user.id === currentUser.id
  );
  const registrationStatus = userRegistration?.status;

  const pendingRegistrations = event.registrations.filter(
    (r) => r.status === "PENDING"
  );
  const confirmedRegistrations = event.registrations.filter(
    (r) => r.status === "APPROVED" || r.status === "ATTENDED"
  );

  const filteredRegistrations =
    reportFilter === "ALL"
      ? event.registrations
      : event.registrations.filter((r) => r.status === reportFilter);

  const handleSubmitPost = () => {
    if (newPost.trim() || postImage) {
      onCreatePost(newPost, postImage);
      setNewPost("");
      setPostImage("");
    }
  };

  const handleSubmitComment = (postId: string) => {
    const content = commentInputs[postId];
    if (content?.trim()) {
      onAddComment(postId, content);
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    });
  };

  const isSameDay = (date1: string, date2: string) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800";
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportReport = async () => {
    try {
      // Get filter status if any
      const statusFilter = reportFilter !== "ALL" ? reportFilter : undefined;

      const blob = await eventApi.exportEventRegistrationsCSV(
        event.id,
        statusFilter
      );

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `${event.title.replace(
        /[^a-z0-9]/gi,
        "_"
      )}_registrations_${timestamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export report:", error);
      alert("Failed to export report. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Button>

        {/* --- KHU VỰC BUTTON CỦA ADMIN --- */}
        {isAdmin && event.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => onApproveEvent?.(event.id)}
            >
              <ShieldCheck className="h-4 w-4" />
              Approve Event
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => onRejectEvent?.(event.id)}
            >
              <Ban className="h-4 w-4" />
              Reject
            </Button>
          </div>
        )}

        {/* Edit/Delete buttons for Event Manager who owns this event */}
        {isOwner && isEventManager && !isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit?.(event)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{event.title}"? This action
                    cannot be undone and will remove all associated posts and
                    registrations.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => onDelete?.(event.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {isOwner && isEventManager ? (
        <Tabs defaultValue="discussion" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="report">Report & Participants</TabsTrigger>
          </TabsList>

          <TabsContent value="discussion">{renderMainContent()}</TabsContent>

          <TabsContent value="report">{renderReportTab()}</TabsContent>
        </Tabs>
      ) : (
        renderMainContent()
      )}
    </div>
  );

  function renderMainContent() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Posts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Event Header Card */}
          <Card>
            <CardContent className="pt-6">
              {event.imageUrl && (
                <div className="mb-6 rounded-lg overflow-hidden border">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                  {eventTimeStatus === "upcoming" && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Upcoming
                    </Badge>
                  )}
                  {eventTimeStatus === "ongoing" && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-green-50 text-green-700 border-green-200"
                    >
                      Ongoing
                    </Badge>
                  )}
                  {eventTimeStatus === "past" && (
                    <Badge variant="outline" className="ml-2">
                      Past Event
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground">{event.description}</p>
            </CardContent>
          </Card>

          {/* Create Post */}
          {event.status === "APPROVED" && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage
                      src={currentUser.avatarUrl || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share something about this event..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    {postImage && (
                      <div className="mt-2 relative h-32 w-32 rounded-md overflow-hidden border">
                        <img
                          src={postImage}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => setPostImage("")}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <div className="relative">
                        <input
                          type="file"
                          id="post-image"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePostImageUpload}
                          disabled={uploadingPostImage}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            document.getElementById("post-image")?.click()
                          }
                          disabled={uploadingPostImage}
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          {uploadingPostImage ? "Uploading..." : "Add Image"}
                        </Button>
                      </div>
                      <Button
                        onClick={handleSubmitPost}
                        disabled={
                          (!newPost.trim() && !postImage) || uploadingPostImage
                        }
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts List */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No posts yet. Be the first to share something!
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => {
                const hasLiked = post.likedBy.includes(currentUser.id);
                return (
                  <Card key={post.id}>
                    <CardContent className="pt-4">
                      {/* Post Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar>
                          <AvatarImage
                            src={post.author.avatarUrl || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {post.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{post.author.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="mb-4">{post.content}</p>
                      {post.imageUrl && (
                        <div className="mb-4 rounded-md overflow-hidden border">
                          <img
                            src={post.imageUrl}
                            alt="Post content"
                            className="w-full h-auto max-h-96 object-cover"
                          />
                        </div>
                      )}

                      {/* Post Actions */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
                        <button
                          className={`flex items-center gap-1 transition-colors ${
                            hasLiked
                              ? "text-emerald-600"
                              : "hover:text-emerald-600"
                          }`}
                          onClick={() => onLikePost(post.id)}
                        >
                          <Heart
                            className={`h-4 w-4 ${
                              hasLiked ? "fill-current" : ""
                            }`}
                          />
                          {post.likedBy.length}
                        </button>
                        <button
                          className="flex items-center gap-1 hover:text-emerald-600"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          {post.comments.length}
                          {expandedComments[post.id] ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {/* Comments Section */}
                      {expandedComments[post.id] && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={
                                    comment.author.avatarUrl ||
                                    "/placeholder.svg"
                                  }
                                />
                                <AvatarFallback>
                                  {comment.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted rounded-lg p-2">
                                <p className="font-medium text-sm">
                                  {comment.author.name}
                                </p>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* Add Comment */}
                          <div className="flex gap-2 mt-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  currentUser.avatarUrl || "/placeholder.svg"
                                }
                              />
                              <AvatarFallback>
                                {currentUser.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-sm outline-none"
                                value={commentInputs[post.id] || ""}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleSubmitComment(post.id);
                                }}
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSubmitComment(post.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Event Info */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Event Details</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Start</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(event.startTime)} at{" "}
                    {formatTime(event.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">End</p>
                  <p className="text-sm text-muted-foreground">
                    {isSameDay(event.startTime, event.endTime)
                      ? formatTime(event.endTime)
                      : `${formatDate(event.endTime)} at ${formatTime(
                          event.endTime
                        )}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {confirmedRegistrations.length} Volunteer
                    {confirmedRegistrations.length !== 1 ? "s" : ""} Joined
                  </p>
                  {confirmedRegistrations.length > 0 && (
                    <div className="flex -space-x-2 mt-2">
                      {confirmedRegistrations.slice(0, 5).map((reg) => (
                        <Avatar
                          key={reg.user.id}
                          className="h-8 w-8 border-2 border-background"
                        >
                          <AvatarImage
                            src={reg.user.avatarUrl || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {reg.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {confirmedRegistrations.length > 5 && (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                          +{confirmedRegistrations.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join/Leave Button for non-owners */}
          {!isOwner && currentUser.role === "VOLUNTEER" && (
            <Card>
              <CardContent className="pt-4">
                {isEventEnded ? (
                  <div className="space-y-2">
                    {registrationStatus === "ATTENDED" && (
                      <Badge className="w-full justify-center py-2 bg-emerald-100 text-emerald-800 font-semibold">
                        ✓ Completed
                      </Badge>
                    )}
                    <Button className="w-full" disabled>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Event Has Ended
                    </Button>
                  </div>
                ) : registrationStatus === "PENDING" ? (
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-amber-500 hover:bg-amber-600"
                      disabled
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Request Sent / Pending Approval
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => onLeave(event.id)}
                      disabled={isEventPast}
                    >
                      Cancel Request
                    </Button>
                  </div>
                ) : registrationStatus === "APPROVED" ? (
                  <div className="space-y-2">
                    <div className="text-center text-emerald-600 font-medium py-2">
                      <Check className="inline mr-1 h-4 w-4" />
                      You are participating!
                    </div>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:bg-red-50 bg-transparent"
                      onClick={() => onLeave(event.id)}
                      disabled={isEventPast}
                    >
                      {isEventPast
                        ? "Cannot leave (Event in progress)"
                        : "Leave Event"}
                    </Button>
                  </div>
                ) : registrationStatus === "ATTENDED" ? (
                  <Badge className="w-full justify-center py-2 bg-purple-100 text-purple-800">
                    Completed
                  </Badge>
                ) : registrationStatus === "REJECTED" ? (
                  <Badge className="w-full justify-center py-2 bg-red-100 text-red-800">
                    Registration Rejected
                  </Badge>
                ) : isEventPast ? (
                  <Button className="w-full" disabled>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Event In Progress
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onJoin(event.id)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Request to Join
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Participant Management for Event Manager */}
          {isOwner && isEventManager && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold mb-3">Participant Management</h3>
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending" className="text-xs">
                      Pending ({pendingRegistrations.length})
                    </TabsTrigger>
                    <TabsTrigger value="confirmed" className="text-xs">
                      Confirmed ({confirmedRegistrations.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending" className="mt-3">
                    {pendingRegistrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No pending requests
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {pendingRegistrations.map((reg) => (
                          <div
                            key={reg.user.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={reg.user.avatarUrl || "/placeholder.svg"}
                                />
                                <AvatarFallback>
                                  {reg.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {reg.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {reg.user.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                                onClick={() =>
                                  onApproveRegistration?.(event.id, reg.user.id)
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() =>
                                  onRejectRegistration?.(event.id, reg.user.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="confirmed" className="mt-3">
                    {confirmedRegistrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No confirmed participants
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {confirmedRegistrations.map((reg) => (
                          <div
                            key={reg.user.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={reg.user.avatarUrl || "/placeholder.svg"}
                                />
                                <AvatarFallback>
                                  {reg.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {reg.user.name}
                                </p>
                                {reg.status === "ATTENDED" && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {/* Chỉ hiển thị nút Mark Attended khi: 
                                1. User là owner của event
                                2. Registration đã được APPROVED 
                                3. Sự kiện đã kết thúc (isEventEnded) */}
                            {isOwner &&
                              reg.status === "APPROVED" &&
                              isEventEnded && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs bg-green-50 hover:bg-green-100 border-green-200"
                                  onClick={() =>
                                    onMarkAttended?.(event.id, reg.user.id)
                                  }
                                  title="Xác nhận tình nguyện viên đã hoàn thành sự kiện"
                                >
                                  <UserCheck className="mr-1 h-3 w-3" />
                                  Mark Attended
                                </Button>
                              )}
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  function renderReportTab() {
    return (
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Participation Report</h3>
              <p className="text-sm text-muted-foreground">
                View and export volunteer participation data for "{event.title}"
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={reportFilter}
                  onValueChange={(value) =>
                    setReportFilter(value as typeof reportFilter)
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      All ({event.registrations.length})
                    </SelectItem>
                    <SelectItem value="ATTENDED">
                      Completed (
                      {
                        event.registrations.filter(
                          (r) => r.status === "ATTENDED"
                        ).length
                      }
                      )
                    </SelectItem>
                    <SelectItem value="APPROVED">
                      Registered (
                      {
                        event.registrations.filter(
                          (r) => r.status === "APPROVED"
                        ).length
                      }
                      )
                    </SelectItem>
                    <SelectItem value="PENDING">
                      Pending (
                      {
                        event.registrations.filter(
                          (r) => r.status === "PENDING"
                        ).length
                      }
                      )
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleExportReport}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Report (CSV)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No participants found with the selected filter.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Volunteer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((reg) => (
                    <TableRow key={reg.user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={reg.user.avatarUrl || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {reg.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{reg.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reg.user.email}
                      </TableCell>
                      <TableCell>
                        {new Date(reg.registeredAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            reg.status === "ATTENDED"
                              ? "bg-purple-100 text-purple-800"
                              : reg.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : reg.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {reg.status === "ATTENDED"
                            ? "Completed"
                            : reg.status === "APPROVED"
                            ? "Registered"
                            : reg.status === "PENDING"
                            ? "Pending"
                            : "Cancelled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.status === "PENDING" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                              onClick={() =>
                                onApproveRegistration?.(event.id, reg.user.id)
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-100"
                              onClick={() =>
                                onRejectRegistration?.(event.id, reg.user.id)
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {/* Hiển thị nút Mark Attended trong table khi sự kiện đã kết thúc */}
                        {reg.status === "APPROVED" && isEventEnded && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs bg-green-50 hover:bg-green-100 border-green-200"
                            onClick={() =>
                              onMarkAttended?.(event.id, reg.user.id)
                            }
                            title="Xác nhận tình nguyện viên đã hoàn thành sự kiện"
                          >
                            <UserCheck className="mr-1 h-3 w-3" />
                            Mark Attended
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{event.registrations.length}</p>
              <p className="text-sm text-muted-foreground">
                Total Registrations
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {
                  event.registrations.filter((r) => r.status === "APPROVED")
                    .length
                }
              </p>
              <p className="text-sm text-muted-foreground">Registered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {
                  event.registrations.filter((r) => r.status === "ATTENDED")
                    .length
                }
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {
                  event.registrations.filter((r) => r.status === "PENDING")
                    .length
                }
              </p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}
