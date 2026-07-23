/** Generic Joi request-body validator (VAPT: input validation on major write endpoints). */
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });
    if (error) {
      return res.status(400).json({
        message: 'Invalid request payload.',
        errors: error.details.map((d) => ({
          path: d.path.join('.'),
          message: d.message,
        })),
      });
    }
    req.body = value;
    return next();
  };
}

module.exports = { validateBody };
