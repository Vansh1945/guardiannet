const express = require('express');
const router = express.Router();
const adminController = require('../controllers/AdminController');
const {authMiddleware} = require('../middleware/authMiddleware');



// Admin routes
router.get('/users', authMiddleware,  adminController.getUsers);
router.put('/approve/:userId', authMiddleware, adminController.approveUser);
router.put('/reject/:userId', authMiddleware, adminController.rejectUser);
router.put('/update/:id', authMiddleware, adminController.updateUser);
router.delete('/remove/:id', authMiddleware, adminController.removeResident);

module.exports = router;
