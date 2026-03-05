const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { classifyTriage } = require('../utils/triageEngine');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ arrivalTime: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get statistics (must be before /:id)
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const registered = await Patient.countDocuments({ status: 'Registered' });
    const vitalsTaken = await Patient.countDocuments({ status: 'Vitals Taken' });
    const triaged = await Patient.countDocuments({ status: 'Triaged' });
    const inTreatment = await Patient.countDocuments({ status: 'In Treatment' });
    const discharged = await Patient.countDocuments({ status: 'Discharged' });

    const triageStats = await Patient.aggregate([
      { $match: { triageCategory: { $ne: null } } },
      {
        $group: {
          _id: '$triageCategory',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalPatients,
      registered,
      vitalsTaken,
      triaged,
      inTreatment,
      discharged,
      triageStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get queue position (must be before /:id)
router.get('/queue', async (req, res) => {
  try {
    const { icNumber } = req.query;
    if (!icNumber) {
      return res.status(400).json({ message: 'IC number is required' });
    }

    const patient = await Patient.findOne({
      icNumber,
      status: { $in: ['Registered', 'Vitals Taken', 'Triaged'] }
    }).sort({ arrivalTime: -1 });

    if (!patient) {
      return res.status(404).json({ message: 'No active registration found for this IC number' });
    }

    // Count how many Registered patients arrived before this one
    const position = await Patient.countDocuments({
      status: 'Registered',
      arrivalTime: { $lte: patient.arrivalTime }
    });

    const totalWaiting = await Patient.countDocuments({ status: 'Registered' });

    res.json({
      patientId: patient.patientId,
      queueNumber: patient.queueNumber,
      name: patient.name,
      status: patient.status,
      position,
      totalWaiting,
      arrivalTime: patient.arrivalTime
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new patient (Phase 1: self-registration)
router.post('/', async (req, res) => {
  try {
    // Generate patient ID
    const count = await Patient.countDocuments();
    const patientId = `P${String(count + 1).padStart(6, '0')}`;

    // Generate daily queue number
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await Patient.countDocuments({
      arrivalTime: { $gte: startOfDay }
    });
    const queueNumber = todayCount + 1;

    const patient = new Patient({
      patientId,
      queueNumber,
      name: req.body.name,
      icNumber: req.body.icNumber,
      age: req.body.age,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      chiefComplaint: req.body.chiefComplaint,
      status: 'Registered'
    });

    const newPatient = await patient.save();
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Submit vitals and get AI triage recommendation (Phase 2: nurse)
router.post('/:id/vitals', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.status !== 'Registered') {
      return res.status(400).json({ message: 'Vitals can only be submitted for Registered patients' });
    }

    // Save vital signs
    patient.vitalSigns = {
      spO2: req.body.spO2,
      respiratoryRate: req.body.respiratoryRate,
      heartRate: req.body.heartRate,
      systolicBP: req.body.systolicBP,
      diastolicBP: req.body.diastolicBP,
      gcs: req.body.gcs,
      painScore: req.body.painScore,
      temperature: req.body.temperature,
      glucose: req.body.glucose
    };

    // Run AI triage classification
    const triageResult = classifyTriage(patient.vitalSigns);

    patient.aiTriageCategory = triageResult.category;
    patient.aiTriageColor = triageResult.color;
    patient.status = 'Vitals Taken';

    const updatedPatient = await patient.save();

    res.json({
      patient: updatedPatient,
      triageResult
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Confirm or override triage (nurse decision)
router.post('/:id/triage-confirm', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.status !== 'Vitals Taken') {
      return res.status(400).json({ message: 'Triage can only be confirmed for patients with vitals taken' });
    }

    const colorMap = { 1: 'Red', 2: 'Yellow', 3: 'Green' };

    patient.triageCategory = req.body.confirmedCategory;
    patient.triageColor = colorMap[req.body.confirmedCategory];
    patient.nurseOverride = req.body.nurseOverride || false;
    patient.nurseOverrideReason = req.body.nurseOverrideReason || null;
    patient.triagedBy = req.body.triagedBy;
    patient.triageTimestamp = new Date();
    patient.status = 'Triaged';

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update patient
router.patch('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    Object.keys(req.body).forEach(key => {
      patient[key] = req.body[key];
    });

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete patient
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.deleteOne();
    res.json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
