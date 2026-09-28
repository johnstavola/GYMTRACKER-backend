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

// ADD LOG (store local NY time)
router.post("/log", verifyToken, async (req, res) => {
  const { name, weight, reps } = req.body;
  const w = Number(weight);
  const r = Number(reps);

  // Local timestamp in America/New_York
  const localTimestamp = new Date().toLocaleString("sv-SE", { timeZone: "America/New_York" });

  const { error } = await supabase
    .from("workouts")
    .insert({
      user_id: req.user.id,
      name,
      weight: w,
      reps: r,
      created_at: localTimestamp
    });

  if (error) {
    console.log("SUPABASE INSERT ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true });
});

// GET EXERCISES
router.get("/exercises", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("workouts")
    .select("name, weight, reps, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET WORKOUT DATES (convert UTC → local)
router.get("/dates", verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from("workouts")
    .select("created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });

  const uniqueDates = [
    ...new Set(
      data.map(log => {
        const d = new Date(log.created_at);
        return d.toLocaleDateString("sv-SE", { timeZone: "America/New_York" }); // YYYY-MM-DD local
      })
    )
  ];

  res.json(uniqueDates.map(date => ({ date })));
});

// GET WORKOUTS FOR A SPECIFIC DAY (FIXED)
router.get("/day/:date", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const date = req.params.date;

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("created_at::date", date);   // <-- FIX

  if (error) {
    console.log("SUPABASE DAY FETCH ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// IMPORTANT: EXPORT AT THE VERY END
module.exports = router;
