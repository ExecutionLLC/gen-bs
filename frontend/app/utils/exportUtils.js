import CsvExporter from './export/csvExporter';
import TxtExporter from './export/txtExporter';

export default class ExportUtils {
    static createExporter(ofType) {
        switch (ofType) {
            case 'csv': {
                return new CsvExporter();
            }
            case 'txt': {
                return new TxtExporter();
            }
            default:
                return null;
        }
    }

    static downloadBlob(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style = 'display: none';
        document.body.appendChild(a);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}