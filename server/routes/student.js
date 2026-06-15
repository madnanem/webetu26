const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_URL = 'https://progres.mesrs.dz/api/infos';

function getHeaders(req) {
  const token = req.headers['authorization'];
  if (!token) throw { status: 401, message: 'No token provided' };
  return { Authorization: token, 'Content-Type': 'application/json' };
}

async function proxyGet(url, headers, res) {
  try {
    const response = await axios.get(url, { headers });
    res.json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data || 'Request failed' });
  }
}

// Personal info
router.get('/individu/:uuid', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/bac/${req.params.uuid}/individu`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Bac info
router.get('/bac/:uuid', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/bac/${req.params.uuid}/`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// All inscriptions (dias)
router.get('/dias/:uuid', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/bac/${req.params.uuid}/dias`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Groups for a DIA
router.get('/groups/:idDia', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/dia/${req.params.idDia}/groups`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Bilans by year (all semesters for a DIA)
router.get('/bilans/:uuid/:idDia', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/bac/${req.params.uuid}/dias/${req.params.idDia}/periode/bilans`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Bilan by semester
router.get('/bilan/:uuid/:idDia/:idPeriode', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(
      `${BASE_URL}/bac/${req.params.uuid}/dia/${req.params.idDia}/periode/${req.params.idPeriode}/bilan`,
      headers, res
    );
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Student photo
// Student photo — API returns base64-encoded string as response body
router.get('/photo/:uuid', async (req, res) => {
  try {
    const headers = { ...getHeaders(req), Accept: 'image/jpeg' };
    const response = await axios.get(`${BASE_URL}/image/${req.params.uuid}`, {
      headers, responseType: 'text', timeout: 8000,
    });
    const b64 = response.data;
    if (b64 && typeof b64 === 'string' && b64.length > 100) {
      return res.json({ photo: b64, mime: 'image/jpeg' });
    }
    res.status(404).json({ error: 'photo not found' });
  } catch (e) { res.status(e.response?.status || 404).json({ error: 'photo not found' }); }
});

// Establishment logo — API returns base64-encoded string as response body
router.get('/logo/:etablissementId', async (req, res) => {
  try {
    const headers = { ...getHeaders(req), Accept: 'image/jpeg' };
    const response = await axios.get(`${BASE_URL}/logoEtablissement/${req.params.etablissementId}`, {
      headers, responseType: 'text', timeout: 8000,
    });
    const b64 = response.data;
    if (b64 && typeof b64 === 'string' && b64.length > 100) {
      return res.json({ logo: b64, mime: 'image/jpeg' });
    }
    res.status(404).json({ error: 'logo not found' });
  } catch (e) { res.status(404).json({ error: 'logo not found' }); }
});

// Bac notes
router.get('/notes/:uuid', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/bac/${req.params.uuid}/notes`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Academic leave
router.get('/conge/:uuid/:idAnnee', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(
      `${BASE_URL}/bac/${req.params.uuid}/anneeAcademique/${req.params.idAnnee}/congeacademique`,
      headers, res
    );
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Annual bilan (decision) for a DIA
router.get('/annuelbilan/:uuid/:idDia', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(
      `${BASE_URL}/bac/${req.params.uuid}/dia/${req.params.idDia}/annuel/bilan`,
      headers, res
    );
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Timetable (weekly schedule) for a DIA
router.get('/timetable/:idDia', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/seanceEmploi/inscription/${req.params.idDia}`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Exam session grades for a DIA
router.get('/examgrades/:idDia', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/planningSession/dia/${req.params.idDia}/noteExamens`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Continuous evaluation grades for a DIA
router.get('/ccgrades/:idDia', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/controleContinue/dia/${req.params.idDia}/notesCC`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

// Accommodation requests
router.get('/accommodation/:uuid', async (req, res) => {
  try {
    const headers = getHeaders(req);
    await proxyGet(`${BASE_URL}/bac/${req.params.uuid}/demandesHebregement`, headers, res);
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});

module.exports = router;
