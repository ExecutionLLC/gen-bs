const oldColumnName = 'langu_id';
const newColumnName = 'language_id';

exports.up = function (knex) {
    console.log('=> Update language schema...');
    return editaLanguTable(knex);
};

exports.down = function () {
    throw new Error('Not implemented');
};

function editaLanguTable(knex) {
    return knex.schema
        .renameTable('langu', 'language')
        .table('comment_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('user', table => {
            table.renameColumn('default_langu_id', 'default_language_id');
        })
        .table('analysis_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('synonym_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('saved_file_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('model_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('view_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('field_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('filter_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        })
        .table('user_text', table => {
            table.renameColumn(oldColumnName, newColumnName);
        });
}
