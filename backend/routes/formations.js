const express = require('express');

const router = express.Router();

const Candidate = require('../models/Candidate');
const CV = require('../models/CV');
const TrainingApplication = require('../models/TrainingApplication');
const TrainingPath = require('../models/TrainingPath');
const FormationAttempt = require('../models/FormationAttempt');

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

router.post('/:id/sections/:sectionId/test/submit', async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    const { candidateId, answers = [], timeSpentSeconds = 0 } = req.body || {};

    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'candidateId requis.' });
    }

    const formation = await TrainingPath.findById(id);
    if (!formation) {
      return res.status(404).json({ success: false, message: 'Formation introuvable.' });
    }

    const section = formation.sections?.id ? formation.sections.id(sectionId) : null;
    if (!section || !section.test?.enabled) {
      return res.status(404).json({ success: false, message: 'Test introuvable pour cette section.' });
    }

    const questions = section.test.questions || [];
    const passingScore = Number(section.test.passingScore) || 50;

    const evaluatedAnswers = questions.map((q, idx) => {
      const submitted = (answers || []).find((a) => Number(a?.questionIndex) === idx);
      const selectedIndex = submitted ? Number(submitted.selectedIndex) : -1;
      const isCorrect = selectedIndex === Number(q.correctIndex);
      return { questionIndex: idx, selectedIndex, isCorrect };
    });

    const correctCount = evaluatedAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= passingScore;

    const attempt = await FormationAttempt.create({
      candidateId,
      trainingPathId: id,
      sectionId,
      answers: evaluatedAnswers,
      score,
      correctCount,
      totalQuestions,
      timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
      passed,
      passingScore,
    });

    return res.status(201).json({
      success: true,
      attempt,
      result: {
        score,
        correctCount,
        totalQuestions,
        passed,
        passingScore,
      },
    });
  } catch (error) {
    console.error('[formations:submit-test]', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

router.get('/:id/sections/:sectionId/attempts/:candidateId', async (req, res) => {
  try {
    const { id, sectionId, candidateId } = req.params;
    const attempts = await FormationAttempt.find({
      trainingPathId: id,
      sectionId,
      candidateId,
    })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, attempts });
  } catch (error) {
    console.error('[formations:attempts]', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

module.exports = router;