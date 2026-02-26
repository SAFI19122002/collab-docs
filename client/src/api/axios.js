import axios from "axios";

const API = axios.create({
  baseURL: "https://docsguru.onrender.com",   // ✅ HTTPS ONLY
});

export default API;