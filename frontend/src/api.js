import axios from 'axios';

const API_BASE_URL = ''; // Relative path since frontend is served by backend or proxied

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/chunking`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const pollChunkingStatus = async (jobId) => {
    const response = await axios.get(`${API_BASE_URL}/chunking/status`, {
        params: { job_id: jobId },
    });
    return response.data;
};

export const generateAssessment = async (query, collectionName, bloomsRequirements) => {
    const response = await axios.post(`${API_BASE_URL}/chat`, null, {
        params: {
            query: query,
            collection_name: collectionName,
            blooms_requirements: bloomsRequirements,
        },
    });
    return response.data;
};

export const pollJobStatus = async (jobId) => {
    const response = await axios.get(`${API_BASE_URL}/job_status`, {
        params: { job_id: jobId },
    });
    return response.data;
};
