import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
    _id: mongoose.Types.ObjectId;
    tokenNumber: number;
    clinicId: mongoose.Types.ObjectId;
    doctorId?: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    patientMobile: string;
    patientName: string;
    type: 'online' | 'offline';
    status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
    date: string; // YYYY-MM-DD
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TokenSchema = new Schema<IToken>(
    {
        tokenNumber: { type: Number, required: true },
        clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: 'User' },
        patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        patientMobile: { type: String, required: true },
        patientName: { type: String, required: true },
        type: { type: String, enum: ['online', 'offline'], required: true },
        status: { type: String, enum: ['waiting', 'in_consultation', 'completed', 'cancelled'], default: 'waiting' },
        date: { type: String, required: true },
        reason: { type: String },
    },
    { timestamps: true }
);

// Compound index for daily tokens per clinic
TokenSchema.index({ clinicId: 1, date: 1 });

export default mongoose.model<IToken>('Token', TokenSchema);
