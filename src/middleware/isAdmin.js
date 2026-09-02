export const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Access denied",
        data: null,
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied: Admins only",
        data: null,
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Error verifying admin role",
      data: error.message,
    });
  }
};
