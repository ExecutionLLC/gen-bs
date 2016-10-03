const _ = require('lodash');
const mandrill = require('mandrill-api');
const ServiceBase = require('../ServiceBase');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

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

        const mandrillClient = new mandrill.Mandrill(key, true);
        const message = {
            fromEmail: fromMail,
            fromName: fromName,
            to: [{
                email
            }],
            globalMergeVars: _.map(params, (value, key) => {
                return {
                    name: key,
                    content: value
                }
            })
        };
        mandrillClient.messages.sendTemplate(ChangeCaseUtil.convertKeysToSnakeCase({
                templateName,
                templateContent:[],
                message
            }),
            (result) => {
                const {reject_reason} = result[0];
                if (reject_reason == null){
                    callback(null, result[0])
                }
                callback(new Error(reject_reason), null)
            },
            (error) => callback(error, null)
        );
    }
}

module.exports = MailChimpMailService;