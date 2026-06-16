const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_URL = 'https://progres.mesrs.dz/api';

// Create axios instance with timeout and better error handling
const apiClient = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    console.log(`[AUTH] Login attempt for user: ${username}`);
    const response = await apiClient.post(
      `${BASE_URL}/authentication/v1/`,
      { username, password }
    );
    console.log('[AUTH] Login successful:', response.status);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      // API responded with error
      const status = err.response.status || 500;
      const errorMsg = err.response.data?.error || 'Unknown error from API';
      console.error(`[AUTH] API error - Status: ${status}, Message: ${errorMsg}`);
      res.status(status).json({ error: errorMsg });
    } else if (err.code === 'ECONNABORTED') {
      // Timeout
      console.error('[AUTH] Request timeout - API server not responding');
      res.status(504).json({ error: 'API server timeout - please try again' });
    } else if (err.code === 'ENOTFOUND') {
      // DNS error
      console.error('[AUTH] DNS error - Cannot reach API server:', err.message);
      res.status(503).json({ error: 'Cannot reach authentication service' });
    } else {
      // Other network errors
      console.error('[AUTH] Network error:', err.code, err.message);
      res.status(503).json({ error: 'Network error - please try again' });
    }
  }
});

module.exports = router;
