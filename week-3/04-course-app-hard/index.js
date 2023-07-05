const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = express();

app.use(express.json());

const adminSecret = "admin";
const userSecret = "user";

const adminSchema = mongoose.Schema({
  username: String,
  password: String,
});

const Admin = mongoose.model("Admin", adminSchema);

const userSchema = mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
});

const User = mongoose.model("User", userSchema);

const courseSchema = mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean,
});

const Course = mongoose.model("Course", courseSchema);

mongoose.connect("your mongo db connection string here", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

function generateTokenAdmin(body) {
  return jwt.sign(body, adminSecret, { expiresIn: "1h" });
}

function generateTokenUser(body) {
  return jwt.sign(body, userSecret, { expiresIn: "1h" });
}

function authenticateTokenAdmin(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    const tokenValue = token.split(" ")[1];

    jwt.verify(tokenValue, adminSecret, (err, data) => {
      if (!err) {
        req.username = data.username;
        next();
      } else {
        res.sendStatus(403);
      }
    });
  } else {
    res.sendStatus(403);
  }
}

function authenticateTokenUser(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    const tokenValue = token.split(" ")[1];
    jwt.verify(tokenValue, userSecret, (err, data) => {
      if (!err) {
        req.username = data.username;
        next();
      } else {
        res.sendStatus(403);
      }
    });
  } else {
    res.sendStatus(403);
  }
}

// Admin routes
app.post("/admin/signup", async (req, res) => {
  // logic to sign up admin
  const { username, password } = req.body;
  if (username && password) {
    const exists = await Admin.findOne({ username });
    if (exists) {
      res.status(400).send("Admin already exists");
    } else {
      const token = generateTokenAdmin({ username: username });
      var admin = new Admin({ username, password });
      await admin.save();
      res
        .status(200)
        .json({ message: "Admin created successfully", token: token });
    }
  } else {
    res.status(400).send("all fields required");
  }
});

app.post("/admin/login", async (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin = await Admin.findOne({ username, password });
  if (admin) {
    const token = generateTokenAdmin({ username: admin.username });
    res.status(200).json({ message: "Logged in successfully", token: token });
  } else {
    res.status(403).send("Admin not found");
  }
});

app.post("/admin/courses", authenticateTokenAdmin, async (req, res) => {
  // logic to create a course
  const username = req.username;
  const admin = await Admin.findOne({ username });
  if (admin) {
    const id = Date.now();
    const course = { ...req.body, courseId: id };
    const newCourse = new Course(course);
    await newCourse.save();
    res
      .status(200)
      .json({ message: "Course created successfully", courseId: id });
  } else {
    res.status(403);
  }
});

app.put(
  "/admin/courses/:courseId",
  authenticateTokenAdmin,
  async (req, res) => {
    // logic to edit a course
    const username = req.username;
    const courseId = req.params.courseId;

    const admin = await Admin.findOne({ username });
    if (admin) {
      const course = await Course.findByIdAndUpdate(courseId, req.body);
      await course.save();
      res.status(200).json({ message: "Course updated successfully" });
    } else {
      res.sendStatus(403);
    }
  }
);

app.get("/admin/courses", authenticateTokenAdmin, async (req, res) => {
  // logic to get all courses
  const username = req.username;
  const admin = await Admin.findOne({ username });
  if (admin) {
    const courses = await Course.find({});
    res.status(200).json({
      courses: courses,
    });
  } else {
    res.sendStatus(403);
  }
});

// User routes
app.post("/users/signup", async (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  if (username && password) {
    const exists = await User.findOne({ username });
    if (!exists) {
      const id = generateTokenUser({ username: username });
      const user = new User(req.body);
      await user.save();
      res.status(200).json({
        message: "User created successfully",
        token: id,
      });
    } else {
      res.status(400).send("user already exists");
    }
  }
});

app.post("/users/login", async (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  if (username && password) {
    const exists = await User.findOne({ username, password });
    if (exists) {
      const id = generateTokenUser({ username: username });
      res.status(200).json({ message: "Logged in successfully", token: id });
    } else {
      res.sendStatus(403);
    }
  }
});

app.get("/users/courses", authenticateTokenUser, async (req, res) => {
  // logic to list all courses
  const username = req.username;
  const user = await User.findOne({ username });
  if (user) {
    const courses = await Course.find({ published: true });
    res.status(200).json({
      courses: courses,
    });
  } else {
    res.sendStatus(403);
  }
});

app.post(
  "/users/courses/:courseId",
  authenticateTokenUser,
  async (req, res) => {
    // logic to purchase a course
    const username = req.username;
    const courseId = req.params.courseId;
    const user = await User.findOne({ username });
    if (user) {
      const course = await Course.findById(courseId);
      user.purchasedCourses.push(course);
      await user.save();
      res.status(200).json({ message: "Course purchased successfully" });
    } else {
      res.sendStatus(403);
    }
  }
);

app.get("/users/purchasedCourses", authenticateTokenUser, async (req, res) => {
  // logic to view purchased courses
  const username = req.username;
  const user = await User.findOne({ username }).populate("purchasedCourses");
  if (user) {
    res.status(200).json({
      purchasedCourses: user.purchasedCourses,
    });
  } else {
    res.sendStatus(403);
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
