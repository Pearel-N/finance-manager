import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, updatePassword } from "@/services/profile";
import { PROFILE } from "@/hooks/queries/profile";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; currency?: string }) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE });
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => updatePassword(data),
  });
};
