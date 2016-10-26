const _ = require('lodash');
const mandrill = require('mandrill-api');
const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');

class MailChimpMailService {

    constructor(config) {
        this.config = config;
    }

    sendRegisterMailAsync(email, params, callback){
        const {mailChimp:{userRegisterTemplate}} = this.config;
        return this._sendMailAsync(email, userRegisterTemplate, params, callback)
    }

    sendRegisterCodeMailAsync(email, params, callback){
        const {mailChimp:{userRegisterCodeTemplate}} = this.config;
        return this._sendMailAsync(email, userRegisterCodeTemplate, params, callback)
    }

    sendRegisterApproveMailAsync(email, params, callback){
        const {mailChimp:{userRegisterApproveTemplate}} = this.config;
        return this._sendMailAsync(email, userRegisterApproveTemplate, params, callback)
    }

    sendAdminRegisterMailAsync(params, callback){
        const {mailChimp:{adminRegisterTemplate, adminEmail}} = this.config;
        return this._sendMailAsync(adminEmail, adminRegisterTemplate, params, callback)
    }

    sendAdminRegisterApproveMailAsync(params, callback){
        const {mailChimp:{adminRegisterApproveTemplate, adminEmail}} = this.config;
        return this._sendMailAsync(adminEmail, adminRegisterApproveTemplate, params, callback)
    }

    _sendMailAsync(email, templateName, params, callback) {
        const {mailChimp:{key, fromEmail, fromName}} = this.config;

        const mandrillClient = new mandrill.Mandrill(key, true);
        const message = {
            fromEmail,
            fromName,
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

        return new Promise((resolve, reject) => {
            mandrillClient.messages.sendTemplate(ChangeCaseUtil.convertKeysToSnakeCase({
                    templateName,
                    templateContent:[],
                    message
                }),
                (result) => {
                    const {rejectReason} = ChangeCaseUtil.convertKeysToCamelCase(result[0]);
                    if (rejectReason == null){
                        resolve(result[0]);
                    } else {
                        reject(new Error(rejectReason));
                    }
                },
                (error) => reject(error)
            );
        });
    }
}

module.exports = MailChimpMailService;