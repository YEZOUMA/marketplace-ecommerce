// Validates req.body/query/params against a Zod schema and replaces them with the parsed value.
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.parse({
    body: req.body,
    query: req.query,
    params: req.params,
  });
  if (parsed.body) req.body = parsed.body;
  if (parsed.query) req.query = parsed.query;
  if (parsed.params) req.params = parsed.params;
  next();
};
