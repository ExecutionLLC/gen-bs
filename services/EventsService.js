const ServiceBase = require('./ServiceBase');

class EventsService extends ServiceBase {
    constructor(services, models) {
        super(services, models);
    }

    addEvent(userId, eventType, callback) {
        const event = {
            type: eventType
        };
        this.models.events.add(userId, event, callback)
    }
}
module.exports = EventsService;