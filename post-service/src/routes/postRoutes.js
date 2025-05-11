const express = require('express');
const isAuthenticated = require('../middleware/authMiddleware');
const { createPost, getAllPosts, getSinglePost, deletePost } = require('../controllers/postController');

const router = express.Router();

router.use(isAuthenticated);

router.post('/createPost',createPost)
router.get('/getAllPosts',getAllPosts)
router.get('/getPost/:id',getSinglePost)
router.delete('/deletePost/:id',deletePost)



module.exports = router;