import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;     // ref to User (doctor role)
    doctorName: string;
    clinicName: string;
    clinicAddress: string;
    licenseNumber: string;
    specialization: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        doctorName: { type: String, required: true, trim: true },
        clinicName: { type: String, required: true, trim: true },
        clinicAddress: { type: String, required: true, trim: true },
        licenseNumber: { type: String, required: true, unique: true, trim: true },
        specialization: { type: String, required: true, trim: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    },
    { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
