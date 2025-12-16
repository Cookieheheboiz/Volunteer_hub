"use client"

import { Menu, LogOut, Heart } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { Button } from "@/src/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import { NotificationCenter } from "./notification-center"
import type { User, Notification } from "@/src/lib/types"

interface NavbarProps {
  user: User
  notifications: Notification[]
  sidebarOpen: boolean
  onMenuToggle: () => void
  onLogout: () => void
  onDeleteNotification: (notificationId: string) => void
  onMarkAllNotificationsRead: () => void
}

export function Navbar({
  user,
  notifications,
  sidebarOpen,
  onMenuToggle,
  onLogout,
  onDeleteNotification,
  onMarkAllNotificationsRead,
}: NavbarProps) {
  const userNotifications = notifications.filter((n) => n.userId === user.id)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-xl hidden sm:inline">VolunteerHub</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter
            notifications={userNotifications}
            onDelete={onDeleteNotification}
            onMarkAllRead={onMarkAllNotificationsRead}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{user.name}</span>
                  <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                  <span className="text-xs text-emerald-600 font-medium mt-1">{user.role.replace("_", " ")}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
