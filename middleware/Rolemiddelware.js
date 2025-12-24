// middlewares/roleMiddleware.js
export const permit = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(403).json({ message: "Role missing" });
    if (allowedRoles.includes(userRole)) return next();
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  };
};
