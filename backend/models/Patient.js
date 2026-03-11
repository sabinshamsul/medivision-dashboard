const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  queueNumber: {
    type: Number
  },
  name: {
    type: String,
    required: true
  },
  icNumber: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Registered', 'Vitals Taken', 'Triaged', 'In Treatment', 'Discharged'],
    default: 'Registered'
  },

  // Vital signs (entered by nurse in Phase 2)
  vitalSigns: {
    spO2: Number,
    respiratoryRate: Number,
    heartRate: Number,
    systolicBP: Number,
    diastolicBP: Number,
    gcs: Number,
    painScore: Number,
    temperature: Number,
    glucose: Number
  },

  // Triage fields
  triageCategory: {
    type: Number,
    min: 1,
    max: 3,
    default: null
  },
  triageColor: {
    type: String,
    enum: ['Red', 'Yellow', 'Green'],
    default: null
  },

  // AI triage recommendation
  aiTriageCategory: {
    type: Number,
    min: 1,
    max: 3
  },
  aiTriageColor: {
    type: String,
    enum: ['Red', 'Yellow', 'Green']
  },

  // Nurse override
  nurseOverride: {
    type: Boolean,
    default: false
  },
  nurseOverrideReason: {
    type: String
  },
  triagedBy: {
    type: String
  },
  triageTimestamp: {
    type: Date
  },

  assignedDoctor: {
    type: String,
    default: null
  },

  // Location assignment based on triage category (Malaysian ER activity diagram)
  assignedLocation: {
    type: String,
    enum: ['Resuscitation Zone', 'ED Bed', 'Waiting Area'],
    default: null
  },

  // Treatment record (entered by clinician)
  treatment: {
    provisionalDiagnosis: String,
    clinicalNotes: String,
    treatmentGiven: String,
    disposition: {
      type: String,
      enum: ['Discharge', 'Admit', 'Referral']
    },
    dispositionReason: String,
    treatedBy: String,
    treatmentStartTime: Date,
    treatmentEndTime: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
