function onUpload() {
    var file = $('#file-select').prop('files')[0];
    var reader = new FileReader();
    reader.onload = (e) => {
        var data = e.target.result;
        var anotherFile = new Blob([data],/* file.name + '.gz', */{
            type: 'application/gzip',
            lastModified: new Date()
        });
        console.log('onload');
        ajaxUpload(anotherFile);
    };
    reader.readAsArrayBuffer(file);
}

function ajaxUpload(file) {
    var formData = new FormData();
    formData.append('file', file);
    $.ajax('/', {
        'type': 'POST',
        'data': formData,
        'contentType': false,
        'processData': false,
        'xhrFields': {
            // add listener to XMLHTTPRequest object directly for progress (jquery doesn't have this yet)
            'onprogress': function (progress) {
                // calculate upload progress
                var percentage = Math.floor((progress.total / progress.total) * 100);
                // log upload progress to console
                console.log('sendFile progress', progress, percentage);
                if (percentage === 100) {
                    console.log('sendFile DONE!');
                }
            }
        }
    }).done(function () {
        alert('Done!');
    }).fail(function (req, txt, err) {
        console.error(err);
        alert(err);
    });
}