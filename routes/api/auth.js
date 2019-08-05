const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");

const User = require("../../models/User");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

/**
 * @route  GET api/auth
 * @desc   Test route
 * @access Public
 */
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.json(user);
  } catch (error) {
    console.info(error.message);
    return res.status(500).send("Server error");
  }
});

const userValidation = [
  check("email", "Type a valid email").isEmail(),
  check("password", "Password is required").exists()
];

/**
 * @route  POST api/auth
 * @desc   Authenticate & get token
 * @access Public
 */
router.post("/", userValidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    // See if user exists
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid credentials!" }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid credentials!" }] });
    }

    // Return json webtoken
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      config.get("jwtSecret"),
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        return res.json({ token });
      }
    );
  } catch (error) {
    return res.status(500).send(`server error: ${error.message}`);
  }
});

module.exports = router;
