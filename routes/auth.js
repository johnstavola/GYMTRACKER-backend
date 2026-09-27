const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supabase = require("../db");

const SECRET = "supersecretkey"; // replace later
const router = express.Router();

// REGISTER
router.post("/register", (req, res) => {
// LOGIN
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const hash = bcrypt.hashSync(password, 10);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password
  });

  if (error || !data.session) {
    return res.status(401).json({ error: "Invalid login" });
  }

  db.run(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)",
    [username, hash],
    function (err) {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
  return res.json({ token: data.session.access_token });
});

// LOGIN
router.post("/login", (req, res) => {
// REGISTER
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.json({ error: "Invalid login" });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.json({ error: "Invalid login" });
  const { data, error } = await supabase.auth.signUp({
    email: username,
    password
  });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }

    res.json({ token });
  });
  return res.json({ success: true });
});

module.exports = router;
