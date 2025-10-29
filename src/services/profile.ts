import axios from "axios";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  currency: string | null;
}

export const getProfile = async (): Promise<UserProfile> => {
  const response = await axios.get("/api/profile");
  return response.data;
};

export const updateProfile = async (data: { name?: string; currency?: string }): Promise<UserProfile> => {
  const response = await axios.patch("/api/profile", data);
  return response.data;
};

export const updatePassword = async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
  await axios.post("/api/profile/password", data);
};
