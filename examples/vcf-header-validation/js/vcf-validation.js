var started, finished;

function Init(title) {
    $('#meta').html('');
    $('#output').html('');

    if ( $('#file-select')[0].files.length == 0 || $('#file-select')[0].files[0] == null) {
        $('#meta').html('Please, choose file!');
        return null;
    }

    var file = $('#file-select')[0].files[0];

    $('#meta').append(title + '<br>');
    $('#meta').append($('#file-select')[0].files[0].name + ' ' + ( Math.round((file.size / 1024 / 1024) * 100) / 100 ) + ' MB<br>');

    started = new Date();
    finished = null;

    return file;
}

function Finish(metaInfo, results) {
    $('#meta').append('Time spent: ' + (finished - started) + 'ms.' + (metaInfo ? '<br>' + metaInfo : ''));
    $('#output').html(results ? results : 'NO RESULTS');
}

function Read() {
    var file = Init('Read all lines');
    if (!file) return;

    var navigator = new FileNavigator(file);
    var indexToStartWith = 0;
    var countLines = 0;

    navigator.readSomeLines(indexToStartWith, function linesReadHandler(err, index, lines, eof, progress) {
        if (err) {
            finished = new Date();
            Finish('Error: ' + err);
            return;
        }

        countLines += lines.length;

        if (eof)  {
            finished = new Date();
            Finish('Total ' + countLines + ' lines readed');
            return;
        }

        navigator.readSomeLines(index + lines.length, linesReadHandler);
    });
}
$('#read').click(Read);

var nextIndex = 0;

function FindNext() {
    var pattern = $('#find-first-pattern').val();

    var file = Init('Find of "' + pattern + '" pattern starting from ' + nextIndex);
    if (!file) return;

    var navigator = new FileNavigator(file);

    navigator.find(new RegExp(pattern), nextIndex, function (err, index, match) {
        finished = new Date();
        nextIndex = index + 1; // search next after this one

        if (err) {
            Finish('Error: ' + err);
            return;
        }
        if (!match) {
            Finish('No matching lines found');
            return;
        }

        var token = match.line.substr(match.offset, match.length);

        Finish('Found matching token on ' + index + ' line', index + ': ' + match.line.replace(token, '<mark>' + token + '</mark>'));
    });
}

$('#search-beginning').click(function() {
    nextIndex = 0;
    FindNext();
});

function ValidateVCF() {
    var pattern = "";
    var requiredHeaderColumns = [
        "CHROM",
        "POS",
        "ID",
        "REF",
        "ALT",
        "QUAL",
        "FILTER",
        "INFO"
    ];

    var file = Init("Verifying VCF file format");
    if (!file) return;

    var navigator = new FileNavigator(file);
    var line;

    function verifyVcfLine() {
        navigator.find(new RegExp(pattern), nextIndex, function (err, index, match) {
            nextIndex = index + 1; // search next after this one

            if (err) {
                finished = new Date();
                Finish('Error: ' + err);
                return;
            }

            line = match.line;
            if (line.substr(0, 2) !== "##") {
                finished = new Date();

                if (line[0] !== "#") {
                    Finish('VCF file has an INVALID META tag: ' + line);
                } else {
                    var headerIsValid = true;
                    requiredHeaderColumns.forEach(function(column, index, columns) {
                        headerIsValid = headerIsValid & (line.indexOf(column) > 0);
                    });
                    if (headerIsValid) {
                        Finish('VCF file is VALID.');
                    } else {
                        Finish('VCF file has an INVALID header: ' + line);
                    }
                }
            } else {
                verifyVcfLine();
            }
        });
    }

    verifyVcfLine();
}

$('#search-next').click(function() {
    FindNext();
});

$('#validate').click(function() {
    nextIndex = 0;
    ValidateVCF();
});

function FindAll() {
    var pattern = $('#find-all-pattern').val();

    var file = Init('Find all lines matching "' + pattern + '" pattern');
    if (!file) return;

    var navigator = new FileNavigator(file);

    var indexToStartWith = 0;
    var limitOfMatches = 100;

    navigator.findAll(new RegExp(pattern), indexToStartWith, limitOfMatches, function (err, index, limitHit, results) {
        finished = new Date();

        if (err) {
            Finish('Error: ' + err);
            return;
        }
        if (results.length == 0) {
            Finish('No matching lines found');
            return;
        }

        var resultsAsLine = '';
        for (var i = 0; i < results.length; i++) {
            var token = results[i].line.substr(results[i].offset, results[i].length);
            resultsAsLine += results[i].index + ': ' + results[i].line.replace(token, '<mark>' + token + '</mark>') + '<br>';
        }

        Finish('Found ' + results.length + ' lines, matching pattern.' + (limitHit ? ' Limit of ' + limitOfMatches + ' is hit, so there can be more lines.' : ''), resultsAsLine);
    });
}
$('#searchAll').click(FindAll);