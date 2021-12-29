module.exports.isAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ msg: 'You are not authorized to view this resource' });
    }
}


module.exports.isUser = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role == 0) {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}

module.exports.isTeamSupervisor = (req, res, next) => {
    console.log(req.user)
    if (req.isAuthenticated() && req.user.teamrole == 1) {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}

module.exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role == 1) {
        next();
    } else {
        res.status(401).send({ msg: 'You are not authorized to view this resource because you are not an admin.' });
    }
}



