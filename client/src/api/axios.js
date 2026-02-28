import axios from "axios";

const API = axios.create({
  baseURL: "https://docsguru.onrender.com",
});

/* 🔥 AUTO ATTACH TOKEN */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* 🔥 AUTO LOGOUT ON 401 ONLY */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // We only want to log out on 401 Unauthorized (invalid token)
    // 403 Forbidden means they are logged in but lack permission, so keep them logged in!
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;