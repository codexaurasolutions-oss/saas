import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://resparkbackend-production-ba7b.up.railway.app/api/v1";
const STORAGE_KEY = "respark_customer_session";

export const customerApi = axios.create({ baseURL: API_BASE });

let refreshPromise = null;

export const getCustomerSession = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

export const setCustomerSession = (session) => {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    delete customerApi.defaults.headers.common.Authorization;
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  customerApi.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
};

export const bootstrapCustomerSession = () => {
  const session = getCustomerSession();
  if (session?.accessToken) {
    customerApi.defaults.headers.common.Authorization = `Bearer ${session.accessToken}`;
  }
  return session;
};

customerApi.interceptors.request.use((config) => {
  const session = getCustomerSession();
  const accessToken = session?.accessToken;
  config.headers = config.headers || {};
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response || error.response.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const session = getCustomerSession();
    const refreshToken = session?.refreshToken;
    if (!refreshToken) {
      setCustomerSession(null);
      const authError = new Error("Session expired. Please login again.");
      authError.isAuthError = true;
      return Promise.reject(authError);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(`${API_BASE}/customer/auth/refresh`, { refreshToken });
      }
      const refreshResponse = await refreshPromise;
      refreshPromise = null;
      const nextSession = { ...session, ...refreshResponse.data };
      setCustomerSession(nextSession);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${nextSession.accessToken}`;
      return customerApi(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      setCustomerSession(null);
      const authError = new Error("Session expired. Please login again.");
      authError.isAuthError = true;
      return Promise.reject(authError);
    }
  }
);

bootstrapCustomerSession();
