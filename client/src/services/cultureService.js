import axios from 'axios';

const API_URL_TOPICS = 'http://10.10.48.38:5000/api/culture-topics';

// =================================
//      FUNGSI UNTUK TOPIC BUDAYA
// =================================

export const getAllCultureTopics = async () => {
    const response = await axios.get(API_URL_TOPICS);
    return response.data;
};

export const getCultureTopicById = async (topicId) => {
    const response = await axios.get(`${API_URL_TOPICS}/${topicId}`);
    return response.data;
};

export const addCultureTopic = async (formData, token) => {
    const response = await axios.post(API_URL_TOPICS, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export const updateCultureTopic = async (topicId, formData, token) => {
    const response = await axios.put(`${API_URL_TOPICS}/${topicId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export const deleteCultureTopic = async (topicId, token) => {
    const response = await axios.delete(`${API_URL_TOPICS}/${topicId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};


// =================================
//      FUNGSI UNTUK ENTRI BUDAYA
// =================================

export const getEntriesByCultureTopic = async (topicId) => {
    const response = await axios.get(`${API_URL_TOPICS}/${topicId}/entries`);
    return response.data;
};

// Fungsi ini mungkin perlu disesuaikan jika path-nya juga nested
export const getCultureEntryById = async (topicId, entryId) => {
    const response = await axios.get(`${API_URL_TOPICS}/${topicId}/entries/${entryId}`);
    return response.data;
};

export const addCultureEntry = async (topicId, formData, token) => {
    const response = await axios.post(`${API_URL_TOPICS}/${topicId}/entries`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

// ✅ PERBAIKAN: Tambahkan parameter topicId dan perbaiki URL
export const updateCultureEntry = async (topicId, entryId, formData, token) => {
    const response = await axios.put(`${API_URL_TOPICS}/${topicId}/entries/${entryId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

// ✅ PERBAIKAN: Tambahkan parameter topicId dan perbaiki URL
export const deleteCultureEntry = async (topicId, entryId, token) => {
    const response = await axios.delete(`${API_URL_TOPICS}/${topicId}/entries/${entryId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
};