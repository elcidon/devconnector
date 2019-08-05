const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const Profile = require("../../models/Profile");
const auth = require("../../middleware/auth");

const { check, validationResult } = require("express-validator");

/**
 * @route  GET api/profile/me
 * @desc   Get current profile
 * @access private
 */
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    if (!profile) {
      return res.status(400).json({ msg: "There's no profile for this user" });
    }
  } catch (err) {
    console.log(err.messagem);
    return res.status(500).send("Server error.");
  }
});

/**
 * @route  POST api/profile
 * @desc   Create or Update user Profile
 * @access private
 */
router.post(
  "/",
  [
    auth,
    check("status", "Status is required")
      .not()
      .isEmpty(),
    check("skills", "Skills is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(",").map(skill => skill.trim());
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //If profile exists then update it
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      profile = new Profile(profileFields);
      await profile.save();

      return res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route  GET api/profile
 * @desc   Get all profiles
 * @access public
 */
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.status(200).json(profiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server error");
  }
});

/**
 * @route  GET api/profile/user/:user_id
 * @desc   Get profile by user id
 * @access public
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);

    if (!profile) return res.status(404).json({ msg: "Profile not found." });

    res.status(200).json(profile);
  } catch (err) {
    console.log(err.message);
    if (err.kind == "ObjectId") {
      res.status(404).send("Profile not found.");
    } else {
      res.status(500).send("Server error");
    }
  }
});

/**
 * @route  DELETE api/profile
 * @desc   delete Profile, users & posts
 * @access private
 */
router.delete("/", auth, async (req, res) => {
  try {
    // TODO: delete posts

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route  PUT api/profile/experience
 * @desc   Add experience to a profile
 * @access private
 */
router.put(
  "/experience",
  [
    auth,
    check("title", "Title is required.")
      .not()
      .isEmpty(),
    check("company", "Company is required")
      .not()
      .isEmpty(),
    check("from", "From date is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      } = req.body;

      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      };

      try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);
        profile.save();

        res.status(200).json(profile);
      } catch (error) {
        console.error(error);
        res.status(500).send("server error");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route  DELETE api/profile/experience/:exp_id
 * @desc   Delete an experience
 * @access private
 */

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // TODO: get profile
    const profile = await Profile.findOne({ user: req.user.id });

    // TODO Get the correct experience to delete
    const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    profile.save();

    res.status(200).json(profile);

    // TODO Destroy it
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error.");
  }
});

/**
 * @route  PUT api/profile/education
 * @desc   Add education to a profile
 * @access private
 */
router.put(
  "/education",
  [
    auth,
    check("school", "School is required.")
      .not()
      .isEmpty(),
    check("degree", "Degree is required")
      .not()
      .isEmpty(),
    check("fieldofstudy", "Field of Study is required")
      .not()
      .isEmpty(),
    check("from", "From date is required")
      .not()
      .isEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      } = req.body;

      const newExp = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      };

      try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newExp);
        profile.save();

        res.status(200).json(profile);
      } catch (error) {
        console.error(error);
        res.status(500).send("server error");
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route  DELETE api/profile/education/:edu_id
 * @desc   Delete an education
 * @access private
 */
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    // TODO: get profile
    const profile = await Profile.findOne({ user: req.user.id });

    // TODO Get the correct education to delete
    const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    profile.save();

    res.status(200).json(profile);

    // TODO Destroy it
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Server error.");
  }
});

/**
 * @route  GET api/profile/github/:username
 * @desc   Get repositories from a specific user
 * @access public
 */
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: { "user-agent": "node.js" }
    };

    request(options, (errors, response, body) => {
      if (errors) console.log(errors);

      if (response.statusCode !== 200)
        return res.status(404).json({ msg: "No github profile found" });

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server Error");
  }
});

module.exports = router;
