const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

mongoose.connect('mongodb://localhost:27017/smarthealthcare')
    .then(() => console.log('✅ MongoDB connected!'))
    .catch(err => console.log('❌ MongoDB error:', err));

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    name: String,
    phone: String,
    email: String,
    hospital: String,
    doctor: String,
    timeSlot: String,
    date: String,
    reason: String
});
const Appointment = mongoose.model('Appointment', appointmentSchema);

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.post('/api/appointments', async (req, res) => {
    try {
        const { name, phone, email, hospital, doctor, timeSlot, date, reason } = req.body;
        const userId = req.session.userId || 'tempUserId';
        const appointment = new Appointment({ userId, name, phone, email, hospital, doctor, timeSlot, date, reason });
        const saved = await appointment.save();
        console.log('✅ Appointment booked:', saved);
        res.status(201).json(saved);
    } catch (err) {
        console.error('❌ Error saving:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch appointments.' });
    }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        const appointment = await Appointment.findByIdAndDelete(req.params.id);
        if (!appointment) throw new Error('Appointment not found');
        res.status(200).json({ message: 'Appointment cancelled' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/appointments/checkAvailability', async (req, res) => {
    try {
        const { doctor, date, timeSlot } = req.query;
        if (!doctor || !date || !timeSlot) {
            return res.status(400).json({ available: false, error: 'Missing parameters' });
        }
        const existing = await Appointment.findOne({ doctor, date, timeSlot });
        res.json({ available: !existing });
    } catch (err) {
        res.status(500).json({ available: false, error: err.message });
    }
});

app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use' });
        const user = new User({ email, password });
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        req.session.userId = user._id;
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});
app.get('/appointment.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/appointment.html'));
});
app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/about.html'));
});
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/login.html'));
});
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/signup.html'));
});

app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});