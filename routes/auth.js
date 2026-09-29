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
    username: username,
    password
  });

  if (error) return res.status(400).json({ error: error.message });

  // Insert into profiles table
  await supabase.from("profiles").insert({
    id: data.user.id,
    username: username
  });

  res.json({ success: true });
});
