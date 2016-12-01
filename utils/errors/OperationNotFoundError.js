class OperationNotFoundError extends Error {
    constructor(message) {
        super(message || 'Operation not Found');
    }
}

module.exports = OperationNotFoundError;