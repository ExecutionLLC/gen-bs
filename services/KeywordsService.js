'use strict';

const ServiceBase = require('./ServiceBase');

class KeywordService extends ServiceBase {
  constructor(services, models) {
    super(services, models);
  }

  find(keywordId, callback) {
    this.models.keywords.find(keywordId, callback);
  }

  findMany(keywordIds, callback) {
    this.models.findMany(keywordIds, callback);
  }
}

module.exports = KeywordService;
