const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  headline: String,
  description: String,
  callToAction: String,
  imageUrl: String,
  imagePrompt: String,
});

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  product: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  targetAudience: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'professional',
  },
  keywords: String,
  ads: [adSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
