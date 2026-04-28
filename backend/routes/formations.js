const express = require('express');

const router = express.Router();

const Candidate = require('../models/Candidate');
const CV = require('../models/CV');
const TrainingApplication = require('../models/TrainingApplication');
const TrainingPath = require('../models/TrainingPath');

async function loadFormationCounts(trainingIds) {
  if (!trainingIds.length) return new Map();
  const counts = await TrainingApplication.aggregate([
    { $match: { trainingPathId: { $in: trainingIds } } },
    { $group: { _id: '$trainingPathId', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((item) => [String(item._id), item.count]));
}

router.get('/', async (req, res) => {
  try {
    const candidateId = String(req.query.candidateId || '').trim();

    const formations = await TrainingPath.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
    const formationIds = formations.map((formation) => formation._id);
    const applicationCounts = await loadFormationCounts(formationIds);

    let appliedFormationIds = new Set();
    let applicationsByFormation = new Map();
    if (candidateId) {
      const applications = await TrainingApplication.find({ candidateId })
        .sort({ createdAt: -1 })
        .lean();
      appliedFormationIds = new Set(applications.map((application) => String(application.trainingPathId)));
      applicationsByFormation = new Map(applications.map((application) => [String(application.trainingPathId), application]));
    }

    const enriched = formations.map((formation) => {
      const formationId = String(formation._id);
      const application = applicationsByFormation.get(formationId) || null;
      return {
        ...formation,
        applicationsCount: applicationCounts.get(formationId) || 0,
        isApplied: appliedFormationIds.has(formationId),
        applicationStatus: application?.status || null,
        appliedAt: application?.createdAt || null,
      };
    });

    return res.json({ success: true, formations: enriched });
  } catch (error) {
    console.error('[formations:list]', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { candidateId, cvId = null, motivation = '' } = req.body || {};

    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'candidateId requis.' });
    }

    const candidate = await Candidate.findById(candidateId).lean();
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidat introuvable.' });
    }

    const formation = await TrainingPath.findById(id).lean();
    if (!formation || formation.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Formation introuvable.' });
    }

    if (cvId) {
      const cv = await CV.findOne({ _id: cvId, candidateId }).lean();
      if (!cv) {
        return res.status(400).json({ success: false, message: 'CV introuvable pour ce candidat.' });
      }
    }

    const existing = await TrainingApplication.findOne({ candidateId, trainingPathId: id }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: 'Vous avez déjà postulé à cette formation.' });
    }

    const application = await TrainingApplication.create({
      candidateId,
      trainingPathId: id,
      cvId: cvId || null,
      motivation: String(motivation || '').trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Candidature à la formation enregistrée.',
      application,
    });
  } catch (error) {
    console.error('[formations:apply]', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;