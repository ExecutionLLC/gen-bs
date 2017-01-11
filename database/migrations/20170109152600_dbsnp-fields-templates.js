
exports.up = function(knex, Promise) {

    console.log('Adding url templates for dbsnp fields');

    const defaultLinkIdentity = '###DATA###';
    const urlTemplates = [
        {
            fieldName: 'INFO_RS',
            valueType: 'string',
            dimension: 1,
            url: 'https://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=',
            sourceName:'clinvar_20160705_v01'
        },
        {
            fieldName: 'INFO_RS',
            valueType: 'string',
            dimension: 1,
            url: 'https://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=',
            sourceName:'dbsnp_20160601_v01'
        }
    ];

    return Promise.map(urlTemplates, (item) => {
        if (!item.fieldName || !item.url) {
            return;
        }
        const {fieldName, valueType, dimension, sourceName} = item;
        return knex('field')
            .where({
                'name': fieldName,
                'value_type': valueType,
                'dimension': dimension,
                'source_name': sourceName
            })
            .update({
                is_hyperlink: true,
                hyperlink_template: item.url + defaultLinkIdentity
            })
            .then((cnt) => {
                console.log(`=> add template: ${item.url} to field: ${item.fieldName}... ${cnt ? 'OK' : 'FAILED'}`);
            });
    });
};

exports.down = function() {
    throw new Error('Not implemented');
};