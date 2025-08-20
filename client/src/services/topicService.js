import axios from 'axios';

const API_URL = '/api';

// Fungsi ini tidak perlu token karena bersifat publik
export const getTopics = async (language = 'id') => {
    try {
        const response = await axios.get(`${API_URL}/topics`, {
            params: { language: language }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching topics:', error);
        throw error;
    }
};

// Fungsi ini juga publik
export const getTopicById = async (topicId) => {
    try {
        const response = await axios.get(`${API_URL}/topics/${topicId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching topic with id ${topicId}:`, error);
        throw error;
    }
};

// --- FUNGSI YANG MEMERLUKAN TOKEN ---

export const addTopic = async (formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.post(`${API_URL}/topics`, formData, config);
        return response.data;
    } catch (error) {
        console.error('Error adding topic:', error);
        throw error;
    }
};

export const updateTopic = async (id, formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.put(`${API_URL}/topics/${id}`, formData, config);
        return response.data;
    } catch (error) {
        console.error(`Error updating topic ${id}:`, error);
        throw error;
    }
};

export const deleteTopic = async (id, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.delete(`${API_URL}/topics/${id}`, config);
        return response.data;
    } catch (error) {
        console.error(`Error deleting topic ${id}:`, error);
        throw error;
    }
};