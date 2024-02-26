const { test, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
// const testHelper = require('./test_helper')
const bcrypt = require('bcrypt')

const User = require('../models/user')
const app = require('../app')

const api = supertest(app)

beforeEach(async () => {

  await User.deleteMany()

  const saltRounds = 10

  const hashedPassword = await bcrypt.hash('password', saltRounds)

  const firstUser = new User({
    username: 'root',
    name: 'Khanh Nguyen',
    hashedPassword: hashedPassword,
  })

  await firstUser.save()

})

test('get all users', async () => {
  const response = await api
    .get('/api/users')
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.length, 1)
})

test('post user succeeds with code 201 for valid user', async () => {

  const newUser = {
    username: 'firstAddedUser',
    name: 'Khanh Nguyen II',
    password: 'password'
  }

  let response = await api
    .post('/api/users')
    .send(newUser)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.username, newUser.username)
  assert.strictEqual(response.body.name, newUser.name)

  response = await api.get('/api/users')

  assert.strictEqual(response.body.length, 2)
})

test('post user fails with 400 for username not min length', async () => {

  const newUser = {
    username: 'fi',
    name: 'Khanh Nguyen II',
    password: 'password'
  }

  let response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.error.includes('username must be at least 3 char long'), true)

  response = await api.get('/api/users')

  assert.strictEqual(response.body.length, 1)
})

test('post user fails with 400 for password not min length', async () => {

  const newUser = {
    username: 'firstAddedUser',
    name: 'Khanh Nguyen II',
    password: 'pa'
  }

  let response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.error.includes('password must be at least 3 char long'), true)

  response = await api.get('/api/users')

  assert.strictEqual(response.body.length, 1)
})

test('post user fails with 400 for non-unique username', async () => {

  const newUser = {
    username: 'root',
    name: 'Khanh Nguyen II',
    password: 'password'
  }

  let response = await api
    .post('/api/users')
    .send(newUser)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.error.includes('expected `username` to be unique'), true)

  response = await api.get('/api/users')

  assert.strictEqual(response.body.length, 1)
})

test('login with valid user succeeds with code 200', async () => {

  const userLogin = {
    username: 'root',
    password: 'password'
  }

  const response = await api
    .post('/api/login')
    .send(userLogin)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.username, userLogin.username)
  assert.notStrictEqual(response.body.token, undefined)

})

test('login with wrong user fails with 404', async () => {

  const userLogin = {
    username: 'firstAddedUser',
    password: 'password'
  }

  const response = await api
    .post('/api/login')
    .send(userLogin)
    .expect(404)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.error.includes('user not found!'), true)

})

test('login with wrong password fails with 401', async () => {

  const userLogin = {
    username: 'root',
    password: 'wrongPassword'
  }

  const response = await api
    .post('/api/login')
    .send(userLogin)
    .expect(401)
    .expect('Content-Type', /application\/json/)

  assert.strictEqual(response.body.error.includes('password incorrect'), true)

})

after(async () => {
  await mongoose.connection.close()
})