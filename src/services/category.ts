import axios from "axios";

export const getCategories = async () => {
  const response = await axios.get("/api/categories");
  return response.data; // Only return the plain data, not the whole axios response object
};

export const addCategory = async (name: string) => {
  const response = await axios.post("/api/categories", { name });
  return response.data;
};
