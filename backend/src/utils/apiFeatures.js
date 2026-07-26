class APIFeatures {
  constructor(mongooseQuery, query) {
    this.mongooseQuery = mongooseQuery;
    this.query = query;
  }

  search(fields) {
    if (this.query.search) {
      const keyword = this.query.search;
      const searchFields = fields ||
        this.query.searchFields?.split(',') || ['name', 'email'];

      this.mongooseQuery.find({
        $or: searchFields.map((field) => ({
          [field]: { $regex: keyword, $options: 'i' },
        })),
      });
    }
    return this;
  }

 filter(allowedFields = []) {
    const queryObj = { ...this.query };
    const excludedFileds = [
      'page',
      'limit',
      'fields',
      'sort',
      'search',
      'searchFields',
    ];
    excludedFileds.forEach((f) => delete queryObj[f]);

    const safeOperators = ['lt', 'lte', 'gt', 'gte', 'eq', 'ne'];
    const sanitized = {};

    Object.keys(queryObj).forEach((key) => {
      if (key.startsWith('$')) return;
      if (!allowedFields.includes(key)) return;

      const value = queryObj[key];

      if (value && typeof value === 'object') {
        const cleanOps = {};
        Object.keys(value).forEach((op) => {
          const bareOp = op.replace(/^\$/, '');
          if (safeOperators.includes(bareOp)) {
            cleanOps[`$${bareOp}`] = value[op];
          }
        });
        if (Object.keys(cleanOps).length) sanitized[key] = cleanOps;
        return;
      }

      if (typeof value === 'string' || typeof value === 'number') {
        sanitized[key] = value;
      }
    });

    this.mongooseQuery.find(sanitized);
    return this;
  }

  sort() {
    const sortBy = this.query.sort?.split(',').join(' ') || '-createdAt';
    this.mongooseQuery.sort(sortBy);
    return this;
  }

  select() {
    const fields = this.query.fields?.split(',').join(' ') || '-__v';
    this.mongooseQuery.select(fields);
    return this;
  }

  paginate() {
    let page = this.query.page * 1 || 1;
    if (page < 0) page = 1;
    const limit = this.query.limit * 1 || 10;
    const skip = (page - 1) * limit;
    this.page = page;
    this.limit = limit;
    this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}

export default APIFeatures;
