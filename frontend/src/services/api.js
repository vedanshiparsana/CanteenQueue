import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Sales Analytics APIs
export const getSalesAnalytics = () => {
    return api.get("/analytics/sales");
};

export const getPopularItems = () => {
    return api.get("/analytics/popular-items");
};

export const getAnalyticsSummary = () => {
    return api.get("/analytics/summary");
};

export default api;