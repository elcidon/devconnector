const express = require("express");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");

const { check, validationResult } = require("express-validator");
const router = express.Router();

const User = require("../../models/User");

const userValidation = [
  check("name", "Type a valid name")
    .not()
    .isEmpty(),
  check("email", "Type a valid email").isEmail(),
  check("password", "Password must be at least 6 chars").isLength({
    min: 6
  })
];

/**
 * @route  POST api/users
 * @desc   Register user
 * @access Public
 */
router.post("/", userValidation, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    // See if user exists
    if (user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User already exists!" }] });
    }

    // Get User Gravatar
    const avatar = gravatar.url({
      s: "200",
      r: "pg",
      d: "mm"
    });

    user = new User({
      name,
      email,
      avatar,
      password
    });

    // Encrypt Passwd
    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password, salt);

    await user.save();

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
    return res.status(500).send("server error");
  }
});

module.exports = router;
