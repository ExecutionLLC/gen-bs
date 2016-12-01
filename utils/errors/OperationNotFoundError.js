class OperationNotFoundError extends Error {
    constructor(message) {
        super(message || 'Operation not found');
    }
}

module.exports = OperationNotFoundError;