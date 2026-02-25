import mongoose, { Schema, Document } from 'mongoose';

export interface IClinic extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    status: 'pending' | 'approved' | 'rejected';
    adminId: mongoose.Types.ObjectId;
    openTime: string;
    closeTime: string;
    daysOpen: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ClinicSchema = new Schema<IClinic>(
    {
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        phone: { type: String, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        adminId: { type: Schema.Types.ObjectId, ref: 'User' },
        openTime: { type: String, default: '09:00' },
        closeTime: { type: String, default: '18:00' },
        daysOpen: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    },
    { timestamps: true }
);

// Geospatial index for nearby clinic queries
ClinicSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model<IClinic>('Clinic', ClinicSchema);
