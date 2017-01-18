'use strict';

const ApplicationServerServiceBase = require('./ApplicationServerServiceBase');
const RPCProxy = require('../../../utils/RPCProxy');

const METHODS = require('./AppServerMethods');

/**
 * This service sends requests to AS.
 * Replies to these requests are handled
 * by the separate ApplicationServerReplyService.
 * */
class ApplicationServerService extends ApplicationServerServiceBase {
    constructor(services) {
        super(services);

        this.requestSourcesList = this.requestSourcesList.bind(this);
        this.requestSourceMetadata = this.requestSourceMetadata.bind(this);
        this.requestCloseSession = this.requestCloseSession.bind(this);
        this.requestOpenSearchSession = this.requestOpenSearchSession.bind(this);
        this.requestSearchInResults = this.requestSearchInResults.bind(this);
        this.requestOperationState = this.requestOperationState.bind(this);

        this._rpcReply = this._rpcReply.bind(this);
    }

    registeredEvents() {
        return METHODS;
    }

    isRPCConnected() {
        return this.rpcProxy.isConnected();
    }

    requestSourcesList(callback) {
        this.services.applicationServerSources.requestSourcesList(callback);
    }

    requestSourceMetadata(sourceNames, callback) {
        this.services.applicationServerSources.requestSourceMetadata(sourceNames, callback);
    }

    requestKeepOperationAlive(session, searchOperation, callback) {
        this.services.applicationServerOperations.requestKeepOperationAlive(session, searchOperation, callback);
    }

    /**
     * Opens a new search session.
     * @param session Session in which the operation should be opened.
     * @param params All the params necessary to open search session.
     * @param callback (error, operationId)
     * */
    requestOpenSearchSession(session, params, callback) {
        this.services.applicationServerSearch.requestOpenSearchSession(session, params, callback);
    }

    loadResultsPage(user, session, operationId, limit, offset, callback) {
        this.services.applicationServerSearch.loadResultsPage(user, session, operationId, limit, offset, callback);
    }

    /**
     * Sends specified file sample to application server.
     *
     * @param session Session to which the file belongs.
     * @param sampleId Id of the sample.
     * @param user Session owner.
     * @param sampleLocalPath Full local path to the sample file.
     * @param sampleFileName Original name of the sample file.
     * @param callback (error, operationId)
     * */
    uploadSample(session, user, fileId, sampleFileName, callback) {
        this.services.applicationServerUpload.uploadSample(session, user, fileId, sampleFileName, callback);
    }

    /**
     * Sends request to process previously uploaded sample. Results will be sent by AS web socket.
     *
     * @param session Session the request is related to.
     * @param operationId Id of the upload operation.
     * @param sampleId Id of the sample to be converted.
     * @param priority Priority of the request (larger number corresponds to a higher priority).
     * @param callback (error, operationId)
     * */
    requestUploadProcessing(session, operationId, priority, callback) {
        this.services.applicationServerUpload.requestUploadProcessing(session, operationId,
            priority, callback);
    }

    /**
     * Requests AS to close the specified operation.
     *
     * @param session Session the operation is related to.
     * @param operationId Id of the operation to close.
     * @param callback (error, operationId)
     * */
    requestCloseSession(session, operationId, callback) {
        this.services.applicationServerOperations.requestCloseSession(session, operationId, callback);
    }

    requestSearchInResults(session, operationId, params, callback) {
        this.services.applicationServerSearch.requestSearchInResults(session, operationId, params, callback);
    }

    requestOperationState(session, operationId, callback) {
        this.services.applicationServerOperations.requestOperationState(session, operationId, callback);
    }
}

module.exports = ApplicationServerService;