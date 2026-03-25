const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/premium_attendance';
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        if (err.message.includes('authentication failed')) {
            console.error('❌ MONGODB AUTHENTICATION FAILED. Please check your password in the .env file.');
        } else {
            console.error('❌ MongoDB connection error:', err.message);
        }
        // Instead of exiting, we'll let it stay running but requests will fail.
        // This is better for Render which often monitors simple health checks.
    }
};

const adminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: String,
    shift: { type: String, default: 'Day' },
    base_salary: { type: Number, default: 0 },
    overtime_rate: { type: Number, default: 0 },
}, { timestamps: true });
const Employee = mongoose.model('Employee', employeeSchema);

const attendanceSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: { type: String, required: true, enum: ['P', 'A', 'L'] },
    in_time: { type: String, default: '' },
    out_time: { type: String, default: '' },
    overtime_hours: { type: Number, default: 0 }
});
attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model('Attendance', attendanceSchema);

const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    details: { type: Object, required: true },
}, { timestamps: true });
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { connectDB, Admin, Employee, Attendance, AuditLog };
