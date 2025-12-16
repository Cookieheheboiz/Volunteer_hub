import type { User, Event, Post, Notification } from "./types"

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Volunteer",
    email: "john@example.com",
    role: "VOLUNTEER",
    avatarUrl: "/male-avatar.png",
    status: "ACTIVE",
  },
  {
    id: "2",
    name: "Sarah Manager",
    email: "sarah@example.com",
    role: "EVENT_MANAGER",
    avatarUrl: "/diverse-female-avatar.png",
    status: "ACTIVE",
  },
  {
    id: "3",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN",
    avatarUrl: "/admin-avatar.png",
    status: "ACTIVE",
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily@example.com",
    role: "VOLUNTEER",
    avatarUrl: "/asian-female-avatar.png",
    status: "BANNED",
  },
  {
    id: "5",
    name: "Michael Brown",
    email: "michael@example.com",
    role: "VOLUNTEER",
    avatarUrl: "/black-male-avatar.jpg",
    status: "ACTIVE",
  },
  {
    id: "6",
    name: "Lisa Wong",
    email: "lisa@example.com",
    role: "EVENT_MANAGER",
    status: "BANNED",
  },
  {
    id: "7",
    name: "David Kim",
    email: "david@example.com",
    role: "VOLUNTEER",
    status: "ACTIVE",
  },
]

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Beach Cleanup Drive",
    description:
      "Join us for a community beach cleanup event. We will be cleaning up the shoreline and educating visitors about ocean conservation. All supplies provided!",
    location: "Santa Monica Beach, CA",
    startTime: "2025-01-15T09:00:00Z",
    endTime: "2025-01-15T13:00:00Z",
    status: "APPROVED",
    creator: mockUsers[1],
    registrations: [
      { user: mockUsers[0], status: "APPROVED", registeredAt: "2025-01-10T10:00:00Z" },
      { user: mockUsers[3], status: "PENDING", registeredAt: "2025-01-12T14:00:00Z" },
      { user: mockUsers[4], status: "ATTENDED", registeredAt: "2025-01-08T09:00:00Z" },
    ],
  },
  {
    id: "2",
    title: "Food Bank Volunteering",
    description:
      "Help sort and distribute food at the local food bank. Great opportunity to give back to the community and meet like-minded individuals.",
    location: "Downtown Community Center",
    startTime: "2025-01-20T10:00:00Z",
    endTime: "2025-01-20T14:00:00Z",
    status: "APPROVED",
    creator: mockUsers[1],
    registrations: [
      { user: mockUsers[0], status: "PENDING", registeredAt: "2025-01-15T11:00:00Z" },
      { user: mockUsers[4], status: "APPROVED", registeredAt: "2025-01-14T08:00:00Z" },
    ],
  },
  {
    id: "3",
    title: "Youth Mentorship Program",
    description:
      "Mentor underprivileged youth in our after-school program. Share your knowledge and make a lasting impact on young lives.",
    location: "Lincoln High School",
    startTime: "2025-01-25T15:00:00Z",
    endTime: "2025-01-25T18:00:00Z",
    status: "PENDING",
    creator: mockUsers[1],
    registrations: [],
  },
  {
    id: "4",
    title: "Tree Planting Initiative",
    description:
      "Join our environmental initiative to plant 500 trees in the city park. Help create a greener future for our community.",
    location: "Central City Park",
    startTime: "2025-02-01T08:00:00Z",
    endTime: "2025-02-01T12:00:00Z",
    status: "PENDING",
    creator: mockUsers[1],
    registrations: [],
  },
  {
    id: "5",
    title: "Senior Care Visit",
    description:
      "Spend quality time with seniors at the retirement home. Activities include games, reading, and friendly conversation.",
    location: "Sunrise Senior Living",
    startTime: "2025-02-05T14:00:00Z",
    endTime: "2025-02-05T17:00:00Z",
    status: "APPROVED",
    creator: mockUsers[1],
    registrations: [{ user: mockUsers[3], status: "APPROVED", registeredAt: "2025-01-20T16:00:00Z" }],
  },
]

