const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
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
  triageCategory: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  status: {
    type: String,
    enum: ['Waiting', 'In Treatment', 'Discharged'],
    default: 'Waiting'
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: Date,
    default: Date.now
  },
  assignedDoctor: {
    type: String,
    default: null
  },
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    oxygenSaturation: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Patient', patientSchema);
