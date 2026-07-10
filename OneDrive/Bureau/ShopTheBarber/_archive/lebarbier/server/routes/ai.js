const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Mock AI style recommendation function
async function getStyleRecommendations(imagePath) {
  // In production, call an external AI API or local ML model
  // For now, return mock data
  return [
    {
      name: 'Fade Cut',
      description: 'A modern fade haircut, short on the sides, longer on top.',
      image: '/styles/fade.jpg',
    },
    {
      name: 'Buzz Cut',
      description: 'Very short, low-maintenance style.',
      image: '/styles/buzz.jpg',
    },
    {
      name: 'Pompadour',
      description: 'Classic style with volume on top.',
      image: '/styles/pompadour.jpg',
    },
  ];
}

// POST /api/ai/style-recommendation
router.post('/style-recommendation', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });
    const imagePath = req.file.path;
    const styles = await getStyleRecommendations(imagePath);
    // Optionally delete the uploaded image after processing
    fs.unlink(imagePath, () => {});
    res.json({ recommendations: styles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router; 