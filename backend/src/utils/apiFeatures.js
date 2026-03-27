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

  filter() {
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
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(lt|lte|gt|gte|eq|ne)\b/g,
      (match) => `$${match}`,
    );
    const filter = JSON.parse(queryStr);
    this.mongooseQuery.find(filter);
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
