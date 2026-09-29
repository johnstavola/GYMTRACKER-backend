const express = require("express");
const router = express.Router();
const supabase = require("../db");
const verifyToken = require("../middleware/auth");

router.post("/settings", verifyToken, async (req, res) => {
  const { buttonColor, backgroundColor } = req.body;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        button_color: buttonColor,
        background_color: backgroundColor
      })
      .eq("id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
