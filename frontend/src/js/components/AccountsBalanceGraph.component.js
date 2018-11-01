const AccountsBalanceGraph = Vue.component('accounts-balance-graph', {
  props: ['accounts', 'target', 'selectedAccount'],
  data: function() {
    return {
      endDate: moment(),
      daysToShow: 180,
      chart: null,
    }
  },
  computed: {
    sortedAccounts: function() {
      if (this.selectedAccount) {
        return [this.selectedAccount];
      }

      const accounts = this.accounts
        .sort((a, b) => {
          if (a.isCredit > b.isCredit) {
            return -1;
          }
          else if (a.isCredit < b.isCredit) {
            return 1;
          }
          else {
            if (a.isActive > b.isActive) {
              return 1
            }
            else if (a.isActive < b.isActive) {
              return -1
            }
            else {
              if (a.balance > b.balance) {
                return 1;
              }
              else if (a.balance === b.balance) {
                return 0;
              }
              else {
                return -1;
              }
            }
          }
        });
      return accounts;
    },
    chartData: function() {
      // Column definitions row
      const dateColumn = {'type': 'date', 'label': 'Date'};
      const balancesColumn = this.sortedAccounts.map((account) => {
        return {
          'type': 'number',
          'label': account.displayName,
        }
      });
      const savingsGoalColumn = {
        'type': 'number',
        'label': 'Savings target'
      };
      const columnDefinitions = [dateColumn, ...balancesColumn, savingsGoalColumn];

      // Data rows
      const date = moment().endOf('day');
      const balanceRows = [];
      for (let i = 0; i < this.daysToShow; i++) {
        const currentRow = [];
        const currentRowDate = date.clone().subtract(i, 'days');
        const balances = this.sortedAccounts.map((account) => {
          return account.balanceForDate(currentRowDate);
        });
        const savingsTarget = this.target.targetForDate(currentRowDate);
        balanceRows.push([currentRowDate.toDate(), ...balances, savingsTarget]);
      }

      return google.visualization.arrayToDataTable([columnDefinitions, ...balanceRows]);
    },
    chartOptions: function() {
      const savingsTargetColumnIndex = this.chartData.getNumberOfColumns() - 2;

      const options = {
        areaOpacity: 0.8,
        axisTitlesPosition: 'none',
        chartArea: {
          width: '100%',
          height: 200,
          top: 0,
          bottom: 0,
        },
        colors: [
          '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000'
        ],
        hAxis: {
          title: 'Date',
          titleTextStyle: {color: '#333'},
          format: 'MMM d',
          gridlines: {
           count: 3,
          },
        },
        isStacked: true,
        legend: {
          position: 'none'
        },
        lineWidth:1,
        seriesType: "area",
        series: {},
        vAxis: {
          format:'# €',
          gridlines: {
            color: '#fff',
          },
          minValue: 0,
          textPosition: 'none',
          viewWindowMode: 'maximized',
        },
      };

      options.series[savingsTargetColumnIndex] = {  // Savings target line
        color: '#000',
        type: "line",
        lineDashStyle: [1, 1],
        lineWidth: 1,
      }

      return options;
    }
  },
  methods: {
    updateChart(force=false) {
      if (this.chart && this.accounts.length > 0) {
        this.chart.draw(this.chartData, this.chartOptions);
      }
    },
    dateSelected() {
      const selection = this.chart.getSelection()[0];
      if (selection) {
        const selectedDate = this.chartData.getValue(selection.row, 0);
        this.$emit('date-selected', moment(selectedDate));
      } else {
        this.$emit('date-selected', moment());
      } 
    },
    drawChart() {
      this.chart = new google.visualization.AreaChart(this.$el);

      google.visualization.events.addListener(this.chart, 'select', () => {
        this.dateSelected();
      });
    }
  },
  mounted: function() {
    if (google.visualization) {
      this.drawChart();
    } else {
      google.load('visualization', '1.0', {
        packages:['corechart'],
        callback: this.drawChart
      });
    }

    this.$nextTick(function() {
      window.addEventListener('resize', () => { this.updateChart(true); });
    });
  },
  watch: {
    sortedAccounts: function() {
      this.updateChart();
    },
    chart: function() {
      this.updateChart();
    }
  },
  template: `<div class="chart"></div>`
});