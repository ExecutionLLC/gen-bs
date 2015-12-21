'use strict';

const Express = require('express');

const ControllerBase = require('./ControllerBase');

const USER_METADATA = require('../test_data/user_metadata.json');

class DataController extends ControllerBase {
  constructor(services) {
    super(services);

    this.getData = this.getData.bind(this);
  }

  getData(request, response) {
    const user = request.user;
    const sampleId = 'get-sample-id-from-request-or-set-default-here';
    this.services.fieldsMetadata.findForUserBySampleId(user, sampleId, (error, fieldMetadata) => {
      // Get field metadata for sample.
      if (error) {
        this.sendInternalError(response, error);
      } else {
        this.services.views.findAll(user, (error, views) => {
          if (error) {
            this.sendInternalError(response, error);
          } else {
            this.services.filters.findByUser(user, (error, filters) => {
              if (error) {
                this.sendInternalError(response, error);
              } else {
                this.services.samples.findAllForUser(user, (error, samples) => {
                  if (error) {
                    this.sendInternalError(response, error);
                  } else {
                    const dataObject = this._mergeDataResponse(user, views, filters, samples);
                    this.sendJson(response, dataObject);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  _mergeDataResponse(user, views, filters, samples) {
    return {
      profileMetadata: user,
      views: views,
      filters: filters,
      samples: samples
    };
  }

  getUserMetadata(request, response) {
    this.sendJson(response, USER_METADATA);
  }

  createRouter() {
    const router = new Express();
    router.get('/', this.getData);
    return router;
  }
}

module.exports = DataController;
