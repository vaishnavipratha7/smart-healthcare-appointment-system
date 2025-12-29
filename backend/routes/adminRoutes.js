const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getAllDoctors,
  approveDoctor,
  rejectDoctor,
  createDoctor,
  deleteDoctor,
  getAllAppointments,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');

router.use(protect);
router.use(checkRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/doctors', getAllDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id/approve', approveDoctor);
router.put('/doctors/:id/reject', rejectDoctor);
router.delete('/doctors/:id', deleteDoctor);
router.get('/appointments', getAllAppointments);

module.exports = router;