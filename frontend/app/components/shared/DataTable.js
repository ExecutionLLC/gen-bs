
import 'datatables.net-bs';
//import 'datatables.net-bs/css/dataTables.bootstrap.css';
import 'datatables.net-responsive';
//import 'datatables.net-responsive-bs/css/responsive.bootstrap.css';
import 'datatables.net-scroller';
//import 'datatables.net-scroller-bs/css/scroller.bootstrap.css';

export default class DTable {
  constructor(domNode, dtConfig) {
    this.node = domNode;
    this.config = dtConfig;
    this.table = domNode.DataTable( dtConfig );
  }
}
