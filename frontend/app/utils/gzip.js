/**
 * gzip file
 * @param {string} file - File for gzip.
 */
export default function gzip(file) {
  const zip = new JSZip;
  const reader = new FileReader();
  var result = null;

  reader.onload = (function(e) {
      var blob = zip.generate({type:"blob"});
      var ch = new Uint8Array(e.target.result);
      zip.file('hello111.txt', ch);
      var content = zip.generate({type:"blob"});
      content.lastModifiedDate = new Date();
      content.name = file.name + '.gz'
      window.result = content
  });

  reader.readAsArrayBuffer(file)
}

