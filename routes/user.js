const express = require('express')
const router = express.Router()
// Controller
const userController = require('../controller/user')
const authController = require('../controller/auth')
// Utils
const { uploadModuleAssignField } = require('../service/upload')
const { isAuth } = require('../service/auth.js')

router
  .route('/')
  .get(userController.getAllUser)
  .delete(userController.deleteAllUser)

router
  .route('/profile')
  .get(isAuth, authController.getProfile) // 取得個人資料
  .patch(
    isAuth,
    uploadModuleAssignField.single('avatar'),
    authController.updateProfile) // 更新個人資料

// 註冊
router.post('/sign_up', authController.signup)
// 登入
router.post('/sign_in', authController.signin)
// 重設密碼
router.patch('/updatePassword',
  isAuth,
  authController.updatePassword)

// 取得個人追蹤名單
router.get('/following', isAuth, userController.getFollowing)

// 追蹤朋友
router.post('/:id/follow', isAuth, userController.followUser)
// 取消追蹤朋友
router.delete('/:id/unfollow', isAuth, userController.unFollowUser)


module.exports = router