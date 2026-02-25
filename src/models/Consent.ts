import mongoose, { Schema, Document } from 'mongoose';

export interface IConsent extends Document {
    _id: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    patientMobile: string;
    doctorId: mongoose.Types.ObjectId;
    doctorName: string;
    clinicId: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'denied' | 'expired';
    otp?: string;
    otpExpiry?: Date;
    expiresAt?: Date; // approved access expiry
    respondedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ConsentSchema = new Schema<IConsent>(
    {
        patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        patientMobile: { type: String, required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        doctorName: { type: String },                                    // optional — populated at create time
        clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic' },     // optional — not all doctors have a clinic
        status: { type: String, enum: ['pending', 'approved', 'denied', 'expired'], default: 'pending' },
        otp: { type: String },
        otpExpiry: { type: Date },
        expiresAt: { type: Date },
        respondedAt: { type: Date },
    },
    { timestamps: true }
);

ConsentSchema.index({ patientId: 1, doctorId: 1, status: 1 });

export default mongoose.model<IConsent>('Consent', ConsentSchema);
