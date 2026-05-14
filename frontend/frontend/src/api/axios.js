// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://127.0.0.1:8000/api",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("access");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;




// api/index.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});

const getAccessToken = () => localStorage.getItem("access");
const getRefreshToken = () => localStorage.getItem("refresh");

const attachAccessToken = (config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAccessToken, (error) => Promise.reject(error));

let isRefreshing = false;
let pendingRequests = [];

const onRefreshed = (newToken) => {
  pendingRequests.forEach((callback) => callback(newToken));
  pendingRequests = [];
};

const addPendingRequest = (callback) => {
  pendingRequests.push(callback);
};

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error("Missing refresh token");
  }

  const response = await refreshClient.post("/token/refresh/", {
    refresh,
  });

  const newAccess = response.data.access;
  if (newAccess) {
    localStorage.setItem("access", newAccess);
  }
  return newAccess;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/token/refresh/"
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addPendingRequest((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccess = await refreshAccessToken();
        onRefreshed(newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("userData");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Job API Service - Extending your existing api
export const jobAPI = {
  // Get all jobs
  getAllJobs: async () => {
    try {
      const response = await api.get("/jobs/");
      return response.data;
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  },

  // Get job by ID
  getJobById: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  // Create new job
  createJob: async (jobData) => {
    try {
      const response = await api.post("/jobs/", jobData);
      return response.data;
    } catch (error) {
      console.error("Error creating job:", error);
      throw error;
    }
  },

  // Update existing job
  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}/`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  },

  // Delete job
  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  },

  // Toggle job status (active/inactive)
  toggleJobStatus: async (id) => {
    try {
      const response = await api.patch(`/jobs/${id}/toggle-status/`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling job status ${id}:`, error);
      throw error;
    }
  },

  // Upload Excel file
  uploadExcel: async (file) => {
    try {
      const formData = new FormData();
      formData.append("excel_file", file);

      const response = await api.post("/jobs/upload-excel/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading Excel:", error);
      throw error;
    }
  },

  // Upload Word file
  uploadWord: async (file) => {
    try {
      const formData = new FormData();
      formData.append("wordFile", file);

      const response = await api.post("/jobs/upload-word/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error uploading Word:", error);
      throw error;
    }
  },

  // Download Excel template
  downloadExcelTemplate: async () => {
    try {
      const response = await api.get("/jobs/download-excel-template/", {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading Excel template:", error);
      throw error;
    }
  },

  // Download Word template
  downloadWordTemplate: async () => {
    try {
      const response = await api.get("/jobs/download-word-template/", {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error downloading Word template:", error);
      throw error;
    }
  },

  // Get job analytics
  getJobAnalytics: async () => {
    try {
      const response = await api.get("/jobs/analytics/");
      return response.data;
    } catch (error) {
      console.error("Error fetching job analytics:", error);
      throw error;
    }
  },

  // Get job matches
  getJobMatches: async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}/matches/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching matches for job ${jobId}:`, error);
      throw error;
    }
  },

  // Bulk update jobs
  bulkUpdateJobs: async (jobsData) => {
    try {
      const response = await api.patch("/jobs/bulk-update/", jobsData);
      return response.data;
    } catch (error) {
      console.error("Error bulk updating jobs:", error);
      throw error;
    }
  },

  // Search jobs with filters
  searchJobs: async (filters) => {
    try {
      const response = await api.get("/jobs/search/", { params: filters });
      return response.data;
    } catch (error) {
      console.error("Error searching jobs:", error);
      throw error;
    }
  },
};

// Export the base api instance as well
export default api;
