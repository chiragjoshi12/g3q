export const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error); // handled uniformly by errorHandler (see error.middleware.js)
  }
};
