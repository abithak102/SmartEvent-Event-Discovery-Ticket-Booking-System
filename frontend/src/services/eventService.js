import api from "./api";

export const getEvents = async (filters = {}) => {
  const response = await api.get("/events", {
    params: filters,
  });

  return response.data;
};

export const getEventById = async (eventId) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post("/events", eventData);
  return response.data;
};