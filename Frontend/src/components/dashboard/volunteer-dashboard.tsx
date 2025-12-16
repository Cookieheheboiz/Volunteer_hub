"use client";

import { EventCard } from "@/src/components/events/event-card";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar";
import { Calendar, MapPin, Clock, Check, X, UserCheck } from "lucide-react";
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
  const approvedEvents = events.filter((e) => e?.status === "APPROVED");

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
      <h1 className="text-2xl font-bold mb-6">Discover Events</h1>
      {approvedEvents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            No events available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {approvedEvents.map((event) => (
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
