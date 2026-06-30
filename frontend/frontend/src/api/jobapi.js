// api/jobAPI.js
import api from './axios';

const jobAPI = {
  getAllJobs: async () => {
    try {
      const response = await api.get('/jobs/');
      return response.data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  },

  getJobById: async (id) => {
    try {
      const response = await api.get(`/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  },

  createJob: async (jobData) => {
    try {
      const response = await api.post('/jobs/', jobData);
      return response.data;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  updateJob: async (id, jobData) => {
    try {
      const response = await api.put(`/jobs/${id}/`, jobData);
      return response.data;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  },

  deleteJob: async (id) => {
    try {
      const response = await api.delete(`/jobs/${id}/`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  },

  toggleJobStatus: async (id) => {
    try {
      const response = await api.patch(`/jobs/${id}/toggle-status/`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling job status ${id}:`, error);
      throw error;
    }
  },

  uploadExcel: async (file) => {
    try {
      const formData = new FormData();
      formData.append('excel_file', file);

      const response = await api.post('/jobs/upload-excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading Excel:', error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to upload Excel file. Please check the format.');
    }
  },

  uploadWord: async (file) => {
    try {
      const formData = new FormData();
      formData.append('wordFile', file);

      const response = await api.post('/jobs/upload-word/', formData, {
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

  downloadExcelTemplate: async () => {
    try {
      const response = await api.get('/jobs/download-excel-template/', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading Excel template:', error);
      throw error;
    }
  },

  downloadWordTemplate: async () => {
    try {
      const response = await api.get('/jobs/download-word-template/', {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading Word template:', error);
      throw error;
    }
  },

  getJobAnalytics: async () => {
    try {
      const response = await api.get('/dashboard/analytics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching job analytics:', error);
      throw error;
    }
  },

  getJobMatches: async (jobId) => {
    try {
      const response = await api.get(`/matches/${jobId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching matches for job ${jobId}:`, error);
      throw error;
    }
  },

  bulkUpdateJobs: async (jobsData) => {
    try {
      const response = await api.patch('/jobs/bulk-update/', jobsData);
      return response.data;
    } catch (error) {
      console.error('Error bulk updating jobs:', error);
      throw error;
    }
  },

  searchJobs: async (filters) => {
    try {
      const response = await api.get('/jobs/', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  },
};

export default jobAPI;