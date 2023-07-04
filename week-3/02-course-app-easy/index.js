const express = require("express");
const { v4: uuidv4 } = require("uuid");
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

function adminAuth(req, res, next) {
  const { username, password } = req.headers;
  const isAdmin = ADMINS.find(
    (a) => a.username === username && a.password === password
  );
  if (isAdmin) {
    next();
  } else {
    res.status(400).send("Access Denied");
  }
}

function userAuth(req, res, next) {
  const { username, password } = req.headers;
  const isUser = USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (isUser) {
    req.user = isUser;
    next();
  } else {
    res.status(400).send("user not found");
  }
}

// Admin routes
app.post("/admin/signup", (req, res) => {
  // logic to sign up admin
  const username = req.body.username;
  const password = req.body.password;

  var adminExists = ADMINS.find((user) => user.username === username);
  if (!adminExists) {
    ADMINS.push({
      username: username,
      password: password,
    });
    res.status(200).json({
      message: "Admin created successfully",
    });
  } else {
    res.status(400).send("Admin already exists");
  }
});

app.post("/admin/login", adminAuth, (req, res) => {
  // logic to log in admin
  res.status(200).json({
    message: "Logged in successfully",
  });
});

app.post("/admin/courses", adminAuth, (req, res) => {
  // logic to create a course

  const title = req.body.title;
  const description = req.body.description;
  const price = req.body.price;
  const imageLink = req.body.imageLink;
  const published = req.body.published;
  const id = uuidv4();
  const course = {
    id: id,
    title: title,
    description: description,
    price: price,
    imageLink: imageLink,
    published: published,
  };
  COURSES.push(course);
  res
    .status(200)
    .json({ message: "Course created successfully", courseId: id });
});

app.put("/admin/courses/:courseId", adminAuth, (req, res) => {
  // logic to edit a course
  const courseId = req.params.courseId;
  var course = COURSES.find((c) => c.id === courseId);
  if (course) {
    Object.assign(course, req.body);
    res.status(200).json({ message: "Course updated successfully" });
  }
});

app.get("/admin/courses", (req, res) => {
  // logic to get all courses
  const username = req.headers.username;
  const password = req.headers.password;
  var isAdmin = false;
  for (let i = 0; i < ADMINS.length; i++) {
    if (ADMINS[i].username === username && ADMINS[i].password === password) {
      isAdmin = true;
    }
  }

  if (isAdmin === false) {
    res.status(400).send("Access Denied");
  } else {
    res.status(200).json({ courses: COURSES });
  }
});

// User routes
app.post("/users/signup", (req, res) => {
  // logic to sign up user
  const user = { ...req.body, purchasedCourse: [] };
  USERS.push(user);
  res.status(200).json({ message: "User created successfully" });
});

app.post("/users/login", userAuth, (req, res) => {
  // logic to log in user
  res.status(200).json({ message: "Logged in successfully" });
});

app.get("/users/courses", userAuth, (req, res) => {
  // logic to list all courses
  const courses = COURSES.filter((c) => c.published);
  res.status(200).json({ courses: courses });
});

app.post("/users/courses/:courseId", userAuth, (req, res) => {
  // logic to purchase a course
  const courseId = req.params.courseId;
  const user = req.user;

  const course = COURSES.find((c) => c.id === courseId);

  user.purchasedCourse.push(course);

  res.status(200).json({ message: "Course purchased successfully" });
});

app.get("/users/purchasedCourses", userAuth, (req, res) => {
  // logic to view purchased courses
  const user = req.user;
  res.status(200).json({ purchasedCourse: user.purchasedCourse });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
