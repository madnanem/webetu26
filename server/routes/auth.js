const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_URL = 'https://progres.mesrs.dz/api';

// Create axios instance with longer timeout for external API
const apiClient = axios.create({
  timeout: 30000, // Increased to 30 seconds
  headers: { 'Content-Type': 'application/json' }
});

// Retry logic for failed requests
const loginWithRetry = async (username, password, retries = 2) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AUTH] Login attempt ${attempt}/${retries} for user: ${username}`);
      const response = await apiClient.post(
        `${BASE_URL}/authentication/v1/`,
        { username, password }
      );
      console.log('[AUTH] Login successful:', response.status);
      return response;
    } catch (err) {
      console.error(`[AUTH] Attempt ${attempt} failed:`, err.code || err.message);
      if (attempt === retries) throw err; // Throw on last attempt
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const response = await loginWithRetry(username, password, 3);
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
      console.error('[AUTH] Request timeout - API server not responding after retries');
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
