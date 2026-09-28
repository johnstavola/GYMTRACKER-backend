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

  const w = Number(weight);
  const r = Number(reps);

  const { error } = await supabase
    .from("workouts")
    .insert({
      user_id: req.user.id,
      name,
      weight: w,
      reps: r,
      created_at: new Date().toISOString()
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

// GET WORKOUT DATES
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
        return d.toLocaleDateString("sv-SE"); // YYYY-MM-DD in YOUR timezone
      })
    )
  ];

  res.json(uniqueDates.map(date => ({ date })));
});


// GET WORKOUTS FOR A SPECIFIC DAY
router.get("/day/:date", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const date = req.params.date;

  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", `${date}T00:00:00`)
    .lte("created_at", `${date}T23:59:59`);

  if (error) {
    console.log("SUPABASE DAY FETCH ERROR:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// IMPORTANT: EXPORT AT THE VERY END
module.exports = router;
