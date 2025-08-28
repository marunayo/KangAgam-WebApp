import axios from 'axios';

const API_URL = 'http://10.10.48.38:5000/api';

// Fungsi ini publik, tidak perlu token
export const getEntriesByTopicId = async (topicId) => {
    try {
        const response = await axios.get(`${API_URL}/topics/${topicId}/entries`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching entries for topic ${topicId}:`, error);
        throw error;
    }
};

// --- FUNGSI YANG MEMERLUKAN TOKEN ---

export const addEntry = async (topicId, formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            }
        };
        const response = await axios.post(`${API_URL}/topics/${topicId}/entries`, formData, config);
        return response.data;
    } catch (error) {
        console.error('Error adding entry:', error);
        throw error;
    }
};

export const updateEntry = async (topicId, entryId, formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            }
        };
        const response = await axios.put(`${API_URL}/topics/${topicId}/entries/${entryId}`, formData, config);
        return response.data;
    } catch (error) {
        console.error(`Error updating entry ${entryId}:`, error);
        throw error;
    }
};

export const deleteEntry = async (topicId, entryId, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };
        const response = await axios.delete(`${API_URL}/topics/${topicId}/entries/${entryId}`, config);
        return response.data;
    } catch (error) {
        console.error(`Error deleting entry ${entryId}:`, error);
        throw error;
    }
};