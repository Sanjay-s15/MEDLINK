import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IPatient extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: string;   // auto-generated unique ID e.g. ML-2024-XXXXX
    name: string;
    phoneNumber: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
    {
        patientId: { type: String, unique: true, default: () => `ML-${uuidv4().slice(0, 8).toUpperCase()}` },
        name: { type: String, required: true, trim: true },
        phoneNumber: { type: String, required: true, unique: true, trim: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: ['male', 'female', 'other'], required: true },
        address: { type: String, trim: true },
    },
    { timestamps: true }
);

PatientSchema.index({ phoneNumber: 1 });

export default mongoose.model<IPatient>('Patient', PatientSchema);
