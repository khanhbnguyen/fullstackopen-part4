const config = require('../utils/config')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const loginRouter = require('express').Router()

const User = require('../models/user')

loginRouter.post('/', async (request, response) => {

  const username = request.body.username
  const password = request.body.password

  const user = await User.findOne({ username: username })

  if (!user) {
    return response.status(404).json({ error: 'user not found!' })
  }

  const checkPassword = await bcrypt.compare(password, user.hashedPassword)

  if (!checkPassword) {
    return response.status(401).json({ error: 'password incorrect' })
  }

  const userToken = {
    username: username,
    id: user._id
  }

  const token = jwt.sign(userToken, config.SECRET)

  response
    .status(200)
    .send({
      token: token,
      username: username,
      id: user._id
    })
})

module.exports = loginRouter