const _ = require('lodash');
const mandrill = require('mandrill-api');
const ServiceBase = require('../ServiceBase');

class MailChimpMailService extends ServiceBase {

    constructor(services) {
        super(services)
    }

    sendRegisterMail(email, params, callback){
        const {mailChimp:{userRegisterTemplate}} = this.config;
        this._sendMail(email, userRegisterTemplate, params, callback)
    }

    sendRegisterCodeMail(email, params, callback){
        const {mailChimp:{userRegisterCodeTemplate}} = this.config;
        this._sendMail(email, userRegisterCodeTemplate, params, callback)
    }

    sendRegisterApproveMail(email, params, callback){
        const {mailChimp:{userRegisterApproveTemplate}} = this.config;
        this._sendMail(email, userRegisterApproveTemplate, params, callback)
    }

    sendAdminRegisterMail(email, params, callback){
        const {mailChimp:{adminRegisterTemplate}} = this.config;
        this._sendMail(email, adminRegisterTemplate, params, callback)
    }

    sendAdminRegisterApproveMail(email, params, callback){
        const {mailChimp:{adminRegisterApproveTemplate}} = this.config;
        this._sendMail(email, adminRegisterApproveTemplate, params, callback)
    }

    _sendMail(email, templateName, params, callback) {
        const {mailChimp:{key, fromMail, fromName}} = this.config;

        const mandrill_client = new mandrill.Mandrill(key, true);
        const message = {
            from_email: fromMail,
            from_name: fromName,
            to: [
                {
                    email
                }
            ],
            global_merge_vars: _.map(params, (value, key) => {
                return {
                    name: key,
                    content: value
                }
            })
        };
        mandrill_client.messages.sendTemplate({
                "template_name": templateName,
                "template_content":[],
                "message": message
            },
            (result) => callback(null, result),
            (error) => callback(error, null)
        );
    }
}

module.exports = MailChimpMailService;