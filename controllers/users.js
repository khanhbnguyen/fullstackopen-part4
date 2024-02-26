
const bcrypt = require('bcrypt')

const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {

  const users = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1 })

  response.status(200).json(users)
})

usersRouter.post('/', async (request, response) => {

  if (request.body.username.length < 3) {
    return response.status(400).json({ error: 'username must be at least 3 char long' })
  } else if (request.body.password.length < 3) {
    return response.status(400).json({ error: 'password must be at least 3 char long' })
  }

  const saltRounds = 10

  const hashedPassword = await bcrypt.hash(request.body.password, saltRounds)

  const newUser = new User({
    username: request.body.username,
    name: request.body.name,
    hashedPassword: hashedPassword
  })

  const savedUser = await newUser.save()

  response.status(201).json(savedUser)
})

module.exports = usersRouter
