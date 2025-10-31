const express = require("express");
const router = express.Router();
const visitorController = require("../controllers/VisitorController");
const { authMiddleware } = require("../middleware/authMiddleware");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/visitor_images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// QR Code Routes
router.get('/qr/:qr_data', visitorController.getQRCode);
router.get('/:id/download-qr', authMiddleware, visitorController.downloadQRCode);

// Visitor Management Routes
router.post('/scan', authMiddleware, visitorController.scanQRCode);
router.post('/invite', authMiddleware, visitorController.inviteVisitor);
router.post('/capture', upload.single('image'), visitorController.captureVisitor);
router.post('/:id/resend-sms', authMiddleware, visitorController.resendVisitorSMS);
router.get('/:id/approve', authMiddleware, visitorController.approveVisitor);
router.get('/:id/deny', authMiddleware, visitorController.denyVisitor);
router.get('/:id/exit', authMiddleware, visitorController.exitVisitor);

// Visitor Data Routes
router.get('/', authMiddleware, visitorController.getAllVisitorLogs);
router.get('/search', authMiddleware, visitorController.searchVisitorByName);
router.get('/pending', authMiddleware, visitorController.getPendingApprovals);
router.get('/my-visitors', authMiddleware, visitorController.getMyVisitors);
router.put('/:id', authMiddleware, visitorController.updateVisitor);

// Log Routes
router.get('/resident/logs', authMiddleware, visitorController.getResidentVisitorLogs);
router.get('/security/logs', authMiddleware, visitorController.getSecurityVisitorLogs);
router.get('/admin/logs', authMiddleware, visitorController.getAdminVisitorLogs);
router.get('/:visitorId/logs', authMiddleware, visitorController.getVisitorLogs);

module.exports = router;