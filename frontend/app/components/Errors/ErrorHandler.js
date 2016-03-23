import React, { Component } from 'react';

export default class ErrorHandler extends Component {
}

function mapStateToProps(state) {
    const { errorHandler: errorQueue } = state;

    return {
        nextError = errorQueue[0]
    }
}

export default connect(mapStateToProps)(ErrorHandler);
