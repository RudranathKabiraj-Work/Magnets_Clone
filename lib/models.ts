import mongoose, { Schema } from "mongoose";

// Account Schema
const AccountSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, default: "password123" }, // Default seed password
  plan: { type: String, default: "Free" },
  brandColor: { type: String, default: "#FE6F34" },
  logo: { type: String, default: null },
  joinedAt: { type: String, required: true },
  privacyPolicy: { type: String, default: "" },
  termsOfService: { type: String, default: "" },
  themeMode: { type: String, default: "light" },
  highlightIntensity: { type: Number, default: 100 },
});

// MagnetPage Schema
const MagnetPageSchema = new Schema({
  id: { type: String, required: true },
  userEmail: { type: String, lowercase: true, trim: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  status: { type: String, enum: ["draft", "live", "paused"], default: "draft" },
  views: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  headline: { type: String, default: "" },
  subheadline: { type: String, default: "" },
  pitch: { type: String, default: "" },
  bullets: { type: [String], default: [] },
  imageUrl: { type: String, default: null },
  cta: { type: String, default: "Get instant access" },
  deliverable: { type: String, default: "Instant Access" },
  updatedAt: { type: String, default: "Just now" },
  publishedAt: { type: String, default: null },
  template: { type: String, enum: ["classic", "video", "quiz"], default: "classic" },
  accent: { type: String, default: "#FE6F34" },
});

// Lead Schema
const LeadSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  page: { type: String, required: true },
  pageId: { type: String, required: true },
  status: { type: String, enum: ["new", "delivered", "opened", "replied", "stopped"], default: "new" },
  source: { type: String, enum: ["magnets", "custom-domain", "integration"], default: "magnets" },
  signedUpAt: { type: String, required: true },
  sequence: { type: String },
  sequenceStep: { type: String },
  tags: { type: [String], default: [] },
});

// Sequence Email Schema
const SequenceEmailSchema = new Schema({
  id: { type: String, required: true },
  subject: { type: String, required: true },
  delayLabel: { type: String, required: true },
  delayMinutes: { type: Number, required: true },
  status: { type: String, enum: ["draft", "live"], default: "draft" },
  sent: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
});

// Sequence Schema
const SequenceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  pageId: { type: String },
  status: { type: String, enum: ["draft", "live"], default: "draft" },
  emails: { type: [SequenceEmailSchema], default: [] },
  stopOnBooking: { type: Boolean, default: false },
  stats: {
    signedUp: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    stopped: { type: Number, default: 0 },
  },
});

// Integration Schema
const IntegrationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["newsletter", "crm", "messaging", "automation", "calendar", "email"], required: true },
  description: { type: String, required: true },
  connected: { type: Boolean, default: false },
  trigger: { type: String, required: true },
});

export const AccountModel = mongoose.models.Account || mongoose.model("Account", AccountSchema);
export const MagnetPageModel = mongoose.models.MagnetPage || mongoose.model("MagnetPage", MagnetPageSchema);
export const LeadModel = mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
export const SequenceModel = mongoose.models.Sequence || mongoose.model("Sequence", SequenceSchema);
export const IntegrationModel = mongoose.models.Integration || mongoose.model("Integration", IntegrationSchema);

// Resource Schema
const ResourceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: String, required: true },
  url: { type: String, required: true },
});

export const ResourceModel = mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);
