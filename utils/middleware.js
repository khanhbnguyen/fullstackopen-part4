const config = require('../utils/config')
const jwt = require('jsonwebtoken')

const errorHandler = (error, request, response, next) => {

  if (error.name === 'ValidationError') {
    return response.status(400).end()
  } else if (error.name === 'CastError') {
    return response.status(400).end()
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `username` to be unique' })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'invalid token' })
  }

  next(error)

}

const tokenExtractor = (request, response, next) => {

  let token = null

  const authorization = request.get('authorization')

  if (authorization && authorization.startsWith('Bearer ')) {
    token = authorization.replace('Bearer ', '')
  }

  request.token = token

  next()
}

const userExtractor = (request, response, next) => {

  let token = null

  const authorization = request.get('authorization')

  if (authorization && authorization.startsWith('Bearer ')) {
    token = authorization.replace('Bearer ', '')
  }

  const decodedToken = jwt.verify(token, config.SECRET)

  request.user = decodedToken.username

  next()
}

module.exports = {
  errorHandler,
  tokenExtractor,
  userExtractor
}