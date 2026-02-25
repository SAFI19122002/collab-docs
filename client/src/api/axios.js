import axios from "axios";

const API = axios.create({
  baseURL: "https://docsguru.onrender.com/api",   // ✅ Render backend
  withCredentials: true,
});

export default API;