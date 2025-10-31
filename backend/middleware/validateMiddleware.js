const validate = (schema) => (req, res, next) => {
  try {
      schema.parse(req.body);
      next();
  } catch (error) {
      if (error.errors) {
          return res.status(400).json({ success: false, message: error.errors[0].message });
      }
      res.status(400).json({ success: false, message: "Invalid input" });
  }
};

module.exports = validate;