import api from "./api";

export const getMyNotifications = async () => {
  const response = await api.get("/notifications/my");
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.patch(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};