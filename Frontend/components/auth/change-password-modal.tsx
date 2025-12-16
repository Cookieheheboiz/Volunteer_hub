"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"; // Đảm bảo import đúng hook
import { authApi } from "@/lib/api";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Confirm password does not match!",
        variant: "destructive",
        className: "text-white", 
      });
      return;
    }

    // 2. Check password length
    if (formData.newPassword.length < 6) {
        toast({
          title: "Error",
          description: "New password must be at least 6 characters.",
          variant: "destructive",
          className: "text-white",
        });
        return;
      }

    // 3. Check if new password is same as old password
    if (formData.currentPassword === formData.newPassword) {
      toast({
        title: "Error",
        description: "New password cannot be the same as the current password.",
        variant: "destructive",
        className: "text-white",
      });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.changePassword({ 
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast({
        title: "Success",
        description: "Password updated successfully!",
        className: "bg-green-500 text-white border-none",
      });
      
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onClose();
    } catch (error: any) {
      // Bây giờ Backend đã trả về tiếng Anh (ví dụ: "Current password is incorrect")
      // nên ta có thể hiển thị trực tiếp error.message
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
        className: "text-white",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Working..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}