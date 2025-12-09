"use client"

import { Calendar, MapPin, Clock, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Event, User as UserType } from "@/lib/types"

interface EventCardProps {
  event: Event
  onViewDetails: (eventId: string) => void
  onJoin?: (eventId: string) => void
  showJoinButton?: boolean
  currentUser?: UserType
}

export function EventCard({ event, onViewDetails, onJoin, showJoinButton = true, currentUser }: EventCardProps) {
  const confirmedCount = event.registrations.filter((r) => r.status === "APPROVED" || r.status === "ATTENDED").length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800"
      case "PENDING":
        return "bg-amber-100 text-amber-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "ONGOING":
        return "bg-blue-100 text-blue-800"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const userRegistration = currentUser ? event.registrations.find((r) => r.user.id === currentUser.id) : null

  const isPastEvent = new Date(event.startTime) < new Date()

  const isSameDay = (start: string, end: string) => {
    const startDate = new Date(start).toDateString()
    const endDate = new Date(end).toDateString()
    return startDate === endDate
  }

  const renderJoinButton = () => {
    if (!showJoinButton || event.status !== "APPROVED" || !onJoin) return null

    if (isPastEvent) {
      return (
        <Button className="flex-1" disabled>
          Event Ended
        </Button>
      )
    }

    if (userRegistration) {
      switch (userRegistration.status) {
        case "PENDING":
          return (
            <Button className="flex-1 bg-amber-500 hover:bg-amber-600" disabled>
              Pending Approval
            </Button>
          )
        case "APPROVED":
          return (
            <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled>
              Joined
            </Button>
          )
        case "ATTENDED":
          return (
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700" disabled>
              Completed
            </Button>
          )
        case "REJECTED":
          return (
            <Button className="flex-1 bg-red-500 hover:bg-red-600" disabled>
              Rejected
            </Button>
          )
      }
    }

    return (
      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => onJoin(event.id)}>
        Join
      </Button>
    )
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
          <Badge className={getStatusColor(event.status)} variant="secondary">
            {event.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">Start:</span>
            <span>
              {formatDate(event.startTime)}, {formatTime(event.startTime)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">End:</span>
            {isSameDay(event.startTime, event.endTime) ? (
              <span>{formatTime(event.endTime)}</span>
            ) : (
              <span>
                {formatDate(event.endTime)}, {formatTime(event.endTime)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">by {event.creator.name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {confirmedCount} participant{confirmedCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onViewDetails(event.id)}>
          View Details
        </Button>
        {renderJoinButton()}
      </CardFooter>
    </Card>
  )
}
