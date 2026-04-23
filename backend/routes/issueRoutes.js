const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// ─── @route  POST /api/issues ───────────────────────────────────────
// ─── @desc   Report a new issue ────────────────────────────────────
// ─── @access Private ───────────────────────────────────────────────
router.post('/', protect, upload.single('image'), async (req, res) => {
  const { category, details } = req.body;

  try {
    // Validate fields
    if (!category || !details) {
      return res.status(400).json({ message: 'Category and details are required' });
    }

    // Build image URL if file was uploaded
    const imageUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
      : null;

    // Create issue
    const issue = await Issue.create({
      reportedBy: req.user._id,
      category,
      details,
      imageUrl,
    });

    // Populate reporter info before sending response
    const populatedIssue = await Issue.findById(issue._id).populate(
      'reportedBy',
      'name employeeId category'
    );

    res.status(201).json({
      message: 'Issue reported successfully',
      issue: populatedIssue,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── @route  GET /api/issues/my ────────────────────────────────────
// ─── @desc   Get all issues reported by logged-in user ─────────────
// ─── @access Private ───────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const issues = await Issue.find({ reportedBy: req.user._id })
      .populate('reportedBy', 'name employeeId category')
      .populate('resolvedBy', 'name employeeId')
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json({ issues });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── @route  GET /api/issues/assigned ──────────────────────────────
// ─── @desc   Get issues assigned to logged-in user by category ─────
// ─── @access Private ───────────────────────────────────────────────
router.get('/assigned', protect, async (req, res) => {
  try {
    const issues = await Issue.find({
      category: req.user.category,       // Match user's work category
      reportedBy: { $ne: req.user._id }, // Exclude own issues
    })
      .populate('reportedBy', 'name employeeId category')
      .populate('resolvedBy', 'name employeeId')
      .sort({ createdAt: -1 });

    res.status(200).json({ issues });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── @route  GET /api/issues/stats ─────────────────────────────────
// ─── @desc   Get dashboard stats for logged-in user ────────────────
// ─── @access Private ───────────────────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    // Issues reported by me
    const totalReported = await Issue.countDocuments({
      reportedBy: req.user._id,
    });
    const myPending = await Issue.countDocuments({
      reportedBy: req.user._id,
      status: 'pending',
    });
    const myResolved = await Issue.countDocuments({
      reportedBy: req.user._id,
      status: 'resolved',
    });

    // Tasks assigned to me (by category, excluding my own)
    const totalAssigned = await Issue.countDocuments({
      category: req.user.category,
      reportedBy: { $ne: req.user._id },
    });
    const assignedPending = await Issue.countDocuments({
      category: req.user.category,
      reportedBy: { $ne: req.user._id },
      status: 'pending',
    });
    const assignedResolved = await Issue.countDocuments({
      category: req.user.category,
      reportedBy: { $ne: req.user._id },
      status: 'resolved',
    });

    res.status(200).json({
      reported: {
        total: totalReported,
        pending: myPending,
        resolved: myResolved,
      },
      assigned: {
        total: totalAssigned,
        pending: assignedPending,
        resolved: assignedResolved,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── @route  PATCH /api/issues/:id/resolve ─────────────────────────
// ─── @desc   Mark an issue as resolved ─────────────────────────────
// ─── @access Private ───────────────────────────────────────────────
router.patch('/:id/resolve', protect, async (req, res) => {
  const { resolutionNote } = req.body;

  try {
    if (!resolutionNote) {
      return res.status(400).json({ message: 'Resolution note is required' });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Only allow if category matches
    if (issue.category !== req.user.category) {
      return res.status(403).json({ message: 'Not authorized to resolve this issue' });
    }

    // Prevent resolving own issue
    if (issue.reportedBy.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot resolve your own issue' });
    }

    // Prevent resolving already resolved issue
    if (issue.status === 'resolved') {
      return res.status(400).json({ message: 'Issue is already resolved' });
    }

    // Update issue
    issue.status = 'resolved';
    issue.resolvedBy = req.user._id;
    issue.resolutionNote = resolutionNote;
    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('reportedBy', 'name employeeId category')
      .populate('resolvedBy', 'name employeeId');

    res.status(200).json({
      message: 'Issue resolved successfully',
      issue: updatedIssue,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;