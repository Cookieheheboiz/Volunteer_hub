"use client"

import { TrendingUp, Users, Clock, CheckCircle, MessageSquare, ArrowRight, Flame } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Event, Post, Notification, User } from "@/lib/types"

interface ManagerOverviewDashboardProps {
  events: Event[]
  posts: Post[]
  notifications: Notification[]
  currentUser: User
  onViewDetails: (eventId: string) => void
}

export function ManagerOverviewDashboard({
  events,
  posts,
  notifications,
  currentUser,
  onViewDetails,
}: ManagerOverviewDashboardProps) {
  const myEvents = events.filter((e) => e.creator.id === currentUser.id)
  const approvedEvents = myEvents.filter((e) => e.status === "APPROVED")
  const pendingEvents = myEvents.filter((e) => e.status === "PENDING")

  // Calculate total active volunteers (approved registrations)
  const totalActiveVolunteers = myEvents.reduce(
    (sum, event) => sum + event.registrations.filter((r) => r.status === "APPROVED" || r.status === "ATTENDED").length,
    0,
  )

  // Calculate pending approvals (pending registrations across all events)
  const pendingApprovals = myEvents.reduce(
    (sum, event) => sum + event.registrations.filter((r) => r.status === "PENDING").length,
    0,
  )

  // Get trending/high engagement events (sorted by registrations + posts)
  const trendingEvents = approvedEvents
    .map((event) => {
      const eventPosts = posts.filter((p) => p.eventId === event.id)
      const totalComments = eventPosts.reduce((sum, p) => sum + p.comments.length, 0)
      const totalLikes = eventPosts.reduce((sum, p) => sum + p.likedBy.length, 0)
      const recentRegistrations = event.registrations.filter((r) => {
        const regDate = new Date(r.registeredAt)
        const today = new Date()
        const diffDays = Math.floor((today.getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays <= 7
      }).length

      return {
        ...event,
        postsCount: eventPosts.length,
        commentsCount: totalComments,
        likesCount: totalLikes,
        recentRegistrations,
        engagementScore: event.registrations.length * 3 + eventPosts.length * 2 + totalComments + totalLikes,
      }
    })
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 4)

  // Get relevant updates (notifications for this user)
  const userNotifications = notifications
    .filter((n) => n.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Create activity items from events
  const recentActivity = [
    ...myEvents
      .filter((e) => e.status === "APPROVED")
      .map((event) => ({
        id: `approved-${event.id}`,
        type: "approved" as const,
        eventId: event.id,
        eventTitle: event.title,
        message: `Event "${event.title}" was just Approved by Admin.`,
        time: new Date().toISOString(),
      })),
    ...myEvents
      .filter((e) => {
        const eventPosts = posts.filter((p) => p.eventId === e.id)
        return eventPosts.length > 0
      })
      .map((event) => {
        const eventPosts = posts.filter((p) => p.eventId === event.id)
        return {
          id: `posts-${event.id}`,
          type: "posts" as const,
          eventId: event.id,
          eventTitle: event.title,
          message: `Event "${event.title}" has ${eventPosts.length} new posts.`,
          time: eventPosts[0]?.createdAt || new Date().toISOString(),
        }
      }),
    ...myEvents
      .filter((e) => e.registrations.some((r) => r.status === "PENDING"))
      .map((event) => {
        const pendingCount = event.registrations.filter((r) => r.status === "PENDING").length
        return {
          id: `pending-${event.id}`,
          type: "pending" as const,
          eventId: event.id,
          eventTitle: event.title,
          message: `Event "${event.title}" has ${pendingCount} pending registration(s).`,
          time: new Date().toISOString(),
        }
      }),
  ].slice(0, 6)

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your events.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events Created</p>
                <p className="text-3xl font-bold">{myEvents.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Active Volunteers</p>
                <p className="text-3xl font-bold">{totalActiveVolunteers}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-3xl font-bold">{pendingApprovals}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: Trending & High Engagement */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <CardTitle>Trending & High Engagement</CardTitle>
              </div>
              <CardDescription>Events with the best metrics and volunteer activity</CardDescription>
            </CardHeader>
            <CardContent>
              {trendingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No approved events yet. Create and get your events approved to see trending data.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trendingEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500"
                      onClick={() => onViewDetails(event.id)}
                    >
                      <CardContent className="pt-4">
                        <h4 className="font-semibold text-sm line-clamp-1 mb-2">{event.title}</h4>

                        {/* Engagement badges */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {event.recentRegistrations > 0 && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                              <Flame className="h-3 w-3 mr-1" />+{event.recentRegistrations} volunteers this week
                            </Badge>
                          )}
                          {event.commentsCount > 0 && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {event.commentsCount} comments
                            </Badge>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Volunteers</span>
                            <span className="font-medium">{event.registrations.length}</span>
                          </div>
                          <Progress value={Math.min(event.registrations.length * 10, 100)} className="h-1.5" />

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Engagement</span>
                            <span className="font-medium">
                              {event.postsCount} posts, {event.likesCount} likes
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section B: Recent Activity & Updates */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </div>
              <CardDescription>Events that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => onViewDetails(activity.eventId)}
                    >
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.type === "approved"
                            ? "bg-emerald-100"
                            : activity.type === "posts"
                              ? "bg-blue-100"
                              : "bg-amber-100"
                        }`}
                      >
                        {activity.type === "approved" ? (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        ) : activity.type === "posts" ? (
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{activity.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.time)}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { Calendar } from "lucide-react"
