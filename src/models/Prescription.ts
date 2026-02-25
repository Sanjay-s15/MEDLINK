import mongoose, { Schema, Document } from 'mongoose';

export interface IMedication {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}

export interface IPrescription extends Document {
    _id: mongoose.Types.ObjectId;
    tokenId: mongoose.Types.ObjectId;
    clinicId: mongoose.Types.ObjectId;
    doctorId: mongoose.Types.ObjectId;
    patientId: mongoose.Types.ObjectId;
    patientMobile: string;
    diagnosis: string;
    medications: IMedication[];
    notes?: string;
    followUpDate?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MedicationSchema = new Schema<IMedication>({
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String },
});

const PrescriptionSchema = new Schema<IPrescription>(
    {
        tokenId: { type: Schema.Types.ObjectId, ref: 'Token', required: true },
        clinicId: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
        doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        patientMobile: { type: String, required: true },
        diagnosis: { type: String, required: true },
        medications: { type: [MedicationSchema], required: true },
        notes: { type: String },
        followUpDate: { type: String },
    },
    { timestamps: true }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.model<IPrescription>('Prescription', PrescriptionSchema);
