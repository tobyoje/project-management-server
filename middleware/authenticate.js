const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  // If there is no auth header provided
  if (!req.headers.authorization) {
    return res.status(401).send("Please login");
  }

  // Verify the token
  const authToken = req.headers.authorization.split(" ")[1];

  try {
    const verifiedToken = jwt.verify(authToken, process.env.JWT_KEY);

    // Add the decoded token to the request object for use in routes
    req.user = verifiedToken;

    // Move onto the endpoint
    next();
  } catch (error) {
    // Reject the request
    console.log(error);
    res.status(401).send("Invalid auth token");
  }
};
