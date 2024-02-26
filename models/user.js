const config = require('../utils/config')
const mongoose = require('mongoose')

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String
    },
    hashedPassword: {
      type: String,
      required: true
    },
    blogs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog'
    }]
  }
)

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString()
    delete ret._id
    delete ret.__v
    delete ret.hashedPassword
  }
})

const mongoUrl = config.MONGODB_URI
mongoose.connect(mongoUrl)

module.exports = mongoose.model('User', userSchema)