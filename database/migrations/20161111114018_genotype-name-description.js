const ChangeCaseUtil = require('../../utils/ChangeCaseUtil');
const Config = require('../../utils/Config');
const Promise = require('bluebird');

const SampleTables = {
    Genotypes: 'sample_genotype',
    Versions: 'genotype_version',
    Files: 'vcf_file_sample',
    GenotypeVersionText: 'genotype_text',
    EditableFields: 'vcf_file_sample_value'
};

const CommentFieldId = '00000000-0000-0000-0000-000000000017';

exports.up = function (knex) {
    return addGenotypeColumns(knex)
        .then(()=> updateGenotypeNameAndDescription(knex));
};

exports.down = function () {
    throw new Error('Not implemented');
};

function addGenotypeColumns(knex) {
    console.log('=> Add genotype name and description ...');
    return knex.schema
        .createTable(SampleTables.GenotypeVersionText, (table) => {
            table.uuid('genotype_version_id')
                .references('id')
                .inTable('genotype_version');
            table.string('langu_id', 2)
                .references('id')
                .inTable('langu');
            table.string('name', 50);
            table.text('description');

            table.primary(['genotype_version_id', 'langu_id']);
        });
}

function updateGenotypeNameAndDescription(knex) {
    return findGenotypeVersionsOldText(knex)
        .then((genotypeTexts) => Promise.mapSeries(genotypeTexts,
            (genotypeText) => addGenotypeVersionText(knex, genotypeText)
        ));
}

function findGenotypeVersionsOldText(knex) {
    return knex.select()
        .from(SampleTables.Versions)
        .leftJoin(SampleTables.Genotypes, `${SampleTables.Genotypes}.id`, `${SampleTables.Versions}.sample_genotype_id`)
        .leftJoin(SampleTables.Files, `${SampleTables.Files}.id`, `${SampleTables.Genotypes}.vcf_file_sample_id`)
        .leftJoin(SampleTables.EditableFields, `${SampleTables.EditableFields}.genotype_version_id`, `${SampleTables.Versions}.id`)
        .where('field_id', CommentFieldId)
        .map(result => {
            console.log(result);
            const name = createGenotypeName(result['file_name'], result['genotype_name']);
            return {
                genotypeVersionId: result['genotype_version_id'],
                name,
                description: result.values || ''
            };
        });
}

function createGenotypeName(fileName, genotype) {
    return genotype ? `${fileName}:${genotype}` : fileName;
}

function addGenotypeVersionText(knex, genotypeText) {
    console.log(genotypeText);
    const {genotypeVersionId, name, description} = genotypeText;
    return knex(SampleTables.GenotypeVersionText)
        .insert(ChangeCaseUtil.convertKeysToSnakeCase({
            genotypeVersionId,
            name,
            description,
            languId: Config.defaultLanguId
        }));
}