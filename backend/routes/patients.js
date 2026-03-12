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

    // Average triage time: arrivalTime → triageTimestamp (minutes)
    const triageTimeAgg = await Patient.aggregate([
      { $match: { triageTimestamp: { $ne: null }, arrivalTime: { $ne: null } } },
      { $project: { d: { $divide: [{ $subtract: ['$triageTimestamp', '$arrivalTime'] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: '$d' } } }
    ]);

    // Average waiting time: triageTimestamp → treatment.treatmentStartTime (minutes)
    const waitingTimeAgg = await Patient.aggregate([
      { $match: { triageTimestamp: { $ne: null }, 'treatment.treatmentStartTime': { $ne: null } } },
      { $project: { d: { $divide: [{ $subtract: ['$treatment.treatmentStartTime', '$triageTimestamp'] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: '$d' } } }
    ]);

    // Average consultation time: treatmentStartTime → treatmentEndTime (minutes)
    const consultTimeAgg = await Patient.aggregate([
      { $match: { 'treatment.treatmentStartTime': { $ne: null }, 'treatment.treatmentEndTime': { $ne: null } } },
      { $project: { d: { $divide: [{ $subtract: ['$treatment.treatmentEndTime', '$treatment.treatmentStartTime'] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: '$d' } } }
    ]);

    const edCongestion = await Patient.countDocuments({ status: { $ne: 'Discharged' } });

    // Active = not yet discharged AND no final disposition recorded.
    // Waiting Area counts only Registered patients (pre-triage) + Cat 3 triaged patients.
    const activeFilter = {
      status: { $ne: 'Discharged' },
      'treatment.disposition': { $nin: ['Discharge', 'Admit', 'Referral'] },
    };
    const resusOccupied   = await Patient.countDocuments({ triageCategory: 1, ...activeFilter });
    const edBedOccupied   = await Patient.countDocuments({ triageCategory: 2, ...activeFilter });
    const waitingOccupied = await Patient.countDocuments({
      $or: [{ triageCategory: 3 }, { status: 'Registered' }],
      ...activeFilter,
    });

    // Average Length of Stay: arrivalTime → treatment.treatmentEndTime (minutes)
    const losAgg = await Patient.aggregate([
      { $match: { 'treatment.treatmentEndTime': { $ne: null }, arrivalTime: { $ne: null } } },
      { $project: { d: { $divide: [{ $subtract: ['$treatment.treatmentEndTime', '$arrivalTime'] }, 60000] } } },
      { $group: { _id: null, avg: { $avg: '$d' } } }
    ]);

    const round1 = (v) => v != null ? Math.round(v * 10) / 10 : null;

    res.json({
      totalPatients,
      registered,
      vitalsTaken,
      triaged,
      inTreatment,
      discharged,
      triageStats,
      averageTriageTime: round1(triageTimeAgg[0]?.avg),
      averageWaitingTime: round1(waitingTimeAgg[0]?.avg),
      averageConsultationTime: round1(consultTimeAgg[0]?.avg),
      averageLOS: round1(losAgg[0]?.avg),
      edCongestion,
      resusOccupied,
      edBedOccupied,
      waitingOccupied,
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
      ...patient.toObject(),
      position,
      totalWaiting
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
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      contactNumber: req.body.contactNumber,
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

    // Auto-assign location based on Malaysian ER activity diagram
    const locationMap = {
      1: 'Resuscitation Zone',  // Cat 1 (Red) - Immediate resus
      2: 'ED Bed',              // Cat 2 (Yellow) - Urgent but stable
      3: 'Waiting Area'         // Cat 3 (Green) - Non-urgent
    };
    patient.assignedLocation = locationMap[req.body.confirmedCategory] || 'Waiting Area';

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Complete treatment (clinician)
router.post('/:id/treatment', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.status !== 'In Treatment') {
      return res.status(400).json({ message: 'Treatment can only be completed for patients currently in treatment' });
    }

    const { provisionalDiagnosis, clinicalNotes, treatmentGiven, disposition, dispositionReason, treatedBy } = req.body;

    if (!provisionalDiagnosis || !provisionalDiagnosis.trim()) {
      return res.status(400).json({ message: 'Provisional diagnosis is required' });
    }
    if (!disposition || !['Discharge', 'Admit', 'Referral'].includes(disposition)) {
      return res.status(400).json({ message: 'Valid disposition is required (Discharge, Admit, or Referral)' });
    }
    if (!dispositionReason || !dispositionReason.trim()) {
      return res.status(400).json({ message: 'Reason for disposition is required' });
    }

    patient.treatment = {
      provisionalDiagnosis: provisionalDiagnosis.trim(),
      clinicalNotes: clinicalNotes || '',
      treatmentGiven: treatmentGiven || '',
      disposition,
      dispositionReason: dispositionReason.trim(),
      treatedBy: treatedBy || patient.assignedDoctor,
      treatmentStartTime: patient.updatedAt,
      treatmentEndTime: new Date()
    };

    patient.status = 'Discharged';

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
