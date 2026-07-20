const axios = require('axios');
const Doctor = require('../models/Doctor');

// AI Service Configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

/**
 * @desc    Recommend medical specialization based on symptoms using AI
 * @route   POST /api/ai/recommend-specialization
 * @access  Public
 */
const recommendSpecialization = async (req, res) => {
  try {
    const { symptoms } = req.body;

    // Validate input
    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptom description',
      });
    }

    if (symptoms.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Symptom description is too short. Please provide more details.',
      });
    }

    // Call Python AI service
    let aiResponse;
    try {
      aiResponse = await axios.post(
        `${AI_SERVICE_URL}/predict`,
        { symptoms },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000, // 10 second timeout
        }
      );
    } catch (aiError) {
      console.error('AI Service Error:', aiError.message);
      
      if (aiError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'AI service is currently unavailable. Please try again later.',
          error: 'AI_SERVICE_UNAVAILABLE',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to analyze symptoms. Please try again.',
        error: 'AI_SERVICE_ERROR',
      });
    }

    // Extract AI prediction
    const { specialization, confidence, top_predictions } = aiResponse.data;

    if (!specialization) {
      return res.status(500).json({
        success: false,
        message: 'Failed to predict specialization',
        error: 'PREDICTION_FAILED',
      });
    }

    // Query doctors by the recommended specialization
    const recommendedDoctors = await Doctor.find({
      specialization: { $regex: specialization, $options: 'i' },
      status: 'approved',
      isActive: true,
    })
      .populate('userId', 'name email phone')
      .limit(10)
      .sort({ experience: -1 }); // Sort by experience (most experienced first)

    // Add default available slots if missing
    const defaultAvailableSlots = [
      {
        day: 'Monday',
        times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
      },
      {
        day: 'Tuesday',
        times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
      },
      {
        day: 'Wednesday',
        times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
      },
      {
        day: 'Thursday',
        times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
      },
      {
        day: 'Friday',
        times: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
      },
    ];

    const doctorsWithSlots = recommendedDoctors.map((doctor) => ({
      ...doctor.toObject(),
      availableSlots:
        doctor.availableSlots && doctor.availableSlots.length > 0
          ? doctor.availableSlots
          : defaultAvailableSlots,
    }));

    // Return AI prediction and matching doctors
    res.json({
      success: true,
      specialization,
      confidence,
      topPredictions: top_predictions || [],
      doctors: doctorsWithSlots,
      doctorCount: doctorsWithSlots.length,
      message:
        doctorsWithSlots.length > 0
          ? `Found ${doctorsWithSlots.length} ${specialization} specialist(s)`
          : `No ${specialization} specialists currently available`,
      disclaimer:
        '⚠️ This recommendation is intended only to help select an appropriate medical specialization. Please consult with a healthcare professional for proper diagnosis and treatment.',
    });
  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while processing your request',
      error: error.message,
    });
  }
};

/**
 * @desc    Check AI service health
 * @route   GET /api/ai/health
 * @access  Public
 */
const checkAIHealth = async (req, res) => {
  try {
    const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
      timeout: 5000,
    });

    res.json({
      success: true,
      aiService: healthResponse.data,
      nodeBackend: 'healthy',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'AI service is not responding',
      error: error.message,
    });
  }
};

module.exports = {
  recommendSpecialization,
  checkAIHealth,
};
