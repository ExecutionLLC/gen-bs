const fs = require('fs');
const npm = require('npm');
const _ = require('lodash');

const migrationsFolder = './database/migrations';
const migrationTemplateFilePath = './database/defaults/update-fields-migration-template.js';

console.log(__dirname);

function getUpdateFieldsMigrations() {
    return _.filter(fs.readdirSync(migrationsFolder), (filename) => {
        return (filename.match(/^\d+_update-fields\.js$/) !== null);
    });
}

function addBlancMigrationFile(cb) {

    const ufMigrationsBefore = getUpdateFieldsMigrations();
    let res = null;

    npm.load({}, function (er) {
        if (er) {
            console.log(er);
        }
        npm.commands.run(['db:migrate:make', 'update-fields'], function (er, res) {
            if (er) {
                console.log(er);
            }
            if (res) { // command succeeded
                const ufMigrationsAfter = getUpdateFieldsMigrations();
                const newMigArr = _.difference(ufMigrationsAfter, ufMigrationsBefore);
                cb(newMigArr.length ? newMigArr[0] : null);
            }
        });
        /*npm.registry.log.on('log', function (message) {
         console.log(`logged message: ${JSON.stringify(message)}`);
         });*/
    });
    return res;
}

addBlancMigrationFile((migrationFileName) => {
    if (!migrationFileName) {
        return;
    }
    console.log(migrationFileName);
    const migrationFilePath = `${migrationsFolder}/${migrationFileName}`;

    // 1. create folder for migration files
    const migrationDataFolder = migrationFilePath.slice(0, -3);
    if (!fs.existsSync(migrationDataFolder)){
        fs.mkdirSync(migrationDataFolder);
    }

    // 2.
    fs.readFile(migrationTemplateFilePath, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        const migrationText = data.replace(/MIGRATION_DATA_FOLDER_PATH/g, migrationDataFolder);

        fs.writeFile(migrationFilePath, migrationText, 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });
});

/*fs.writeFile(`${testFolder}/${m}`, "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});*/

/*const exec = require('child_process').exec;
console.log(__dirname);
const child = exec('knex migrate:latest', //'knex migrate:make', 'my-test-migration',
    function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });*/
