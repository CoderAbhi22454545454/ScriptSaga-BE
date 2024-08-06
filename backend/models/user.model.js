import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
   
  },
  lastName: {
    type: String,
    
  },
  githubID: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  rollNo: {
    type: String,
  
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
