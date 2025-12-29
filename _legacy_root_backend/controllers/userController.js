const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    res.status(200).json({ message: 'Login successful', user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const { name, phone, email, hospital, doctor, timeSlot, date, reason } = req.body;
    const appointment = new Appointment({ name, phone, email, hospital, doctor, timeSlot, date, reason });
    const savedAppointment = await appointment.save();
    const transporter = req.app.locals.transporter;
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Appointment Confirmation',
      text: `Your appointment with ${doctor} at ${hospital} on ${new Date(date).toLocaleDateString()} at ${timeSlot} is confirmed.`
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json(savedAppointment);
  } catch (err) {
    res.status(500).json({ error: 'Booking failed' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { doctor, date, timeSlot } = req.query;
    const appointments = await Appointment.find({ doctor, date, timeSlot });
    res.status(200).json({ available: appointments.length === 0 });
  } catch (err) {
    res.status(500).json({ error: 'Availability check failed' });
  }
};