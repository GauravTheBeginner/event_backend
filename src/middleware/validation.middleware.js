// Validation middleware using Zod schemas
export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
};

// Validate URL parameters
export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
};

// Validate query parameters
export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
  };
};
