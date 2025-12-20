"use client";

import { useState } from "react";
import { EventCard } from "@/src/components/events/event-card";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Calendar, MapPin, Clock, Check, X, UserCheck, Search, Filter } from "lucide-react";
import type { Event, User } from "@/src/lib/types";

interface VolunteerDashboardProps {
  events: Event[];
  currentView: string;
  currentUser: User;
  onViewDetails: (eventId: string) => void;
  onJoin: (eventId: string) => void;
}

export function VolunteerDashboard({
  events,
  currentView,
  currentUser,
  onViewDetails,
  onJoin,
}: VolunteerDashboardProps) {
  // 1. Thêm State cho Search và Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"nearest" | "furthest">("nearest");

  const approvedEvents = events.filter((e) => e?.status === "APPROVED");

  // 2. Logic lọc và sắp xếp cho tab Discover
  const filteredEvents = approvedEvents
    .filter((event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      if (sortOrder === "nearest") {
        return dateA - dateB; // Gần nhất trước
      } else {
        return dateB - dateA; // Xa nhất trước
      }
    });

  const myRegisteredEvents = events.filter((e) =>
    e.registrations?.some((r) => r.user.id === currentUser.id)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending Approval
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800">
            <Check className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "ATTENDED":
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <UserCheck className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (currentView === "history") {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">My Volunteer History</h1>
        {myRegisteredEvents.length === 0 ? (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              You haven't registered for any events yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Join an event to start building your history!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRegisteredEvents.map((event) => {
              const registration = event.registrations?.find(
                (r) => r?.user?.id === currentUser?.id
              );
              return (
                <Card
                  key={event.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onViewDetails(event.id)}
                >
                  {event.imageUrl && (
                    <div className="w-full h-32 overflow-hidden bg-muted">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold line-clamp-1">
                        {event.title}
                      </h3>
                      {registration && getStatusBadge(registration.status)}
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={event.creator.avatarUrl || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {event.creator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        by {event.creator.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Discover Events</h1>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Thanh tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search event name..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Bộ lọc thời gian */}
          <Select
            value={sortOrder}
            onValueChange={(value: "nearest" | "furthest") => setSortOrder(value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Sort by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nearest">Nearest First</SelectItem>
              <SelectItem value="furthest">Furthest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Hiển thị danh sách đã lọc (filteredEvents) thay vì approvedEvents */}
      {filteredEvents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            {searchQuery
              ? "No events found matching your search."
              : "No events available at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={onViewDetails}
              onJoin={onJoin}
              showJoinButton
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
