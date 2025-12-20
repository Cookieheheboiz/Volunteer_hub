"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { notificationApi } from "@/src/lib/api"
import type { Notification } from "@/src/lib/types"

export interface GroupedNotification extends Notification {
  groupedIds?: string[]
  groupedCount?: number
}

// Hàm gộp các thông báo cùng loại và cùng bài viết
function groupNotifications(notifications: Notification[]): GroupedNotification[] {
  const grouped = new Map<string, GroupedNotification>()
  const timeWindowMs = 24 * 60 * 60 * 1000 // 24 giờ

  notifications.forEach((notif) => {
    // Chỉ gộp thông báo POST_LIKE và NEW_COMMENT
    if (notif.type !== "POST_LIKE" && notif.type !== "NEW_COMMENT") {
      grouped.set(notif.id, notif)
      return
    }

    // Lấy postId từ link (format: /post/{postId})
    const postId = notif.link?.match(/\/post\/([^\/]+)/)?.[1]
    if (!postId) {
      grouped.set(notif.id, notif)
      return
    }

    // Tạo key để nhóm: type + postId
    const groupKey = `${notif.type}_${postId}`
    
    const existing = grouped.get(groupKey)
    
    if (existing) {
      // Kiểm tra thời gian có trong window không
      const timeDiff = Math.abs(new Date(notif.createdAt).getTime() - new Date(existing.createdAt).getTime())
      
      if (timeDiff <= timeWindowMs) {
        // Gộp vào nhóm hiện có
        const groupedIds = existing.groupedIds || [existing.id]
        groupedIds.push(notif.id)
        
        // Lấy tên người đầu tiên từ content
        const firstPersonMatch = existing.content.match(/^([^đ]+)/)
        const firstName = firstPersonMatch ? firstPersonMatch[1].trim() : "Ai đó"
        
        // Cập nhật content
        const count = groupedIds.length - 1
        let newContent = ""
        if (notif.type === "POST_LIKE") {
          newContent = count === 0 
            ? `${firstName} đã thích bài viết của bạn`
            : `${firstName} và ${count} người khác đã thích bài viết của bạn`
        } else {
          newContent = count === 0
            ? `${firstName} đã bình luận vào bài viết của bạn`
            : `${firstName} và ${count} người khác đã bình luận vào bài viết của bạn`
        }
        
        grouped.set(groupKey, {
          ...existing,
          content: newContent,
          groupedIds,
          groupedCount: count,
          isRead: existing.isRead && notif.isRead, // Chỉ read nếu tất cả đều read
        })
      } else {
        // Quá xa về thời gian, tạo nhóm mới
        grouped.set(notif.id, notif)
      }
    } else {
      // Thông báo đầu tiên trong nhóm
      grouped.set(groupKey, notif)
    }
  })

  return Array.from(grouped.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Gộp thông báo
  const groupedNotifications = useMemo(() => {
    return groupNotifications(notifications)
  }, [notifications])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await notificationApi.getNotifications()
      setNotifications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải thông báo")
      console.error("Error fetching notifications:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Đánh dấu một thông báo đã đọc (hoặc cả nhóm nếu là grouped)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Tìm notification để xem có phải grouped không
      const notification = groupedNotifications.find(n => n.id === notificationId)
      const idsToMark = notification?.groupedIds || [notificationId]
      
      // Đánh dấu tất cả trong nhóm
      await Promise.all(idsToMark.map(id => notificationApi.markAsRead(id)))
      
      setNotifications((prev) =>
        prev.map((notif) =>
          idsToMark.includes(notif.id) ? { ...notif, isRead: true } : notif
        )
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }, [groupedNotifications])

  // Đánh dấu tất cả thông báo đã đọc
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      )
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
    }
  }, [])

  // Xóa thông báo (hoặc cả nhóm nếu là grouped)
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Tìm notification để xem có phải grouped không
      const notification = groupedNotifications.find(n => n.id === notificationId)
      const idsToDelete = notification?.groupedIds || [notificationId]
      
      // Xóa tất cả trong nhóm
      await Promise.all(idsToDelete.map(id => notificationApi.deleteNotification(id)))
      
      setNotifications((prev) =>
        prev.filter((notif) => !idsToDelete.includes(notif.id))
      )
    } catch (err) {
      console.error("Error deleting notification:", err)
    }
  }, [groupedNotifications])

  // Refresh notifications (có thể gọi định kỳ hoặc sau một action)
  const refresh = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications: groupedNotifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  }
}
