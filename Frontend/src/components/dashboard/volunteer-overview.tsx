"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Badge } from "@/src/components/ui/badge"
import { Button } from "@/src//components/ui/button"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { Bell, Flame, TrendingUp, Users, MessageCircle, Calendar, Clock, MapPin, Award, Sparkles } from "lucide-react"
import type { Event, Post, User } from "@/src/lib/types"

interface VolunteerOverviewProps {
  events: Event[]
  posts: Post[]
  currentUser: User
  onViewDetails: (eventId: string) => void
}

export function VolunteerOverview({ events, posts, currentUser, onViewDetails }: VolunteerOverviewProps) {
  // Calculate stats
  const myRegistrations = events.filter((e) => e.registrations.some((r) => r.user.id === currentUser.id))
  const completedEvents = myRegistrations.filter((e) =>
    e.registrations.some((r) => r.user.id === currentUser.id && r.status === "ATTENDED"),
  )

  const totalHours = completedEvents.length * 3.5 // Mock: ~3.5 hours per event
  const eventsJoined = myRegistrations.length
  const impactScore = completedEvents.length * 100 + myRegistrations.length * 20

  // Get approved events for New & Noteworthy
  const approvedEvents = events.filter((e) => e.status === "APPROVED")

  // Get events with recent posts (New & Noteworthy)
  const eventsWithRecentPosts = approvedEvents
    .map((event) => {
      const eventPosts = posts.filter((p) => p.eventId === event.id)
      const latestPost = eventPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      const hasRecentPost = latestPost && new Date(latestPost.createdAt).getTime() > Date.now() - 48 * 60 * 60 * 1000 // Last 48 hours
      return { event, latestPost, hasRecentPost }
    })
    .filter(
      (item) => item.hasRecentPost || new Date(item.event.startTime).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ) // Also include newly created events
    .slice(0, 4)

  // Calculate trending events based on engagement
  const trendingEvents = approvedEvents
    .map((event) => {
      const eventPosts = posts.filter((p) => p.eventId === event.id)
      const totalLikes = eventPosts.reduce((sum, p) => sum + p.likedBy.length, 0)
      const totalComments = eventPosts.reduce((sum, p) => sum + p.comments.length, 0)
      const recentRegistrations = event.registrations.filter(
        (r) => new Date(r.registeredAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      ).length

      const engagementScore = totalLikes * 2 + totalComments * 3 + recentRegistrations * 10
      return { event, eventPosts, totalLikes, totalComments, recentRegistrations, engagementScore }
    })
    .filter((item) => item.engagementScore > 0)
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 4)

  // Get upcoming events user has joined
  const upcomingSchedule = myRegistrations
    .filter(
      (e) =>
        new Date(e.startTime).getTime() > Date.now() &&
        e.registrations.some((r) => r.user.id === currentUser.id && r.status === "APPROVED"),
    )
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3)

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

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Welcome back, {currentUser.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening in your volunteer journey</p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Hours Volunteered</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{totalHours.toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Across {completedEvents.length} events</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Events Joined</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{eventsJoined}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{completedEvents.length} completed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Impact Score</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{impactScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Keep it up!</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* New & Noteworthy Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">New & Noteworthy</h2>
            </div>
            {eventsWithRecentPosts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No new announcements at the moment
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eventsWithRecentPosts.map(({ event, latestPost }) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-32 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-emerald-600" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1 flex-1">{event.title}</h3>
                        {latestPost ? (
                          <Badge variant="default" className="ml-2 bg-green-600">
                            News Update
                          </Badge>
                        ) : (
                          <Badge variant="default" className="ml-2 bg-blue-600">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      {latestPost && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{latestPost.content}</p>
                      )}
                      <Button size="sm" onClick={() => onViewDetails(event.id)} className="w-full">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Trending Now Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-600" />
              <h2 className="text-xl font-semibold">Trending Now</h2>
            </div>
            {trendingEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No trending events at the moment
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trendingEvents.map(({ event, totalLikes, totalComments, recentRegistrations }) => (
                  <Card
                    key={event.id}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-2 border-orange-200"
                  >
                    <div className="h-32 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                      <TrendingUp className="h-12 w-12 text-orange-600" />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold line-clamp-1 flex-1">{event.title}</h3>
                        <Badge variant="default" className="ml-2 bg-orange-600">
                          <Flame className="mr-1 h-3 w-3" />
                          Hot
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {recentRegistrations > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">
                              +{recentRegistrations} joined this week
                            </span>
                          </div>
                        )}
                        {totalComments > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MessageCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600 font-medium">{totalComments} active discussions</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" onClick={() => onViewDetails(event.id)} className="w-full">
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Upcoming Schedule
              </CardTitle>
              <CardDescription>Events you've joined</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSchedule.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No upcoming events yet. Join an event to get started!
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {upcomingSchedule.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => onViewDetails(event.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-emerald-100 flex flex-col items-center justify-center">
                            <span className="text-xs font-medium text-emerald-700">
                              {new Date(event.startTime).toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-lg font-bold text-emerald-900">
                              {new Date(event.startTime).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">{event.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(event.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