export const mockPosts: Post[] = [
  {
    id: "1",
    eventId: "1",
    content: "So excited for this event! Who else is coming? Looking forward to making a difference together.",
    author: mockUsers[0],
    createdAt: "2025-01-10T14:30:00Z",
    likedBy: ["2", "3", "4"],
    comments: [
      {
        id: "c1",
        content: "Count me in! This is going to be amazing.",
        author: mockUsers[1],
        createdAt: "2025-01-10T15:00:00Z",
      },
      {
        id: "c2",
        content: "First time volunteering here, any tips?",
        author: mockUsers[0],
        createdAt: "2025-01-10T16:30:00Z",
      },
    ],
  },
  {
    id: "2",
    eventId: "1",
    content: "Remember to bring sunscreen and water bottles! The weather forecast shows it will be sunny.",
    author: mockUsers[1],
    createdAt: "2025-01-11T09:00:00Z",
    likedBy: ["1", "4"],
    comments: [
      {
        id: "c3",
        content: "Thanks for the reminder! Will do.",
        author: mockUsers[0],
        createdAt: "2025-01-11T10:15:00Z",
      },
    ],
  },
  {
    id: "3",
    eventId: "2",
    content: "Just registered for the food bank event! Can't wait to help out.",
    author: mockUsers[0],
    createdAt: "2025-01-12T11:45:00Z",
    likedBy: ["2"],
    comments: [],
  },
  {
    id: "4",
    eventId: "5",
    content: "Looking forward to spending time with the seniors. Anyone have game suggestions?",
    author: mockUsers[0],
    createdAt: "2025-01-13T09:00:00Z",
    likedBy: [],
    comments: [
      {
        id: "c4",
        content: "Card games are always a hit! Bring a deck if you have one.",
        author: mockUsers[1],
        createdAt: "2025-01-13T10:30:00Z",
      },
    ],
  },
]

export const mockNotifications: Notification[] = [
  // Notifications for VOLUNTEER (user id "1")
  {
    id: "n1",
    type: "APPROVED",
    title: "Registration Confirmed",
    message: "Your request to join 'Beach Cleanup Drive' has been approved by the manager.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    userId: "1",
  },
  {
    id: "n2",
    type: "COMPLETED",
    title: "Event Completed",
    message:
      "Congratulations! You have been marked as attended for 'Food Bank Volunteering'. Thank you for your service.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: false,
    userId: "1",
  },
  {
    id: "n3",
    type: "REJECTED",
    title: "Registration Declined",
    message: "Your request to join 'Youth Mentorship Program' was not approved. The event has reached capacity.",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    isRead: true,
    userId: "1",
  },
  // Notifications for EVENT_MANAGER (user id "2")
  {
    id: "n4",
    type: "EVENT_APPROVED",
    title: "Event Published",
    message: "Your event 'Beach Cleanup Drive' has been approved by Admin and is now public.",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    isRead: false,
    userId: "2",
  },
  {
    id: "n5",
    type: "NEW_REGISTRATION",
    title: "New Registration Request",
    message: "Emily Chen has requested to join 'Beach Cleanup Drive'. Review their application.",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    isRead: false,
    userId: "2",
  },
  {
    id: "n6",
    type: "EVENT_REJECTED",
    title: "Event Not Approved",
    message: "Your event 'Late Night Cleanup' was not approved. Please review the guidelines and resubmit.",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: true,
    userId: "2",
  },
  // Notifications for ADMIN (user id "3")
  {
    id: "n7",
    type: "NEW_REGISTRATION",
    title: "New Event Pending",
    message: "A new event 'Tree Planting Initiative' is awaiting your approval.",
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isRead: false,
    userId: "3",
  },
]
