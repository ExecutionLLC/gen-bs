import CsvExporter from './export/csvExporter';
import TxtExporter from './export/txtExporter';
import SqlExporter from './export/sqlExporter';

export default class ExportUtils {
    static createExporter(ofType) {
        switch (ofType) {
            case 'csv': {
                return new CsvExporter();
            }
            case 'txt': {
                return new TxtExporter();
            }
            case 'sql': {
                return new SqlExporter();
            }
            default:
                return null;
        }
    }

    static downloadBlob(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);
    }
}