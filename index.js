import express from "express";
import passport from "passport";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import routes from "./routes/index.js";
import auth from "./boot/auth.js";
import express_session from "express-session";

var app = express();

auth();

import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicRoot = "Users/user/Documents/program/vueauthclient/dist";
app.use(express.static(publicRoot));

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  express_session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(function (req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !!msgs.length;
  req.session.messages = [];
  next();
});
app.use(passport.initialize());
app.use(passport.authenticate("session"));

// Define routes.
app.use(routes);

const port = 8080
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
