const express = require('express');
const { registerUser, loginUser, tokenController, logoutUser } = require('../controllers/identity-controller');
const router = express.Router();

router.post('/register',registerUser)
router.post("/login", loginUser);
router.post("/refresh-token",tokenController);
router.post("/logout",logoutUser)


module.exports = router;