// Utils
const {
  successHandle,
} = require('../utils/resHandle.js')
const ApiState = require('../utils/apiState')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError');
// Model
const Post = require('../model/posts')
const Comment = require('../model/comments')
// Service
const { uploadImage } = require('../service/upload')

/*
  "_id": "6270124640850c16bd444af3",
  "user": {
      "_id": "627011d72b9eee3731a2972c",
      "name": "Hazel",
      "avatar": "http://placeimg.com/640/480"
  },
  "content": "今天要喝Aaron Turner牌的咖啡",
  "image": "http://placeimg.com/640/480",
  "likes": 0
*/
const getAllPost = catchAsync(async (req, res, next) => {
  // 貼文建立時間排序，ASC 正序遞增
  const timeSort = req.query.sort === 'asc' ? 'createdAt' : '-createdAt'
  const q = req.query.q !== undefined
    ? { "content": new RegExp(req.query.q) }
    : {}

  const data = await Post
    .find(q)
    .populate({
      path: 'user',
      select: 'name avatar'
    })
    .populate({
      path: 'comments',
      select: 'comment user'
    })
    .sort(timeSort)

  successHandle({ res, data })
})

const getSinglePost = catchAsync(async (req, res, next) => {
  const { id } = req.params
  if (!id) return next(new AppError(ApiState.FIELD_MISSING))

  const post = await Post
    .find({ _id: id })
    .populate({
      path: 'user',
      select: 'name avatar'
    })
    .populate({
      path: 'comments'
    })

  if (post.length === 0) return next(new AppError(ApiState.DATA_NOT_EXIST))

  successHandle({ res, data: post })
})

const createPost = catchAsync(async (req, res, next) => {
  const { content, name } = req.body
  if (!content || !name) return next(new AppError(ApiState.FIELD_MISSING))
  if (!req.file) return next(new AppError(ApiState.FIELD_MISSING))

  const encodeImage = req.file.buffer.toString('base64')
  const { data: imgUrl } = await uploadImage(encodeImage)

  // 上傳圖片
  const data = await Post.create({
    user: req.user.id,
    content,
    image: imgUrl?.data?.link,
    name
  })

  if (data) {
    successHandle({
      res,
      statusCode: 201,
      message: '新增成功',
      data
    })
  }
})

// 刪除全部 Post
const deleteAllPost = catchAsync(async (req, res, next) => {
  await Post.deleteMany()
  const data = await Post.find({})
  successHandle({ res, data })
})

// 刪除單筆 Post
const deletePost = catchAsync(async (req, res, next) => {
  const { id } = req.params
  if (!id) return next(new AppError(ApiState.FIELD_MISSING))

  const data = await Post.findByIdAndDelete({ _id: id })

  if (!data) return next(new AppError(ApiState.DATA_NOT_EXIST))

  successHandle({
    res,
    statusCode: 200,
    message: '刪除成功',
    data
  })
})

const updatePost = catchAsync(async (req, res, next) => {
  const _id = req.params.id

  const { content, name, image, likes } = req.body

  if (!content || !name) return next(new AppError(ApiState.FIELD_MISSING))

  const data = await Post.findByIdAndUpdate(
    { _id },
    { content, image, name, likes }
  )

  if (!data) return next(new AppError(ApiState.DATA_NOT_EXIST))

  const list = await Post.find({ _id })

  if (!list) return next(new AppError(ApiState.DATA_NOT_EXIST))

  successHandle({ res, data: list })

})

// 貼文按讚 [post] /:id/likes
const likeSinglePost = catchAsync(async (req, res, next) => {
  const { id } = req.params
  if (!id) return next(new AppError(ApiState.FIELD_MISSING))

  const post = await Post.findOneAndUpdate(
    { _id: id },
    { $addToSet: { likes: req.user.id } },
    { new: true } // 回傳改過的資料
  )

  if (!post) return next(new AppError(ApiState.DATA_NOT_EXIST))

  successHandle({
    res,
    data: {
      likesCount: post.likes.length,
      user_id: req.user.id,
      post_id: id,
      post
    }
  })
})

// 貼文取消讚 [delete] /api/posts/:id/likes
const noLikeSinglePost = catchAsync(async (req, res, next) => {
  const { id } = req.params
  if (!id) return next(new AppError(ApiState.FIELD_MISSING))

  const post = await Post.findOneAndUpdate(
    { _id: id },
    { $pull: { likes: req.user.id } },
    { new: true } // 回傳改過的資料
  )

  if (!post) return next(new AppError(ApiState.DATA_NOT_EXIST))

  successHandle({
    res,
    data: {
      likesCount: post.likes.length,
      user_id: req.user.id,
      post_id: id
    }
  })
})

// 取得個人貼文列表 [GET] /api/posts/users/:id
const getMyPost = catchAsync(async (req, res, next) => {
  const { id } = req.params
  if (!id) return next(new AppError(ApiState.FIELD_MISSING))

  const myPosts = await Post.find({ user: id })
  if (!myPosts) return next(new AppError(ApiState.DATA_NOT_EXIST))

  successHandle({
    res,
    data: {
      posts: myPosts,
      results: myPosts.length
    }
  })
})

// 取得按讚列表 [GET] /api/posts/getLikeList
const getLikeList = catchAsync(async (req, res, next) => {
  const likeList = await Post
    .find({ likes: { $in: [req.user.id] } })
    .populate({
      path: 'user',
      select: 'name _id email avatar'
    })

  successHandle({
    res,
    data: likeList
  })
})

const createComment = catchAsync(async (req, res, next) => {
  const { comment } = req.body
  const post = req.params.id

  if (!comment) return next(new AppError(ApiState.FIELD_MISSING))

  const newComment = await Comment.create({
    comment,
    post,
    user: req.user
  })

  successHandle({
    res,
    data: newComment
  })
})



module.exports = {
  getAllPost,
  createPost,
  deleteAllPost,
  getSinglePost,
  deletePost,
  updatePost,
  likeSinglePost,
  noLikeSinglePost,
  getMyPost,
  getLikeList,
  createComment
}