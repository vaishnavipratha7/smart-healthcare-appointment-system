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
  triggerScheduledJob,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const { validateCreateDoctor, validateTriggerJob, validateMongoId } = require('../middleware/validators');

router.use(protect);
router.use(checkRole('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', validateMongoId('id'), toggleUserStatus);
router.delete('/users/:id', validateMongoId('id'), deleteUser);
router.get('/doctors', getAllDoctors);
router.post('/doctors', validateCreateDoctor, createDoctor);
router.put('/doctors/:id/approve', validateMongoId('id'), approveDoctor);
router.put('/doctors/:id/reject', validateMongoId('id'), rejectDoctor);
router.delete('/doctors/:id', validateMongoId('id'), deleteDoctor);
router.get('/appointments', getAllAppointments);
router.post('/jobs/trigger', validateTriggerJob, triggerScheduledJob);

module.exports = router;