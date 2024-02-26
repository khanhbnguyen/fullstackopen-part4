const { test, describe, beforeEach, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const testHelper = require('./test_helper')

const Blog = require('../models/blog')
const app = require('../app')

const api = supertest(app)

describe('when there are initial blogs', () => {

  beforeEach(async () => {
    await Blog.deleteMany()

    const initialBlogs = testHelper.initialBlogs.map(blog => (new Blog(blog)).save())

    await Promise.all(initialBlogs)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api
      .get('/api/blogs')

    assert.strictEqual(response.body.length, testHelper.initialBlogs.length)
  })

  test('blog returns id and not _id', async () => {
    const response = await api
      .get('/api/blogs')

    const blog = response.body[0]

    assert.notStrictEqual((blog.id), undefined)
    assert.strictEqual((blog._id), undefined)
  })

  test('specific blog is contained in returned blogs', async () => {
    const response = await api
      .get('/api/blogs')

    const titles = response.body.map(blog => blog.title)

    assert.strictEqual(titles.includes('React patterns'), true)
  })

  describe('viewing a specific blog', () => {
    test('succeeds with a valid id', async () => {

      let response = await api
        .get('/api/blogs')

      const validBlog = response.body[0]

      response = await api
        .get(`/api/blogs/${validBlog.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.deepStrictEqual(response.body, validBlog)
    })

    test('fails with code 404 if blog does not exist', async () => {

      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'title': 'The Great Gatsby Test',
        'author': 'F Scott Fitzgerald',
        'url': 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
        'likes': 1
      }

      const response = await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)

      const originalBlog = response.body

      await api
        .delete(`/api/blogs/${originalBlog.id}`)
        .set('Authorization', token)

      await api
        .get(`/api/blogs/${originalBlog.id}`)
        .expect(404)

    })

    test('fails with code 400 if id invalid', async () => {
      await api
        .get('/api/blogs/xxx')
        .expect(400)
    })
  })

  describe('addition of a new blog', () => {
    test('succeeds with valid blog', async () => {

      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'title': 'The Great Gatsby Test',
        'author': 'F Scott Fitzgerald',
        'url': 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
        'likes': 1
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)

      const response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length + 1)

      const postedBlog = response.body[response.body.length - 1]
      newBlog.id = postedBlog.id
      newBlog.user = postedBlog.user

      assert.deepStrictEqual(postedBlog, newBlog)
    })

    test('fails without token', async () => {

      const newBlog =
      {
        'title': 'The Great Gatsby Test',
        'author': 'F Scott Fitzgerald',
        'url': 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
        'likes': 1
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)

      const response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length)
    })

    test('with no likes defaults to 0', async () => {

      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'title': 'The Great Gatsby',
        'author': 'F Scott Fitzgerald',
        'url': 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const response = await api.get('/api/blogs')

      const postedBlog = response.body[response.body.length - 1]

      assert.strictEqual(postedBlog.likes, 0)

      newBlog.likes = 0
      newBlog.id = postedBlog.id
      newBlog.user = postedBlog.user

      assert.deepStrictEqual(postedBlog, newBlog)
    })

    test('with no title fails with code 400', async () => {

      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'author': 'F Scott Fitzgerald',
        'url': 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
        'likes': 1
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)
        .expect(400)

      const response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length)
    })

    test('with no url fails with code 400', async () => {

      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'title': 'The Great Gatsby',
        'author': 'F Scott Fitzgerald',
        'likes': 1
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)
        .expect(400)

      const response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length)
    })

    test('with no title, no url fails with code 400', async () => {


      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'author': 'F Scott Fitzgerald',
        'likes': 1
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)
        .expect(400)

      const response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length)
    })
  })


  describe('deletion of a blog', () => {
    test('succeeds with code 204 for valid id', async () => {

      const loginResponse = await api
        .post('/api/login')
        .send(testHelper.userLogin)

      const token = `Bearer ${loginResponse.body.token}`

      const newBlog =
      {
        'title': 'The Great Gatsby Test',
        'author': 'F Scott Fitzgerald',
        'url': 'https://en.wikipedia.org/wiki/The_Great_Gatsby',
        'likes': 1
      }

      let response = await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)

      const originalBlog = response.body

      await api
        .delete(`/api/blogs/${originalBlog.id}`)
        .set('Authorization', token)

      response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length + 1)

      const result = await Blog.findById(originalBlog.id)

      assert.strictEqual(result, null)
    })
  })

  describe('update of a blog', () => {
    test('succeeds with likes updated for valid blog', async () => {

      let response = await api.get('/api/blogs')

      const oldBlog = response.body[0]

      const updatedBlog = { ...oldBlog }

      updatedBlog.likes = oldBlog.likes + 1

      await api
        .put(`/api/blogs/${oldBlog.id}`)
        .send(updatedBlog)
        .expect('Content-Type', /application\/json/)

      response = await api.get('/api/blogs')

      assert.strictEqual(response.body.length, testHelper.initialBlogs.length)

      const result = await Blog.findById(oldBlog.id)

      assert.strictEqual(result.likes, oldBlog.likes + 1)
    })
  })
})


after(async () => {
  await mongoose.connection.close()
})