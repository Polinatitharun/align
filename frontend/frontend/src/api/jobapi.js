// api/jobAPI.js
import axios from 'axios';

// Create axios instance with base URL and default headers
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const jobAPI = {
  // Get all jobs
  getAllJobs: async () => {
    try {
      const response = await api.get('/jobs');
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  // Get job by ID
  getJobById: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  // Create new job
  createJob: async (jobData) => {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  // Update existing job
  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  },

  // Delete job
  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  },

  // Toggle job status (active/inactive)
  toggleJobStatus: async (id) => {
    try {
      const response = await api.patch(`/jobs/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling job status ${id}:`, error);
      throw error;
    }
  },

  // Upload Excel file
//   uploadExcel: async (file) => {
//     try {
//       const formData = new FormData();
//       formData.append('excelFile', file);

//       const response = await api.post('/jobs/upload-excel', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Error uploading Excel:', error);
//       throw error;
//     }
//   },

  // api/index.js - Update the uploadExcel function
uploadExcel: async (file) => {
  try {
    const formData = new FormData();
    formData.append("excel_file", file);  // Must match backend key

    const response = await api.post("/jobs/upload-excel/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading Excel:", error);
    
    // Better error message
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error("Failed to upload Excel file. Please check the format.");
    }
  }
},

  // Upload Word file
  uploadWord: async (file) => {
    try {
      const formData = new FormData();
      formData.append('wordFile', file);

      const response = await api.post('/jobs/upload-word', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading Word:', error);
      throw error;
    }
  },

  // Download Excel template
  downloadExcelTemplate: async () => {
    try {
      const response = await api.get('/jobs/template/excel', {
        responseType: 'blob', // Important for file download
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading Excel template:', error);
      throw error;
    }
  },

  // Download Word template
  downloadWordTemplate: async () => {
    try {
      const response = await api.get('/jobs/template/word', {
        responseType: 'blob', // Important for file download
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading Word template:', error);
      throw error;
    }
  },

  // Get job analytics
  getJobAnalytics: async () => {
    try {
      const response = await api.get('/jobs/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching job analytics:', error);
      throw error;
    }
  },

  // Get job matches (trainee matches for a job)
  getJobMatches: async (jobId) => {
    try {
      const response = await api.get(`/jobs/${jobId}/matches`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching matches for job ${jobId}:`, error);
      throw error;
    }
  },

  // Bulk update jobs
  bulkUpdateJobs: async (jobsData) => {
    try {
      const response = await api.put('/jobs/bulk-update', jobsData);
      return response.data;
    } catch (error) {
      console.error('Error bulk updating jobs:', error);
      throw error;
    }
  },

  // Search jobs with filters
  searchJobs: async (filters) => {
    try {
      const response = await api.get('/jobs/search', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }
};

export default jobAPI;