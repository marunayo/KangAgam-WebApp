import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AudioProgressModal = ({ isOpen, message, imageUrl }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                    >
                        {/* Message */}
                        <div className="text-center text-gray-800 text-lg font-medium mb-4">
                            {message}
                        </div>
                        
                        {/* Image */}
                        <div className="flex justify-center mb-4">
                            <img 
                                src={imageUrl || "https://via.placeholder.com/200x200?text=Audio+Processing"}
                                alt="Progress illustration"
                                className="w-48 h-48 object-cover rounded-lg"
                            />
                        </div>
                        
                        {/* Loading spinner or progress indicator */}
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AudioProgressModal;