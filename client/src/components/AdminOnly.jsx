import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminOnly = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== "admin") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <h1 className="text-4xl font-bold text-red-500">
                    Access Denied
                </h1>
                <p className="mt-4 text-gray-400">
                    You do not have permission to access this page.
                </p>
            </div>
        );
    }

    return children;
};

export default AdminOnly;