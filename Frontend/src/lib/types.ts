export type Role = "VOLUNTEER" | "EVENT_MANAGER" | "ADMIN"
export type EventStatus = "PENDING" | "APPROVED" | "REJECTED" | "ONGOING" | "COMPLETED" | "CANCELLED"
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED" | "ATTENDED"
export type UserStatus = "ACTIVE" | "BANNED"
export type NotificationType =
  | "NEW_REGISTRATION"
  | "CANCELLED_REGISTRATION"
  | "EVENT_APPROVED"
  | "EVENT_REMINDER"
  | "NEW_POST"
  | "NEW_COMMENT"
  | "POST_LIKE"

export interface Notification {
  id: string
  type: NotificationType
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
  recipientId: string
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl?: string
  status: UserStatus
}

export interface Registration {
  user: User
  status: RegistrationStatus
  registeredAt: string
}

export interface Event {
  id: string
  title: string
  description: string
  location: string
  startTime: string
  endTime: string
  status: EventStatus
  creator: User
  registrations: Registration[]
}

export interface Comment {
  id: string
  content: string
  author: User
  createdAt: string
}

export interface Post {
  id: string
  eventId: string
  content: string
  author: User
  createdAt: string
  likedBy: string[]
  comments: Comment[]
}
