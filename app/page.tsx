"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar } from "@/components/layout/sidebar"
import { VolunteerDashboard } from "@/components/dashboard/volunteer-dashboard"
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { EventDetail } from "@/components/events/event-detail"
import { CreateEventModal } from "@/components/events/create-event-modal"
import { ManagerOverviewDashboard } from "@/components/dashboard/manager-overview-dashboard"
import { mockUsers, mockEvents, mockPosts, mockNotifications } from "@/lib/mock-data"
import type { User, Event, Post, Role, Notification } from "@/lib/types"
import { Heart } from "lucide-react"

export default function Home() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(true)

  // Simulated current user - change role here to test different views
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0]) // Default: VOLUNTEER

  // App state
  const [events, setEvents] = useState<Event[]>(mockEvents)
  const [posts, setPosts] = useState<Post[]>(mockPosts)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentView, setCurrentView] = useState("discover")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Role switcher for testing
  const switchRole = (role: Role) => {
    const user = mockUsers.find((u) => u.role === role)
    if (user) {
      setCurrentUser(user)
      // Reset to default view for the role
      if (role === "VOLUNTEER") setCurrentView("discover")
      else if (role === "EVENT_MANAGER") setCurrentView("manager-overview")
      else if (role === "ADMIN") setCurrentView("overview")
      setSelectedEventId(null)
    }
  }

  // Auth handlers
  const handleLogin = (email: string, password: string) => {
    setIsAuthenticated(true)
  }

  const handleSignup = (name: string, email: string, password: string, role: Role) => {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role,
      avatarUrl: "/diverse-user-avatars.png",
      status: "ACTIVE",
    }
    setCurrentUser(newUser)
    setIsAuthenticated(true)
    if (role === "VOLUNTEER") setCurrentView("discover")
    else if (role === "EVENT_MANAGER") setCurrentView("manager-overview")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setShowLogin(true)
    setSelectedEventId(null)
  }

  // Event handlers
  const handleViewDetails = (eventId: string) => {
    setSelectedEventId(eventId)
  }

  const handleBack = () => {
    setSelectedEventId(null)
  }

  const handleJoin = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId && !e.registrations.some((r) => r.user.id === currentUser.id)) {
          return {
            ...e,
            registrations: [
              ...e.registrations,
              {
                user: currentUser,
                status: "PENDING" as const,
                registeredAt: new Date().toISOString(),
              },
            ],
          }
        }
        return e
      }),
    )
    alert(`Your request to join has been submitted. Please wait for the event manager's approval.`)
  }

  const handleLeave = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return { ...e, registrations: e.registrations.filter((r) => r.user.id !== currentUser.id) }
        }
        return e
      }),
    )
    alert(`You have cancelled your participation.`)
  }

  const handleApproveRegistration = (eventId: string, userId: string) => {
    const event = events.find((e) => e.id === eventId)
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            registrations: e.registrations.map((r) =>
              r.user.id === userId ? { ...r, status: "APPROVED" as const } : r,
            ),
          }
        }
        return e
      }),
    )
    if (event) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        userId: userId,
        type: "APPROVED",
        title: "Registration Approved",
        message: `Your request to join "${event.title}" has been approved!`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    }
  }

  const handleRejectRegistration = (eventId: string, userId: string) => {
    const event = events.find((e) => e.id === eventId)
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            registrations: e.registrations.map((r) =>
              r.user.id === userId ? { ...r, status: "REJECTED" as const } : r,
            ),
          }
        }
        return e
      }),
    )
    if (event) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        userId: userId,
        type: "REJECTED",
        title: "Registration Rejected",
        message: `Your request to join "${event.title}" has been rejected.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    }
  }

  const handleMarkAttended = (eventId: string, userId: string) => {
    const event = events.find((e) => e.id === eventId)
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            registrations: e.registrations.map((r) =>
              r.user.id === userId ? { ...r, status: "ATTENDED" as const } : r,
            ),
          }
        }
        return e
      }),
    )
    if (event) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        userId: userId,
        type: "COMPLETED",
        title: "Event Completed",
        message: `You have completed the event "${event.title}". Thank you for volunteering!`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    }
  }

  const handleCreateEvent = (eventData: {
    title: string
    description: string
    location: string
    startTime: string
    endTime: string
  }) => {
    if (editingEvent) {
      setEvents((prev) => prev.map((e) => (e.id === editingEvent.id ? { ...e, ...eventData } : e)))
      setEditingEvent(null)
    } else {
      const newEvent: Event = {
        id: Date.now().toString(),
        ...eventData,
        status: "PENDING",
        creator: currentUser,
        registrations: [],
      }
      setEvents((prev) => [...prev, newEvent])
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowCreateModal(true)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
    setPosts((prev) => prev.filter((p) => p.eventId !== eventId))
    setSelectedEventId(null)
  }

  // Post handlers
  const handleCreatePost = (content: string) => {
    if (!selectedEventId) return
    const newPost: Post = {
      id: Date.now().toString(),
      eventId: selectedEventId,
      content,
      author: currentUser,
      createdAt: new Date().toISOString(),
      likedBy: [],
      comments: [],
    }
    setPosts((prev) => [newPost, ...prev])
  }

  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = p.likedBy.includes(currentUser.id)
          return {
            ...p,
            likedBy: hasLiked ? p.likedBy.filter((id) => id !== currentUser.id) : [...p.likedBy, currentUser.id],
          }
        }
        return p
      }),
    )
  }

  const handleAddComment = (postId: string, content: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              {
                id: Date.now().toString(),
                content,
                author: currentUser,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        }
        return p
      }),
    )
  }

  // Admin handlers
  const handleApprove = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: "APPROVED" } : e)))
    if (event) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        userId: event.creator.id,
        type: "EVENT_APPROVED",
        title: "Event Approved",
        message: `Your event "${event.title}" has been approved by admin and is now published!`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    }
  }

  const handleReject = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: "REJECTED" } : e)))
    if (event) {
      const newNotification: Notification = {
        id: Date.now().toString(),
        userId: event.creator.id,
        type: "EVENT_REJECTED",
        title: "Event Rejected",
        message: `Your event "${event.title}" has been rejected by admin.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    }
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: u.status === "ACTIVE" ? "BANNED" : "ACTIVE" } : u)),
    )
  }

  // Notification handlers
  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => (n.userId === currentUser.id ? { ...n, isRead: true } : n)))
  }

  // Auth screens
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="h-10 w-10 text-emerald-600" />
          <h1 className="text-3xl font-bold text-emerald-900">VolunteerHub</h1>
        </div>
        {showLogin ? (
          <LoginForm onLogin={handleLogin} onSwitchToSignup={() => setShowLogin(false)} />
        ) : (
          <SignupForm onSignup={handleSignup} onSwitchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    )
  }

  // Event detail view
  const selectedEvent = events.find((e) => e.id === selectedEventId)
  if (selectedEvent) {
    const eventPosts = posts.filter((p) => p.eventId === selectedEventId)
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          user={currentUser}
          notifications={notifications}
          sidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
          onDeleteNotification={handleDeleteNotification}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        />
        <main className="p-4 md:p-6">
          <EventDetail
            event={selectedEvent}
            posts={eventPosts}
            currentUser={currentUser}
            onBack={handleBack}
            onJoin={handleJoin}
            onLeave={handleLeave}
            onCreatePost={handleCreatePost}
            onLikePost={handleLikePost}
            onAddComment={handleAddComment}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
            onApproveRegistration={handleApproveRegistration}
            onRejectRegistration={handleRejectRegistration}
            onMarkAttended={handleMarkAttended}
          />
        </main>
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setEditingEvent(null)
          }}
          onCreate={handleCreateEvent}
          editingEvent={editingEvent}
        />
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={currentUser}
        notifications={notifications}
        sidebarOpen={sidebarOpen}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        onDeleteNotification={handleDeleteNotification}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      />
      <Sidebar
        role={currentUser.role}
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="p-4 md:p-6">
        {/* Role Switcher for Testing */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Switch role for testing:</p>
          <div className="flex flex-wrap gap-2">
            {(["VOLUNTEER", "EVENT_MANAGER", "ADMIN"] as Role[]).map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentUser.role === role ? "bg-emerald-600 text-white" : "bg-background border hover:bg-muted"
                }`}
              >
                {role.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Role-based content */}
        {currentUser.role === "VOLUNTEER" && (
          <VolunteerDashboard
            events={events}
            currentView={currentView}
            currentUser={currentUser}
            onViewDetails={handleViewDetails}
            onJoin={handleJoin}
          />
        )}

        {currentUser.role === "EVENT_MANAGER" && (
          <>
            {currentView === "manager-overview" ? (
              <ManagerOverviewDashboard
                events={events}
                posts={posts}
                notifications={notifications}
                currentUser={currentUser}
                onViewDetails={handleViewDetails}
              />
            ) : (
              <ManagerDashboard
                events={events}
                currentUser={currentUser}
                currentView={currentView}
                onViewDetails={handleViewDetails}
                onCreateEvent={() => setShowCreateModal(true)}
              />
            )}
          </>
        )}

        {currentUser.role === "ADMIN" && (
          <AdminDashboard
            events={events}
            users={users}
            posts={posts}
            currentView={currentView}
            onApprove={handleApprove}
            onReject={handleReject}
            onViewDetails={handleViewDetails}
            onToggleUserStatus={handleToggleUserStatus}
          />
        )}
      </main>
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingEvent(null)
        }}
        onCreate={handleCreateEvent}
        editingEvent={editingEvent}
      />
    </div>
  )
}
