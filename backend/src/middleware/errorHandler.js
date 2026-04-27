// Central error handler — catches anything thrown in route handlers
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.message);

  // SQLite constraint violations
  if (err.code === "SQLITE_CONSTRAINT") {
    return res.status(409).json({ error: "Conflict: duplicate entry" });
  }

  return res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}

module.exports = { errorHandler };
