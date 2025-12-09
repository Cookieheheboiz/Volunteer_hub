"use client"

import { useState } from "react"
import { PlusCircle, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventCard } from "@/components/events/event-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Event, User, EventStatus } from "@/lib/types"

interface ManagerDashboardProps {
  events: Event[]
  currentUser: User
  currentView: string
  onViewDetails: (eventId: string) => void
  onCreateEvent: () => void
}

type FilterOption = "ALL" | EventStatus

export function ManagerDashboard({ events, currentUser, onViewDetails, onCreateEvent }: ManagerDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<FilterOption>("ALL")

  const myEvents = events.filter((e) => e.creator.id === currentUser.id)

  const filteredEvents = statusFilter === "ALL" ? myEvents : myEvents.filter((e) => e.status === statusFilter)

  // Stats for quick overview
  const stats = {
    total: myEvents.length,
    pending: myEvents.filter((e) => e.status === "PENDING").length,
    approved: myEvents.filter((e) => e.status === "APPROVED").length,
    rejected: myEvents.filter((e) => e.status === "REJECTED").length,
  }

  const getFilterLabel = (filter: FilterOption) => {
    switch (filter) {
      case "ALL":
        return "All Events"
      case "PENDING":
        return "Pending Approval"
      case "APPROVED":
        return "Approved/Published"
      case "REJECTED":
        return "Rejected"
      default:
        return filter
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Events</h1>
        <p className="text-muted-foreground mt-1">Manage and track all your created events</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Events</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterOption)}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Events ({stats.total})</SelectItem>
              <SelectItem value="PENDING">Pending Approval ({stats.pending})</SelectItem>
              <SelectItem value="APPROVED">Approved/Published ({stats.approved})</SelectItem>
              <SelectItem value="REJECTED">Rejected ({stats.rejected})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onCreateEvent}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Event
        </Button>
      </div>

      {myEvents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-12 text-center border-2 border-dashed">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-6">
            You haven't created any events. Get started by creating your first event!
          </p>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onCreateEvent}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Your First Event
          </Button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No events found with status "{getFilterLabel(statusFilter)}".</p>
          <Button variant="link" className="mt-2 text-emerald-600" onClick={() => setStatusFilter("ALL")}>
            View all events
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onViewDetails={onViewDetails} showJoinButton={false} />
          ))}
        </div>
      )}
    </div>
  )
}
