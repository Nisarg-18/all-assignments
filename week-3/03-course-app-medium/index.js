const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const app = express();

app.use(express.json());

const adminSecret = "admin";
const userSecret = "user";

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
app.post("/admin/signup", (req, res) => {
  // logic to sign up admin
  const { username, password } = req.body;
  if (username && password) {
    fs.readFile("admins.json", { encoding: "utf-8" }, (err, data) => {
      const admins = JSON.parse(data);
      const exists = admins.find((a) => a.username === username);
      if (exists) {
        res.status(400).send("Admin already exists");
      } else {
        const token = generateTokenAdmin({ username: username });
        const admin = {
          username: username,
          password: password,
          token: token,
        };
        admins.push(admin);
        fs.writeFile("admins.json", JSON.stringify(admins), (err) => {
          if (!err) {
            res
              .status(200)
              .json({ message: "Admin created successfully", token: token });
          } else {
            res.sendStatus(401);
          }
        });
      }
    });
  } else {
    res.status(400).send("all fields required");
  }
});

app.post("/admin/login", (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  fs.readFile("admins.json", { encoding: "utf-8" }, (err, data) => {
    const admins = JSON.parse(data);
    const admin = admins.find(
      (a) => a.username === username && a.password === password
    );
    if (admin) {
      const token = generateTokenAdmin({ username: admin.username });
      admin.token = token;
      fs.writeFile("admins.json", JSON.stringify(admins), (err) => {
        if (!err) {
          res
            .status(200)
            .json({ message: "Logged in successfully", token: token });
        } else {
          res.sendStatus(401);
        }
      });
    } else {
      res.status(403).send("Admin not found");
    }
  });
});

app.post("/admin/courses", authenticateTokenAdmin, (req, res) => {
  // logic to create a course
  const username = req.username;
  fs.readFile("admins.json", { encoding: "utf-8" }, (err, data) => {
    const admins = JSON.parse(data);
    const admin = admins.find((a) => a.username === username);
    if (admin) {
      const id = Date.now();
      const course = { ...req.body, courseId: id };
      fs.readFile("courses.json", { encoding: "utf-8" }, (err, data) => {
        const courses = JSON.parse(data);
        courses.push(course);
        fs.writeFile("courses.json", JSON.stringify(courses), (err) => {
          if (!err) {
            res
              .status(200)
              .json({ message: "Course created successfully", courseId: id });
          } else {
            res.sendStatus(401);
          }
        });
      });
    } else {
      res.status(403);
    }
  });
});

app.put("/admin/courses/:courseId", authenticateTokenAdmin, (req, res) => {
  // logic to edit a course
  const username = req.username;
  const courseId = req.params.courseId;
  fs.readFile("admins.json", { encoding: "utf-8" }, (err, data) => {
    const admins = JSON.parse(data);
    const admin = admins.find((a) => a.username === username);
    if (admin) {
      fs.readFile("courses.json", { encoding: "utf-8" }, (err, data) => {
        const courses = JSON.parse(data);
        const course = courses.find((c) => c.courseId == courseId);
        Object.assign(course, req.body);
        fs.writeFile("courses.json", JSON.stringify(courses), (err) => {
          if (!err) {
            res.status(200).json({ message: "Course updated successfully" });
          } else {
            res.sendStatus(401);
          }
        });
      });
    } else {
      res.sendStatus(403);
    }
  });
});

app.get("/admin/courses", authenticateTokenAdmin, (req, res) => {
  // logic to get all courses
  const username = req.username;
  fs.readFile("admins.json", { encoding: "utf-8" }, (err, data) => {
    const admins = JSON.parse(data);
    const admin = admins.find((a) => a.username === username);
    if (admin) {
      fs.readFile("courses.json", { encoding: "utf-8" }, (err, data) => {
        res.status(200).json({
          courses: JSON.parse(data),
        });
      });
    } else {
      res.sendStatus(403);
    }
  });
});

// User routes
app.post("/users/signup", (req, res) => {
  // logic to sign up user
  const { username, password } = req.body;
  if (username && password) {
    fs.readFile("users.json", { encoding: "utf-8" }, (err, data) => {
      const users = JSON.parse(data);
      const exists = users.find((u) => u.username === username);
      if (!exists) {
        const id = generateTokenUser({ username: username });
        users.push({ ...req.body, purchasedCourses: [], token: id });
        fs.writeFile("users.json", JSON.stringify(users), (err) => {
          if (!err) {
            res.status(200).json({
              message: "User created successfully",
              token: id,
            });
          } else {
            res.sendStatus(401);
          }
        });
      } else {
        res.status(400).send("user already exists");
      }
    });
  }
});

app.post("/users/login", (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  if (username && password) {
    fs.readFile("users.json", { encoding: "utf-8" }, (err, data) => {
      const users = JSON.parse(data);
      const exists = users.find(
        (u) => u.username === username && u.password === password
      );
      if (exists) {
        const id = generateTokenUser({ username: username });
        exists.token = id;
        fs.writeFile("users.json", JSON.stringify(users), (err) => {
          if (!err) {
            res
              .status(200)
              .json({ message: "Logged in successfully", token: id });
          } else {
            res.sendStatus(401);
          }
        });
      } else {
        res.sendStatus(403);
      }
    });
  }
});

app.get("/users/courses", authenticateTokenUser, (req, res) => {
  // logic to list all courses
  const username = req.username;
  fs.readFile("users.json", { encoding: "utf-8" }, (err, data) => {
    const users = JSON.parse(data);
    const user = users.find((u) => u.username === username);
    if (user) {
      fs.readFile("courses.json", { encoding: "utf-8" }, (err, data) => {
        const courses = JSON.parse(data);
        res.status(200).json({
          courses: courses.filter((c) => c.published),
        });
      });
    } else {
      res.sendStatus(403);
    }
  });
});

app.post("/users/courses/:courseId", authenticateTokenUser, (req, res) => {
  // logic to purchase a course
  const username = req.username;
  const courseId = req.params.courseId;
  fs.readFile("users.json", { encoding: "utf-8" }, (err, data) => {
    const users = JSON.parse(data);
    const user = users.find((u) => u.username === username);
    if (user) {
      fs.readFile("courses.json", { encoding: "utf-8" }, (err, data) => {
        const courses = JSON.parse(data);
        const course = courses.find((c) => c.courseId == courseId);
        user.purchasedCourses.push(course);
        fs.writeFile("users.json", JSON.stringify(users), (err) => {
          if (!err) {
            res.status(200).json({ message: "Course purchased successfully" });
          } else {
            res.sendStatus(401);
          }
        });
      });
    } else {
      res.sendStatus(403);
    }
  });
});

app.get("/users/purchasedCourses", authenticateTokenUser, (req, res) => {
  // logic to view purchased courses
  const username = req.username;
  fs.readFile("users.json", { encoding: "utf-8" }, (err, data) => {
    const users = JSON.parse(data);
    const user = users.find((u) => u.username === username);
    if (user) {
      res.status(200).json({
        purchasedCourses: user.purchasedCourses,
      });
    } else {
      res.sendStatus(403);
    }
  });
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
