export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      return next(result.error);
    }

    req.validated = req.validated || {};
    req.validated[property] = result.data;

    next();
  };
};
