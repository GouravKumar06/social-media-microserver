

const handlePostDeleted = async (event) => {
    console.log("event", event);
    // const { postId } = event;
    // logger.info(`Post deleted event received for post ID: ${postId}`);

    // try {
    //     // Delete media associated with the post
    //     await Media.deleteMany({ postId });
    //     logger.info(`Media deleted for post ID: ${postId}`);
    // } catch (error) {
    //     logger.error(`Error deleting media for post ID: ${postId}`, error);
    // }
}

module.exports = {
    handlePostDeleted
}