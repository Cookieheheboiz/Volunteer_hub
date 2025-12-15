"use client"

import { Home, Calendar, History, Users, Shield, X, LayoutDashboard } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"
import type { Role } from "@/src/lib/types"

interface SidebarProps {
  role: Role
  currentView: string
  onNavigate: (view: string) => void
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ role, currentView, onNavigate, isOpen, onClose }: SidebarProps) {
  const volunteerLinks = [
    { id: "discover", label: "Discover Events", icon: Home },
    { id: "history", label: "My History", icon: History },
  ]

  const managerLinks = [
    { id: "manager-overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "my-events", label: "My Events", icon: Calendar },
  ]

  const adminLinks = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "approval-queue", label: "Event Approval Queue", icon: Shield },
    { id: "users", label: "User Management", icon: Users },
  ]

  const getLinks = () => {
    switch (role) {
      case "VOLUNTEER":
        return volunteerLinks
      case "EVENT_MANAGER":
        return managerLinks
      case "ADMIN":
        return adminLinks
      default:
        return []
    }
  }

  const links = getLinks()

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <span className="font-semibold">Navigation</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Button
              key={link.id}
              variant={currentView === link.id ? "secondary" : "ghost"}
              className={cn("justify-start gap-3", currentView === link.id && "bg-sidebar-accent")}
              onClick={() => {
                onNavigate(link.id)
                onClose()
              }}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Button>
          ))}
        </nav>
      </aside>
    </>
  )
}
