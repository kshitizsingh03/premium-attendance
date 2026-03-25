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

const calculateOvertime = (in_time, out_time, shift = 'Day') => {
    if (!in_time || !out_time) return 0;
    
    // Convert time strings (HH:mm) to minutes from midnight
    const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const actualIn = toMinutes(in_time);
    const actualOut = toMinutes(out_time);
    
    let overtime = 0;

    if (shift === 'Day') {
        // Day Shift: 08:00 to 17:00
        const stdIn = 8 * 60;   // 08:00 am
        const stdOut = 17 * 60; // 05:00 pm
        
        if (actualIn < stdIn) overtime += (stdIn - actualIn) / 60;
        if (actualOut > stdOut) overtime += (actualOut - stdOut) / 60;
    } else if (shift === 'Night') {
        // Night Shift: 20:00 (8 PM) to 05:00 (5 AM next day)
        const stdIn = 20 * 60;  // 08:00 pm
        const stdOut = 5 * 60;   // 05:00 am
        
        // Before 8:00 PM
        if (actualIn < stdIn && actualIn >= 5 * 60) {
            // Note: If you come at say 4:00 PM (16:00), you are 4 hours earlier than 8:00 PM.
            // But what if it's 4:00 AM? That's actually before the 5:00 AM out time.
            // For simplicity, let's assume workers come for night shift in the afternoon/evening.
            overtime += (stdIn - actualIn) / 60;
        } else if (actualIn < stdOut) {
             // This case means you came even before the Previous shift's end? 
             // Unlikely but let's stick to the prompt's simplicity.
        }
        
        // After 5:00 AM
        if (actualOut > stdOut && actualOut <= 17 * 60) {
            overtime += (actualOut - stdOut) / 60;
        }
    }
    
    return Math.max(0, parseFloat(overtime.toFixed(2)));
};

// --- AUTHENTICATION ---
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    try {
        const hash = bcrypt.hashSync(password, 10);
        await Admin.create({ username, password: hash });
        res.json({ success: true });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ error: 'Username already exists' });
        res.status(500).json({ error: error.message });
    }
});

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
    const { employee_id, date, status, in_time, out_time, shift } = req.body;
    
    let overtime_hours = 0;
    if (status === 'P') {
        overtime_hours = calculateOvertime(in_time, out_time, shift);
    }

    try {
        await Attendance.findOneAndUpdate(
            { employee_id, date },
            { 
                status, 
                in_time: in_time || '', 
                out_time: out_time || '', 
                overtime_hours 
            },
            { upsert: true, new: true }
        );
        logAudit('UPDATE_ATTENDANCE', { employee_id, date, status, in_time, out_time, overtime_hours, shift });
        res.json({ success: true, overtime_hours });
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
