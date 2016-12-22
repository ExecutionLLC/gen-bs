const _= require('lodash');
const fs = require('fs');

const {services} = require('./../index');

let sourcesList = null;
const appServerReplyEvents = services.applicationServerReply.registeredEvents();
services.applicationServerReply.on(appServerReplyEvents.onSourcesListReceived, ({result}) => {
    sourcesList = result;
});
services.applicationServerReply.on(appServerReplyEvents.onSourceMetadataReceived, ({result:sourcesMetadata}) => {
    _.map(sourcesMetadata, (sourceMetadata, index) => {
        const sourceName = sourcesList[index].sourceName;
        return {
            sourceName,
            fields:sourceMetadata.fields,
            reference: sourceMetadata.reference
        };
    }).forEach(({sourceName, fields, reference}) => fs.writeFileSync(`./${sourceName}.json`, JSON.stringify({
        reference,
        fields
    }, null, 2)));
});
