import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const generateToken = (userId: mongoose.Types.ObjectId | string, role: string): string => {
    return jwt.sign(
        { userId: userId.toString(), role },
        process.env.JWT_SECRET!,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );
};

// Calculate distance between two lat/lng in km (Haversine formula)
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
};

export const successResponse = (res: any, data: any, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({ success: true, message, data });
};

export const errorResponse = (res: any, message: string, statusCode = 500) => {
    return res.status(statusCode).json({ success: false, message });
};
