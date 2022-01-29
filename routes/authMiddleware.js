export const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res
      .status(401)
      .json({ msg: "You are not authorized to view this resource" });
  }
};

export const isUser = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role == 0) {
    next();
  } else {
    res
      .status(401)
      .send({
        msg: "You are not authorized to view this resource because you are not an admin.",
      });
  }
};

export const isTeamSupervisor = (req, res, next) => {
  console.log(req.user);
  if (req.isAuthenticated() && req.user.teamrole == 1) {
    next();
  } else {
    res
      .status(401)
      .send({
        msg: "You are not authorized to view this resource because you are not an admin.",
      });
  }
};

export const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role == 1) {
    next();
  } else {
    res
      .status(401)
      .send({
        msg: "You are not authorized to view this resource because you are not an admin.",
      });
  }
};
