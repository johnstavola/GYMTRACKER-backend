const express = require("express");
const router = express.Router();
const supabase = require("../db");
const verifyToken = require("../middleware/auth");

router.post("/settings", verifyToken, async (req, res) => {
  const { button_color, background_color } = req.body;

  const { error } = await supabase
    .from("profiles")
    .update({
      button_color,
      background_color
    })
    .eq("id", req.user.id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ success: true });
});

module.exports = router;
