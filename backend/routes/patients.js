const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Get all patients
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ arrivalTime: -1 });
    res.json(patients);
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

// Create new patient
router.post('/', async (req, res) => {
  try {
    // Generate patient ID
    const count = await Patient.countDocuments();
    const patientId = `P${String(count + 1).padStart(6, '0')}`;

    const patient = new Patient({
      ...req.body,
      patientId
    });

    const newPatient = await patient.save();
    res.status(201).json(newPatient);
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

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const waiting = await Patient.countDocuments({ status: 'Waiting' });
    const inTreatment = await Patient.countDocuments({ status: 'In Treatment' });
    const discharged = await Patient.countDocuments({ status: 'Discharged' });
    
    const triageStats = await Patient.aggregate([
      {
        $group: {
          _id: '$triageCategory',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalPatients,
      waiting,
      inTreatment,
      discharged,
      triageStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
