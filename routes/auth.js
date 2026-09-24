const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey"; // replace later

// REGISTER
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  const hash = bcrypt.hashSync(password, 10);

  db.run(
    "INSERT INTO users (username, password_hash) VALUES (?, ?)",
    [username, hash],
    function (err) {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
});

// LOGIN
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (!user) return res.json({ error: "Invalid login" });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.json({ error: "Invalid login" });

    const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });

    res.json({ token });
  });
});

module.exports = router;
