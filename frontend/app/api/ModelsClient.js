'use strict';

import UserEntityClientBase from './UserEntityClientBase';

export default class ModelsClient extends UserEntityClientBase {
    constructor(urls) {
        super(urls, urls.modelsUrls());
    }
}
