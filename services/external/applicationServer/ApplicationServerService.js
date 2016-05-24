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

    requestKeepOperationAlive(sessionId, searchOperationId, callback) {
        this.services.applicationServerOperations.requestKeepOperationAlive(sessionId, searchOperationId, callback);
    }

    /**
     * Opens a new search session.
     * @param sessionId Id of the session in which the operation should be opened.
     * @param params All the params necessary to open search session.
     * @param callback (error, operationId)
     * */
    requestOpenSearchSession(sessionId, params, callback) {
        this.services.applicationServerSearch.requestOpenSearchSession(sessionId, params, callback);
    }

    loadResultsPage(user, sessionId, operationId, limit, offset, callback) {
        this.services.applicationServerSearch.loadResultsPage(user, sessionId, operationId, limit, offset, callback);
    }

    /**
     * Sends specified file sample to application server.
     *
     * @param sessionId Id of the session to which the file belongs.
     * @param sampleId Id of the sample.
     * @param user Session owner.
     * @param sampleLocalPath Full local path to the sample file.
     * @param sampleFileName Original name of the sample file.
     * @param callback (error, operationId)
     * */
    uploadSample(sessionId, sampleId, user, sampleLocalPath, sampleFileName, callback) {
        this.services.applicationServerUpload.uploadSample(sessionId, sampleId, user, sampleLocalPath, sampleFileName, callback);
    }

    /**
     * Sends request to process previously uploaded sample. Results will be sent by AS web socket.
     *
     * @param sessionId Id of the session the request is related to.
     * @param operationId Id of the upload operation.
     * @param callback (error, operationId)
     * */
    requestSampleProcessing(sessionId, operationId, callback) {
        this.services.applicationServerUpload.requestSampleProcessing(sessionId, operationId, callback);
    }

    /**
     * Requests AS to close the specified operation.
     *
     * @param sessionId Id of the session the operation is related to.
     * @param operationId Id of the operation to close.
     * @param callback (error, operationId)
     * */
    requestCloseSession(sessionId, operationId, callback) {
        this.services.applicationServerOperations.requestCloseSession(sessionId, operationId, callback);
    }

    requestSearchInResults(sessionId, operationId, params, callback) {
        this.services.applicationServerSearch.requestSearchInResults(sessionId, operationId, params, callback);
    }

    requestOperationState(operationId, callback) {
        this.services.applicationServerOperations.requestOperationState(operationId, callback);
    }
}

module.exports = ApplicationServerService;