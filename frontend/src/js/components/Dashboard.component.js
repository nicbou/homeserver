const DashboardComponent = Vue.component('dashboard', {
  template: `
    <div id="dashboard">
      <div class="row">
        <div class='col-md-12'>
          <finances-panel></finances-panel>
          <habits-panel></habits-panel>
        </div>
      </div>
      <div id="tooltip"></div>
    </div>
  `
});