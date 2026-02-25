import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medlink';
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
    } catch (err: any) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
};

export default connectDB;
