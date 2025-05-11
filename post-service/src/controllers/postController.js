
const logger = require('../utils/logger');
const Post = require('../models/post');


//create post
exports.createPost = async (req, res) => {
    logger.info('create post endpoint.......');
    try {
        const { content,mediaIds } = req.body;

        if (!content) {
            logger.warn('content are required');
            return res.status(400).json({
                success: false,
                message: 'content are required'
            });
        }

        const post = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        });

        await post.save();

        logger.info('post created successfully', post._id);

        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post
        });

    } catch (error) {
        logger.error("Post creation error", error);
        res.status(500).json({
          success: false,
          message: "Post creation error",
        });
    }
}

//get all posts
exports.getAllPosts = async (req, res) => {
    logger.info('get all posts endpoint.......');
    try {
        const posts = await Post.find().populate('user', 'username');

        res.status(200).json({
            success: true,
            message: 'Posts retrieved successfully',
            posts
        });

    } catch (error) {
        logger.error("Get all posts error", error);
        res.status(500).json({
          success: false,
          message: "Get all posts error",
        });
    }
}

//update post
exports.updatePost = async (req, res) => {
    logger.info('update post endpoint.......');
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            logger.warn('title and content are required');
            return res.status(400).json({
                success: false,
                message: 'title and content are required'
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            logger.warn('post not found');
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            logger.warn('user not authorized to update this post');
            return res.status(401).json({
                success: false,
                message: 'User not authorized to update this post'
            });
        }

        post.title = title;
        post.content = content;

        await post.save();

        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post
        });

    } catch (error) {
        logger.error("Update post error", error);
        res.status(500).json({
          success: false,
          message: "Update post error",
        });
    }
}

//getSingle post
exports.getSinglePost = async (req, res) => {
    logger.info('get single post endpoint.......');
    try {
        const post = await Post.findById(req.params.id).populate('user', 'username');

        if (!post) {
            logger.warn('post not found');
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Post retrieved successfully',
            post
        });

    } catch (error) {
        logger.error("Get single post error", error);
        res.status(500).json({
          success: false,
          message: "Get single post error",
        });
    }
}


//delete post
exports.deletePost = async (req, res) => {
    logger.info('delete post endpoint.......');
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            logger.warn('post not found');
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user._id.toString()) {
            logger.warn('user not authorized to delete this post');
            return res.status(401).json({
                success: false,
                message: 'User not authorized to delete this post'
            });
        }

        await post.remove();

        res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        logger.error("Delete post error", error);
        res.status(500).json({
          success: false,
          message: "Delete post error",
        });
    }
}