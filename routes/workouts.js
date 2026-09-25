const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey";

// Middleware: authenticate user
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.json({ error: "No token" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.json({ error: "Invalid token" });
  }
}

// -------------------------
// ADD LOG
// -------------------------
router.post("/log", auth, (req, res) => {
  let { name, weight, reps } = req.body;
  const userId = req.user.id;

  // Normalize name (case-insensitive)
  name = name.trim().toLowerCase();

  // Step 1: check if exercise exists
  db.get(
    "SELECT * FROM exercises WHERE user_id = ? AND name = ?",
    [userId, name],
    (err, exercise) => {
      if (!exercise) {
        // Create exercise
        db.run(
          "INSERT INTO exercises (user_id, name) VALUES (?, ?)",
          [userId, name],
          function () {
            insertLog(this.lastID);
          }
        );
      } else {
        insertLog(exercise.id);
      }
    }
  );

  function insertLog(exerciseId) {
    db.run(
      "INSERT INTO exercise_logs (exercise_id, weight, reps, timestamp) VALUES (?, ?, ?, datetime('now'))",
      [exerciseId, weight, reps],
      () => res.json({ success: true })
    );
  }
});

// -------------------------
// GET EXERCISES (last logged set + timestamp)
// -------------------------
router.get("/exercises", auth, (req, res) => {
  const userId = req.user.id;

  db.all(
    `
    SELECT exercises.name,
           (SELECT weight FROM exercise_logs WHERE exercise_id = exercises.id ORDER BY id DESC LIMIT 1) AS last_weight,
           (SELECT reps FROM exercise_logs WHERE exercise_id = exercises.id ORDER BY id DESC LIMIT 1) AS last_reps,
           (SELECT timestamp FROM exercise_logs WHERE exercise_id = exercises.id ORDER BY id DESC LIMIT 1) AS last_timestamp
    FROM exercises
    WHERE user_id = ?
    `,
    [userId],
    (err, rows) => {
      res.json(rows);
    }
  );
});

// -------------------------
// GET FULL HISTORY FOR A LIFT
// -------------------------
router.get("/history/:name", auth, (req, res) => {
  const userId = req.user.id;

  // Normalize name (case-insensitive)
  const name = req.params.name.toLowerCase();

  // Find the exercise for this user
  db.get(
    "SELECT id FROM exercises WHERE user_id = ? AND name = ?",
    [userId, name],
    (err, exercise) => {
      if (!exercise) {
        return res.json([]);
      }

      // Get full history sorted newest → oldest
      db.all(
        "SELECT weight, reps, timestamp FROM exercise_logs WHERE exercise_id = ? ORDER BY timestamp DESC",
        [exercise.id],
        (err, logs) => {
          res.json(logs);
        }
      );
    }
  );
});

// -------------------------
// GET ALL LOGS FOR A SPECIFIC DAY
// -------------------------
router.get("/day/:date", auth, (req, res) => {
  const userId = req.user.id;
  const date = req.params.date; // format: YYYY-MM-DD

  db.all(
    `
    SELECT exercises.name, exercise_logs.weight, exercise_logs.reps, exercise_logs.timestamp
    FROM exercise_logs
    JOIN exercises ON exercise_logs.exercise_id = exercises.id
    WHERE exercises.user_id = ?
      AND DATE(exercise_logs.timestamp) = ?
    ORDER BY exercise_logs.timestamp DESC
    `,
    [userId, date],
    (err, rows) => {
      res.json(rows);
    }
  );
});

// -------------------------
// GET ALL UNIQUE WORKOUT DATES
// -------------------------
router.get("/dates", auth, (req, res) => {
  const userId = req.user.id;

  db.all(
    `
    SELECT DISTINCT substr(exercise_logs.timestamp, 1, 10) AS date
    FROM exercise_logs
    JOIN exercises ON exercise_logs.exercise_id = exercises.id
    WHERE exercises.user_id = ?
    ORDER BY date DESC
    `,
    [userId],
    (err, rows) => {
      res.json(rows);
    }
  );
});


module.exports = router;
