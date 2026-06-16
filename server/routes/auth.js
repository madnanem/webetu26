const express = require('express');
const axios = require('axios');
const router = express.Router();

const BASE_URL = 'https://progres.mesrs.dz/api';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const response = await axios.post(
      `${BASE_URL}/authentication/v1/`,
      { username, password },
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('API Response:', response.data);
    res.json(response.data);
  } catch (err) {
    console.error('Login error:', err.response?.status, err.response?.data);
    const status = err.response?.status || 500;
    const message = status === 401 ? 'Invalid credentials' : 'Authentication failed';
    res.status(status).json({ error: message });
  }
});

module.exports = router;
