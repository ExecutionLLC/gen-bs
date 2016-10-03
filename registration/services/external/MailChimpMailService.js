const _ = require('lodash');
const mandrill = require('mandrill-api');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

class MailChimpMailService {

    constructor(config) {
        this.config = config;
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

    sendAdminRegisterMail(params, callback){
        const {mailChimp:{adminRegisterTemplate, adminEmail}} = this.config;
        this._sendMail(adminEmail, adminRegisterTemplate, params, callback)
    }

    sendAdminRegisterApproveMail(params, callback){
        const {mailChimp:{adminRegisterApproveTemplate, adminEmail}} = this.config;
        this._sendMail(adminEmail, adminRegisterApproveTemplate, params, callback)
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
                } else {
                    callback(new Error(reject_reason), null)
                }
            },
            (error) => callback(error, null)
        );
    }
}

module.exports = MailChimpMailService;