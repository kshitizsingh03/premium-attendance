const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connectDB, Admin, Employee, Attendance, AuditLog } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-premium-key-change-me-in-prod';

// Initialize MongoDB
connectDB();

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const logAudit = async (action, details) => {
    try {
        await AuditLog.create({ action, details });
    } catch (e) {
        console.error('Audit Log Error:', e);
    }
};

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Admin.findOne({ username });
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ username: user.username, id: user._id }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ token, username: user.username });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use('/api', authenticateToken);

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find().sort({ name: 1 });
        // Format to match frontend expectations (id instead of _id)
        const formatted = employees.map(e => ({
            id: e._id, name: e.name, role: e.role, shift: e.shift, 
            base_salary: e.base_salary, overtime_rate: e.overtime_rate
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/employees', async (req, res) => {
    const { name, role, shift, base_salary, overtime_rate } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    try {
        const emp = await Employee.create({ name, role, shift, base_salary, overtime_rate });
        res.json({ id: emp._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        await Employee.findByIdAndUpdate(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- ATTENDANCE ---
app.get('/api/attendance', async (req, res) => {
    const { month } = req.query; // YYYY-MM
    try {
        let query = {};
        if (month) query.date = { $regex: `^${month}` };
        
        const records = await Attendance.find(query);
        const formatted = records.map(r => ({ ...r.toObject(), id: r._id }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/attendance', async (req, res) => {
    const { employee_id, date, status, overtime_hours } = req.body;
    if (overtime_hours < 0) return res.status(400).json({ error: 'Overtime cannot be negative' });

    try {
        await Attendance.findOneAndUpdate(
            { employee_id, date },
            { status, overtime_hours: overtime_hours || 0 },
            { upsert: true, new: true }
        );
        logAudit('UPDATE_ATTENDANCE', { employee_id, date, status, overtime_hours });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/attendance/overtime', async (req, res) => {
    const { employee_id, date, overtime_hours } = req.body;
    if (overtime_hours < 0) return res.status(400).json({ error: 'Overtime cannot be negative' });

    try {
        await Attendance.findOneAndUpdate(
            { employee_id, date },
            { $set: { overtime_hours }, $setOnInsert: { status: 'P' } },
            { upsert: true, new: true }
        );
        logAudit('PATCH_OVERTIME', { employee_id, date, overtime_hours });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/attendance', async (req, res) => {
    const { employee_id, date } = req.body;
    try {
        await Attendance.findOneAndDelete({ employee_id, date });
        logAudit('DELETE_ATTENDANCE', { employee_id, date });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- SALARY & DASHBOARD ---
app.get('/api/salary', async (req, res) => {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ error: 'Month is required' });

    try {
        // Aggregate attendance per employee for the specific month
        const attendanceMatch = await Attendance.aggregate([
            { $match: { date: { $regex: `^${month}` } } },
            { $group: {
                _id: "$employee_id",
                total_overtime_hours: { $sum: "$overtime_hours" },
                present_days: { $sum: { $cond: [{ $eq: ["$status", "P"] }, 1, 0] } },
                absent_days: { $sum: { $cond: [{ $eq: ["$status", "A"] }, 1, 0] } },
                leave_days: { $sum: { $cond: [{ $eq: ["$status", "L"] }, 1, 0] } }
            }}
        ]);

        const employees = await Employee.find();
        
        const augmented = employees.map(e => {
            const att = attendanceMatch.find(a => a._id.toString() === e._id.toString()) || {
                total_overtime_hours: 0, present_days: 0, absent_days: 0, leave_days: 0
            };
            const overtime_bonus = att.total_overtime_hours * e.overtime_rate;
            const total_salary = e.base_salary + overtime_bonus;
            return {
                id: e._id, name: e.name, base_salary: e.base_salary, overtime_rate: e.overtime_rate,
                total_overtime_hours: att.total_overtime_hours,
                present_days: att.present_days,
                absent_days: att.absent_days,
                leave_days: att.leave_days,
                overtime_bonus, total_salary
            };
        });
        
        res.json(augmented);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/summary', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const totalEmployees = await Employee.countDocuments();
        const presentToday = await Attendance.countDocuments({ date: today, status: 'P' });
        
        // aggregate overtime hours for today
        const otAgg = await Attendance.aggregate([
            { $match: { date: today } },
            { $group: { _id: null, total: { $sum: "$overtime_hours" } } }
        ]);
        const overtimeToday = otAgg.length > 0 ? otAgg[0].total : 0;

        res.json({ totalEmployees, presentToday, overtimeToday, today });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
