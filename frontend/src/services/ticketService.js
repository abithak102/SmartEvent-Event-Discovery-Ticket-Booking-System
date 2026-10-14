import api from "./api";

export const getMyTickets = async () => {
  const response = await api.get("/tickets/my");
  return response.data;
};

export const generateTickets = async (bookingId) => {
  const response = await api.post(`/tickets/generate/${bookingId}`);
  return response.data;
};