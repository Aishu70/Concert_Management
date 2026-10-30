import axios from "axios";

const API_URL = "/api";

export const getConcerts = async () => {
  try {
    const response = await axios.get(`${API_URL}/concerts`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching concerts:", error);
    throw error;
  }
};