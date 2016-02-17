/**
 * gzip file
 * @param {File} file - File for gzip.
 * @returns {Blob}
 */
export default function gzip(file) {
  const zip = new JSZip;
  const reader = new FileReader();

  const promise = new Promise((resolve, reject) => {
    reader.onload = (e => {
      var content = null;
      const ch = new Uint8Array(e.target.result);

      zip.file('hello111.txt', ch);
      content = zip.generate({type:"blob"});
      content.lastModifiedDate = new Date();
      content.name = file.name + '.gz';
      resolve(content)
    });
  })
  
  reader.readAsArrayBuffer(file);
  return(promise)
}

