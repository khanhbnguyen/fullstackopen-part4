const config = require('../utils/config')
const jwt = require('jsonwebtoken')

const blogsRouter = require('express').Router()

const Blog = require('../models/blog')
const User = require('../models/user')

const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {

  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })

  response.status(200).json(blogs)

})

blogsRouter.get('/:id', async (request, response) => {

  const blog = await Blog.findById(request.params.id).populate('user', { username: 1, name: 1 })

  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.post('/', middleware.userExtractor, async (request, response) => {

  const decodedToken = jwt.verify(request.token, config.SECRET)

  if (!decodedToken) {
    return response.status(401).json({ error: 'invalid token' })
  }

  const user = await User.findById(decodedToken.id)

  const blog = new Blog(request.body)

  if (!blog.likes) {
    blog.likes = 0
  }

  blog.user = user._id

  const result = await blog.save()

  user.blogs = user.blogs.concat(blog._id)

  await user.save()

  response.status(201).json(result)
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response) => {

  const decodedToken = jwt.verify(request.token, config.SECRET)

  if (!decodedToken) {
    return response.status(401).json({ error: 'invalid token' })
  }

  const blog = await Blog.findById(request.params.id)

  if (blog.user.toString() !== decodedToken.id.toString()) {
    return response.status(401).json({ error: 'you did not create this blog!' })
  }

  await Blog.findByIdAndDelete(request.params.id)

  response.status(204).end()
})

blogsRouter.put('/:id', async (request, response) => {

  const updatedBlog = { ...request.body }

  await Blog.findByIdAndUpdate(request.params.id, updatedBlog, { new: true, runValidators: true, context: 'query' })

  response.json(updatedBlog)
})

module.exports = blogsRouter