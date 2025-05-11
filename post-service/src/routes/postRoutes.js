const express = require('express');
const isAuthenticated = require('../middleware/authMiddleware');
const { createPost } = require('../controllers/postController');

const router = express.Router();

router.use(isAuthenticated);

router.post('/createPost',createPost)



module.exports = router;