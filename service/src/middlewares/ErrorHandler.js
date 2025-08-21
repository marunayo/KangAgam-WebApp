const errorHandler = (err, req, res, next) => {
  // Terkadang error datang tanpa status code, default ke 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  res.json({
    message: err.message,
    // Tampilkan stack trace hanya jika kita tidak di lingkungan production
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export default errorHandler;