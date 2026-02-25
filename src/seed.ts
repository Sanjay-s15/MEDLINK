import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

import User from './models/User';
import Clinic from './models/Clinic';
import Token from './models/Token';
import Prescription from './models/Prescription';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medlink';

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Seeding...');

    // Clear
    await Promise.all([User.deleteMany({}), Clinic.deleteMany({}), Token.deleteMany({}), Prescription.deleteMany({})]);

    // Admin
    const adminPw = await bcrypt.hash('admin123', 10);
    const admin = await User.create({ mobile: '9000000000', name: 'System Admin', role: 'admin', password: adminPw });

    // Clinics
    const clinic1 = await Clinic.create({
        name: 'City Health Clinic',
        address: '12 MG Road, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        phone: '8000000001',
        status: 'approved',
        adminId: admin._id,
        openTime: '09:00',
        closeTime: '18:00',
    });

    const clinic2 = await Clinic.create({
        name: 'Apollo Mini Clinic',
        address: '45 Church Street, Bangalore',
        latitude: 12.9750,
        longitude: 77.6000,
        phone: '8000000002',
        status: 'approved',
        adminId: admin._id,
    });

    // Doctors
    const docPw = await bcrypt.hash('doctor123', 10);
    const doctor1 = await User.create({
        mobile: '9100000001', name: 'Dr. Priya Sharma', role: 'doctor',
        password: docPw, clinicId: clinic1._id, specialization: 'General Physician', regNumber: 'MCI-12345'
    });
    await User.create({
        mobile: '9100000002', name: 'Dr. Arjun Mehta', role: 'doctor',
        password: docPw, clinicId: clinic2._id, specialization: 'Cardiologist', regNumber: 'MCI-67890'
    });

    // Attenders
    const attPw = await bcrypt.hash('attender123', 10);
    const attender1 = await User.create({
        mobile: '9200000001', name: 'Ravi Kumar', role: 'attender',
        password: attPw, clinicId: clinic1._id
    });

    // Patients
    const patient1 = await User.create({ mobile: '9300000001', name: 'Anjali Patel', role: 'patient' });
    const patient2 = await User.create({ mobile: '9300000002', name: 'Suresh Nair', role: 'patient' });
    const patient3 = await User.create({ mobile: '9300000003', name: 'Meena Reddy', role: 'patient' });

    // Tokens for today
    const today = new Date().toISOString().split('T')[0];
    const t1 = await Token.create({ tokenNumber: 1, clinicId: clinic1._id, doctorId: doctor1._id, patientId: patient1._id, patientMobile: patient1.mobile, patientName: patient1.name, type: 'online', status: 'completed', date: today });
    const t2 = await Token.create({ tokenNumber: 2, clinicId: clinic1._id, doctorId: doctor1._id, patientId: patient2._id, patientMobile: patient2.mobile, patientName: patient2.name, type: 'offline', status: 'in_consultation', date: today });
    await Token.create({ tokenNumber: 3, clinicId: clinic1._id, doctorId: doctor1._id, patientId: patient3._id, patientMobile: patient3.mobile, patientName: patient3.name, type: 'online', status: 'waiting', date: today });

    // Prescription
    await Prescription.create({
        tokenId: t1._id,
        clinicId: clinic1._id,
        doctorId: doctor1._id,
        patientId: patient1._id,
        patientMobile: patient1.mobile,
        diagnosis: 'Viral Fever',
        medications: [
            { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days', instructions: 'After meals' },
            { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once at night', duration: '3 days' }
        ],
        notes: 'Rest and drink plenty of fluids.',
        followUpDate: new Date(Date.now() + 3 * 86400 * 1000).toISOString().split('T')[0],
    });

    console.log('\n✅ Seed complete!\n');
    console.log('--- Login Credentials ---');
    console.log('Admin:    9000000000 / admin123');
    console.log('Doctor:   9100000001 / doctor123  (City Health Clinic)');
    console.log('Doctor:   9100000002 / doctor123  (Apollo Mini Clinic)');
    console.log('Attender: 9200000001 / attender123 (City Health Clinic)');
    console.log('Patient:  9300000001 (OTP login — check server console)');
    console.log('Patient:  9300000002');
    console.log('Patient:  9300000003');
    console.log('-------------------------\n');

    await mongoose.disconnect();
}

seed().catch(console.error);
