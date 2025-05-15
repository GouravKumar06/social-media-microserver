
const logger = require('../utils/logger');
const Post = require('../models/post');
const { publishEvent } = require('../utils/rabbitmq');


async function invalidatePostCache(req, input) {
    const cacheSingleKey = `post:${input}`;
    await req.redisClient.del(cacheSingleKey);
    const keys = await req.redisClient.keys(`posts:*`);
    if(keys.length > 0) {
        await req.redisClient.del(keys);
    }
}


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

        await invalidatePostCache(req, post._id.toString());

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if(cachedPosts) {
            return res.status(200).json({
                success: true,
                message: 'Posts retrieved successfully from cache',
                posts: JSON.parse(cachedPosts)
            });
        }




        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);
        
        const posts = await Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

        const result = {
            totalPosts,
            totalPages,
            currentPage: page,
            posts
        }

        //save your posts in redis cache
        await req.redisClient.setex(
          cacheKey,
          300,
          JSON.stringify(result),
        ); 

        res.status(200).json({
            success: true,
            message: 'Posts retrieved successfully',
            result
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

        if (post.user.toString() !== req.user.userId.toString()) {
          logger.warn("user not authorized to update this post");
          return res.status(401).json({
            success: false,
            message: "User not authorized to update this post",
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
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);
        if(cachedPost) {
            return res.status(200).json({
                success: true,
                message: 'Post retrieved successfully from cache',
                post: JSON.parse(cachedPost)
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

        //save your post in redis cache
        await req.redisClient.setex(
          cacheKey,
          3600,
          JSON.stringify(post),
        );

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
        const post = await Post.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!post) {
            logger.warn('post not found');
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        logger.warn(`post : ${post.user.toString()}`);
        logger.warn(`user : ${req.user.userId.toString()}`);

        if (post.user.toString() !== req.user.userId.toString()) {
          logger.warn("user not authorized to delete this post");
          return res.status(401).json({
            success: false,
            message: "User not authorized to delete this post",
          });
        }


        //publish post delete method to rabbitmq
        await publishEvent("post.deleted", {
          postId: post._id.toString(),
          userId: req.user.userId,
          mediaIds: post.mediaIds,
        });

        await invalidatePostCache(req, req.params.id);
        logger.info('post deleted successfully', post._id);
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