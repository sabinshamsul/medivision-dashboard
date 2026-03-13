const express = require('express');
const router = express.Router();
const axios = require('axios');
const Patient = require('../models/Patient');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:7860';

/**
 * Convert GCS (3-15) to AVPU (0-3)
 * GCS 15       -> A (Alert)        = 0
 * GCS 12-14    -> V (Verbal)       = 1
 * GCS 8-11     -> P (Pain)         = 2
 * GCS 3-7      -> U (Unresponsive) = 3
 */
function gcsToAvpu(gcs) {
  if (gcs >= 15) return 0;
  if (gcs >= 12) return 1;
  if (gcs >= 8) return 2;
  return 3;
}

function computeAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// POST /api/ai/predict
router.post('/predict', async (req, res) => {
  try {
    const { patientId, vitals } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const age = computeAge(patient.dateOfBirth);
    const gender = patient.gender === 'Male' ? 1 : 0;
    const mentalStatus = gcsToAvpu(vitals.gcs);

    const payload = {
      age,
      gender,
      systolic_bp: vitals.systolicBP,
      heart_rate: vitals.heartRate,
      resp_rate: vitals.respiratoryRate,
      spo2: vitals.spO2,
      pain_score: vitals.painScore,
      mental_status: mentalStatus
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, payload, {
      timeout: 15000
    });

    res.json({
      aiPrediction: aiResponse.data,
      mappedFeatures: {
        age,
        gender: patient.gender,
        gcs: vitals.gcs,
        avpu: mentalStatus,
        avpuLabel: ['Alert', 'Verbal', 'Pain', 'Unresponsive'][mentalStatus]
      }
    });
  } catch (error) {
    console.error('AI prediction error:', error.message);

    res.status(200).json({
      aiPrediction: null,
      error: 'AI service unavailable — using rule-based triage only',
      details: error.message
    });
  }
});

module.exports = router;
