const express = require("express");
const router = express.Router();
const supabase = require("../db");

// Verify Supabase token
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Invalid token" });

  req.user = data.user;
  next();
}

// ADD LOG
router.post("/log", verifyToken, async (req, res) => {
  const { name, weight, reps } = req.body;

  const { error } = await supabase
    .from("workouts") // ✅ correct table name
    .insert({
      user_id: req.user.id,
      name, // ✅ correct column name
      weight,
      reps,
      created_at: new Date().toISOString() // ✅ correct column name
    });

  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// GET EXERCISES
router.get("/exercises", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("workouts") // ✅ correct table name
    .select("name, weight, reps, created_at") // ✅ correct column names
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET WORKOUT DATES
router.get("/dates", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("workouts") // ✅ correct table name
    .select("created_at") // ✅ correct column name
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const uniqueDates = [...new Set(data.map(log => log.created_at.split("T")[0]))];
  res.json(uniqueDates.map(date => ({ date })));
});

module.exports = router;
