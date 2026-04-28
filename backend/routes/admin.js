// backend/routes/admin.js
const express = require('express');
const router  = express.Router();
const Admin     = require('../models/Admin');
const Recruiter = require('../models/Recruiter');
const Candidate = require('../models/Candidate');
const JobOffer  = require('../models/JobOffer');
const Candidacy = require('../models/Candidacy');
const TrainingPath = require('../models/TrainingPath');
const TrainingApplication = require('../models/TrainingApplication');
const mailer    = require('../utils/mailer');

let AppFeedback = null;
try { AppFeedback = require('../models/AppFeedback'); } catch (_) {}

// ─── Email helper (fixes mailer.sendMail which doesn't exist) ─────────────────
async function sendAdminEmail({ to, subject, text }) {
  try {
    const transporter = mailer.getMailerTransporter()
    if (!transporter) return
    await transporter.sendMail({
      from: mailer.getFromAddress(),
      to,
      subject,
      text,
    })
  } catch (err) {
    console.error('[admin email]', err.message)
    // never throw — email failure must not block the admin action
  }
}

async function loadTrainingCounts(trainingIds) {
  if (!trainingIds.length) return new Map();
  const counts = await TrainingApplication.aggregate([
    { $match: { trainingPathId: { $in: trainingIds } } },
    { $group: { _id: '$trainingPathId', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((entry) => [String(entry._id), entry.count]));
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag || '').trim()).filter(Boolean);
  }
  if (!tags) return [];
  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
const requireAdmin = async (req, res, next) => {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(401).json({ success: false, message: 'Non autorisé.' });
  const admin = await Admin.findById(adminId).select('-password').lean().catch(() => null);
  if (!admin) return res.status(401).json({ success: false, message: 'Session admin invalide.' });
  req.admin = admin;
  next();
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
    admin.lastLoginAt = new Date();
    await admin.save();
    return res.json({
      success: true,
      admin: { id: admin._id, email: admin.email, firstName: admin.firstName, lastName: admin.lastName, role: admin.role },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// One-time seed (disable in production)
router.post('/seed', async (req, res) => {
  try {
    if (await Admin.countDocuments() > 0)
      return res.status(409).json({ success: false, message: 'Un admin existe déjà.' });
    const { email, password, firstName, lastName } = req.body;
    const admin = await Admin.create({ email, password, firstName: firstName || 'Super', lastName: lastName || 'Admin', role: 'superadmin' });
    return res.status(201).json({ success: true, message: 'Admin créé.', id: admin._id });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── STATS ────────────────────────────────────────────────────────────────────

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [totalRecruiters, totalCandidates, totalOffers, totalCandidacies,
      totalTrainings, feedbackCount, avgFeedbackRaw, scoredCandidacies, recentRecruiters, recentCandidates] =
      await Promise.all([
        Recruiter.countDocuments(),
        Candidate.countDocuments(),
        JobOffer.countDocuments(),
        Candidacy.countDocuments(),
        TrainingPath.countDocuments(),
        AppFeedback ? AppFeedback.countDocuments() : Promise.resolve(0),
        AppFeedback ? AppFeedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]) : Promise.resolve([]),
        Candidacy.countDocuments({ sbertScore: { $ne: null } }),
        Recruiter.find().sort({ createdAt: -1 }).limit(30).select('firstName lastName email company createdAt').lean(),
        Candidate.find().sort({ createdAt: -1 }).limit(30).select('firstName lastName email createdAt').lean(),
      ]);

    const since14 = new Date();
    since14.setDate(since14.getDate() - 13);
    since14.setHours(0, 0, 0, 0);
    const candidacyTrend = await Candidacy.aggregate([
      { $match: { createdAt: { $gte: since14 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const trendMap = Object.fromEntries(candidacyTrend.map(d => [d._id, d.count]));
    const trendLabels = []; const trendValues = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendLabels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
      trendValues.push(trendMap[key] || 0);
    }
    return res.json({
      success: true,
      stats: { totalRecruiters, totalCandidates, totalOffers, totalCandidacies,
        totalTrainings,
        feedbackCount, avgRating: avgFeedbackRaw[0]?.avg ? Number(avgFeedbackRaw[0].avg.toFixed(2)) : null,
        scoredCandidacies, trendLabels, trendValues, recentRecruiters, recentCandidates },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ─── RECRUITERS ───────────────────────────────────────────────────────────────

router.get('/recruiters', requireAdmin, async (req, res) => {
  const recruiters = await Recruiter.find().sort({ createdAt: -1 }).select('-password').lean();
  return res.json({ success: true, recruiters });
});

router.put('/recruiters/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['firstName','lastName','email','company','sector','country','companySize'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const recruiter = await Recruiter.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password').lean();
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruteur introuvable.' });
    return res.json({ success: true, recruiter });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/recruiters/:id/ban', requireAdmin, async (req, res) => {
  try {
    const { reason = "Violation des conditions d'utilisation." } = req.body;
    const recruiter = await Recruiter.findByIdAndUpdate(req.params.id, { banned: true, banReason: reason }, { new: true }).lean();
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruteur introuvable.' });
    await sendAdminEmail({
      to: recruiter.email,
      subject: '[AIR] Votre compte a été suspendu',
      text: `Bonjour ${recruiter.firstName},\n\nVotre compte recruteur a été suspendu.\nMotif: ${reason}\n\nPour contester cette décision, contactez notre support.\n\nL'équipe AIR`,
    });
    return res.json({ success: true, message: 'Recruteur banni.', banReason: reason });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/recruiters/:id/unban', requireAdmin, async (req, res) => {
  try {
    const recruiter = await Recruiter.findByIdAndUpdate(req.params.id, { banned: false, banReason: '' }, { new: true }).lean();
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruteur introuvable.' });
    await sendAdminEmail({
      to: recruiter.email,
      subject: '[AIR] Votre compte a été réactivé',
      text: `Bonjour ${recruiter.firstName},\n\nVotre compte recruteur a été réactivé. Vous pouvez à nouveau vous connecter.\n\nL'équipe AIR`,
    });
    return res.json({ success: true, message: 'Recruteur débanni.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/recruiters/:id/warning', requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message requis.' });
    const recruiter = await Recruiter.findById(req.params.id).lean();
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruteur introuvable.' });
    await sendAdminEmail({
      to: recruiter.email,
      subject: '[AIR] Avertissement officiel',
      text: `Bonjour ${recruiter.firstName},\n\nVous recevez cet avertissement de la part de l'équipe AIR :\n\n"${message}"\n\nVeuillez vous conformer à nos conditions d'utilisation pour éviter la suspension de votre compte.\n\nL'équipe AIR`,
    });
    return res.json({ success: true, message: 'Avertissement envoyé.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.delete('/recruiters/:id', requireAdmin, async (req, res) => {
  await Recruiter.findByIdAndDelete(req.params.id);
  return res.json({ success: true, message: 'Recruteur supprimé.' });
});

// ─── CANDIDATES ───────────────────────────────────────────────────────────────

router.get('/candidates', requireAdmin, async (req, res) => {
  const candidates = await Candidate.find().sort({ createdAt: -1 }).select('-password').lean();
  return res.json({ success: true, candidates });
});

router.put('/candidates/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['firstName','lastName','email','sector','experienceLevel','professionalTitle'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password').lean();
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    return res.json({ success: true, candidate });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/candidates/:id/ban', requireAdmin, async (req, res) => {
  try {
    const { reason = "Violation des conditions d'utilisation." } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, { banned: true, banReason: reason }, { new: true }).lean();
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    await sendAdminEmail({
      to: candidate.email,
      subject: '[AIR] Votre compte a été suspendu',
      text: `Bonjour ${candidate.firstName},\n\nVotre compte candidat a été suspendu.\nMotif: ${reason}\n\nPour contester cette décision, contactez notre support.\n\nL'équipe AIR`,
    });
    return res.json({ success: true, message: 'Candidat banni.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/candidates/:id/unban', requireAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, { banned: false, banReason: '' }, { new: true }).lean();
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    await sendAdminEmail({
      to: candidate.email,
      subject: '[AIR] Votre compte a été réactivé',
      text: `Bonjour ${candidate.firstName},\n\nVotre compte candidat a été réactivé.\n\nL'équipe AIR`,
    });
    return res.json({ success: true, message: 'Candidat débanni.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/candidates/:id/warning', requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message requis.' });
    const candidate = await Candidate.findById(req.params.id).lean();
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    await sendAdminEmail({
      to: candidate.email,
      subject: '[AIR] Avertissement officiel',
      text: `Bonjour ${candidate.firstName},\n\nVous recevez cet avertissement de la part de l'équipe AIR :\n\n"${message}"\n\nVeuillez vous conformer à nos conditions d'utilisation.\n\nL'équipe AIR`,
    });
    return res.json({ success: true, message: 'Avertissement envoyé.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.delete('/candidates/:id', requireAdmin, async (req, res) => {
  await Candidate.findByIdAndDelete(req.params.id);
  return res.json({ success: true, message: 'Candidat supprimé.' });
});

// ─── JOB OFFERS ───────────────────────────────────────────────────────────────

router.get('/offers', requireAdmin, async (req, res) => {
  const offers = await JobOffer.find().sort({ createdAt: -1 }).populate('recruiterId', 'firstName lastName email company').lean();
  return res.json({ success: true, offers });
});

router.put('/offers/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['title','location','workMode','contractType','salary','experienceRequired','languagesRequired','technicalSkills','description','status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const offer = await JobOffer.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!offer) return res.status(404).json({ success: false, message: 'Offre introuvable.' });
    return res.json({ success: true, offer });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.delete('/offers/:id', requireAdmin, async (req, res) => {
  await JobOffer.findByIdAndDelete(req.params.id);
  return res.json({ success: true, message: 'Offre supprimée.' });
});

// ─── TRAININGS ───────────────────────────────────────────────────────────────

router.get('/formations', requireAdmin, async (req, res) => {
  const trainings = await TrainingPath.find().sort({ createdAt: -1 }).lean();
  const counts = await loadTrainingCounts(trainings.map((training) => training._id));
  const enriched = trainings.map((training) => ({
    ...training,
    applicationsCount: counts.get(String(training._id)) || 0,
  }));
  return res.json({ success: true, formations: enriched });
});

router.post('/formations', requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'description', 'provider', 'category', 'level', 'duration', 'imageUrl', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    updates.tags = normalizeTags(req.body?.tags);
    updates.createdByAdminId = req.admin?._id || null;
    if (updates.status === 'published' && !updates.publishedAt) {
      updates.publishedAt = new Date();
    }
    const formation = await TrainingPath.create(updates);
    return res.status(201).json({ success: true, formation: { ...formation.toObject(), applicationsCount: 0 } });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Erreur serveur.' });
  }
});

router.put('/formations/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['title', 'description', 'provider', 'category', 'level', 'duration', 'imageUrl', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
    updates.tags = normalizeTags(req.body?.tags);
    if (updates.status === 'published') {
      updates.publishedAt = updates.publishedAt || new Date();
    }
    const formation = await TrainingPath.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
    if (!formation) return res.status(404).json({ success: false, message: 'Formation introuvable.' });
    const count = await TrainingApplication.countDocuments({ trainingPathId: formation._id });
    return res.json({ success: true, formation: { ...formation, applicationsCount: count } });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message || 'Erreur serveur.' });
  }
});

router.delete('/formations/:id', requireAdmin, async (req, res) => {
  await TrainingApplication.deleteMany({ trainingPathId: req.params.id });
  await TrainingPath.findByIdAndDelete(req.params.id);
  return res.json({ success: true, message: 'Formation supprimée.' });
});

// ─── CANDIDACIES ─────────────────────────────────────────────────────────────

router.get('/candidacies', requireAdmin, async (req, res) => {
  const candidacies = await Candidacy.find().sort({ createdAt: -1 })
    .populate('candidateId', 'firstName lastName email')
    .populate('jobOfferId', 'title')
    .lean();
  return res.json({ success: true, candidacies });
});

// ─── FEEDBACK ────────────────────────────────────────────────────────────────

router.get('/feedback', requireAdmin, async (req, res) => {
  if (!AppFeedback) return res.json({ success: true, feedbacks: [] });
  const feedbacks = await AppFeedback.find().sort({ createdAt: -1 }).lean();
  return res.json({ success: true, feedbacks });
});

router.delete('/feedback/:id', requireAdmin, async (req, res) => {
  if (!AppFeedback) return res.status(404).json({ success: false, message: 'Modèle AppFeedback non disponible.' });
  await AppFeedback.findByIdAndDelete(req.params.id);
  return res.json({ success: true, message: 'Feedback supprimé.' });
});

module.exports = router;