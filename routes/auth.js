const express = require("express");
const router = express.Router();
const supabase = require("../db");

// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password
  });

  if (error || !data.session) {
    return res.status(401).json({ error: "Invalid login" });
  }

  return res.json({ token: data.session.access_token });
});

// REGISTER
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const { data, error } = await supabase.auth.signUp({
    email: username,
    password
  });

  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

  return res.json({ success: true });
});

module.exports = router;
