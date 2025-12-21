"use client"

import { useState } from "react"
import { Bell, CheckCircle, XCircle, Trophy, Calendar, UserPlus, X, CheckCheck, MessageCircle, Heart } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { Badge } from "@/src/components/ui/badge"
import type { Notification, NotificationType } from "@/src/lib/types"
import type { GroupedNotification } from "@/src/hooks/use-notifications"

interface NotificationCenterProps {
  notifications: GroupedNotification[]
  onDelete: (notificationId: string) => void
  onMarkAllRead: () => void
  onMarkAsRead: (notificationId: string) => void
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "EVENT_APPROVED":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    case "EVENT_REMINDER":
      return <Trophy className="h-5 w-5 text-amber-500" />
    case "NEW_REGISTRATION":
      return <UserPlus className="h-5 w-5 text-blue-500" />
    case "CANCELLED_REGISTRATION":
      return <XCircle className="h-5 w-5 text-destructive" />
    case "NEW_POST":
      return <Calendar className="h-5 w-5 text-purple-500" />
    case "NEW_COMMENT":
      return <MessageCircle className="h-5 w-5 text-blue-500" />
    case "POST_LIKE":
      return <Heart className="h-5 w-5 text-pink-500" />
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US")
}

export function NotificationCenter({ notifications, onDelete, onMarkAllRead, onMarkAsRead}: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleNotificationClick = (notification: GroupedNotification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    // Nếu có link, có thể navigate đến đó
    if (notification.link) {
      window.location.href = notification.link
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs" onClick={onMarkAllRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !notification.isRead ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm leading-tight flex-1">{notification.content}</p>
                      {notification.groupedCount && notification.groupedCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          +{notification.groupedCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{getRelativeTime(notification.createdAt)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(notification.id)
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Delete notification</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
