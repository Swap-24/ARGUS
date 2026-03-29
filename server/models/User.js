import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  true,
      unique:    true,
      trim:      true,
      minlength: 2,
      maxlength: 30,
    },
    email: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },
    password: {
      type:     String,
      required: true,
    },
    elo: {
      type:    Number,
      default: 1200,
      index:   true,
    },
    wins:   { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws:  { type: Number, default: 0 },
    matchHistory: [{
      opponentUsername: String,
      result:          { type: String, enum: ['win', 'loss', 'draw'] },
      eloChange:       Number,
      newElo:          Number,
      topic:           String,
      date:            { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User