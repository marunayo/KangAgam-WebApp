// Create a new file: components/guards/TopicRouteGuard.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';

// MongoDB ObjectId validation function
const isValidObjectId = (id) => {
    // Check if the ID is a valid MongoDB ObjectId format (24 hex characters)
    return /^[0-9a-fA-F]{24}$/.test(id);
};

const TopicRouteGuard = ({ children }) => {
    const { topicId } = useParams();

    // If topicId is invalid, show 404 page immediately
    if (!isValidObjectId(topicId)) {
        return <NotFoundPage />;
    }

    // If topicId is valid, render the actual component
    return children;
};

export default TopicRouteGuard;