import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'patient' | 'doctor' | 'attender' | 'admin';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    mobile: string;
    name: string;
    role: UserRole;
    email?: string;
    password?: string; // for doctor/attender/admin
    clinicId?: mongoose.Types.ObjectId;
    specialization?: string;
    regNumber?: string; // medical registration number for doctors
    isActive: boolean;
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        mobile: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        role: { type: String, enum: ['patient', 'doctor', 'attender', 'admin'], required: true },
        email: { type: String, trim: true, lowercase: true },
        password: { type: String }, // hashed
        clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic' },
        specialization: { type: String },
        regNumber: { type: String },
        isActive: { type: Boolean, default: true },
        otp: { type: String },
        otpExpiry: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
