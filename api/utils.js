
// Added to routes as a middleware that checks for user login 
function requireUser(req, res, next) {
    if (!req.user) {
        next({
            name: "MissingUserError",
            message: "You must be logged in to perform this action"
        });
    }

    next();
}

module.exports = {
    requireUser
}