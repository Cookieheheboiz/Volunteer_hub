"use client"

import { useState } from "react"
import { Bell, CheckCircle, XCircle, Trophy, Calendar, UserPlus, X, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Notification, NotificationType } from "@/lib/types"

interface NotificationCenterProps {
  notifications: Notification[]
  onDelete: (notificationId: string) => void
  onMarkAllRead: () => void
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "APPROVED":
      return <CheckCircle className="h-5 w-5 text-emerald-500" />
    case "REJECTED":
      return <XCircle className="h-5 w-5 text-destructive" />
    case "COMPLETED":
      return <Trophy className="h-5 w-5 text-amber-500" />
    case "EVENT_APPROVED":
      return <Calendar className="h-5 w-5 text-emerald-500" />
    case "EVENT_REJECTED":
      return <Calendar className="h-5 w-5 text-destructive" />
    case "NEW_REGISTRATION":
      return <UserPlus className="h-5 w-5 text-blue-500" />
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
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
  return date.toLocaleDateString()
}

export function NotificationCenter({ notifications, onDelete, onMarkAllRead }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

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
        <ScrollArea className="h-[300px]">
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
                  className={`flex gap-3 p-4 hover:bg-muted/50 transition-colors ${
                    !notification.isRead ? "bg-emerald-50/50" : ""
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getRelativeTime(notification.createdAt)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 opacity-50 hover:opacity-100"
                    onClick={() => onDelete(notification.id)}
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
