const DashboardComponent = Vue.component('dashboard', {
  template: `
    <div>
      <div class="row">
        <div class='col-md-8'>
          <finances-panel></finances-panel>
          <habits-panel></habits-panel>
        </div>
        <div class='col-md-4 offset-8'>
          <div class="panel panel-default">
            <div class="panel-heading">
              <h3 class="panel-title">Securities</h3>
            </div>
            <div class="panel-body">
              <h4>DAX <small>last 5 days</small></h4>
              <div class="status">
                <div class="status-details">
                  <img class="stock-chart" src="https://kunden.commerzbank.de/marktdaten/wp-services/minichart.php?ID_NOTATION=24515072&amp;LANGUAGE=EN&amp;TIMESPAN=5D">
                </div>
              </div>
              <h4>S&amp;P 500 <small>last 5 days</small></h4>
              <div class="status">
                <div class="status-details">
                  <img class="stock-chart" src="https://kunden.commerzbank.de/marktdaten/wp-services/minichart.php?ID_NOTATION=35486964&amp;LANGUAGE=EN&amp;TIMESPAN=5D">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="tooltip"></div>
    </div>
  `
});