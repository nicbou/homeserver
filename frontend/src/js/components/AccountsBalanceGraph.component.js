const AccountsBalanceGraph = Vue.component('accounts-balance-graph', {
  props: ['accounts', 'target'],
  data: function() {
    return {
      endDate: moment(),
      daysToShow: 180,
      chart: null,
    }
  },
  computed: {
    sortedAccounts: function() {
      const accounts = this.accounts
        .sort((a, b) => {
          if (a.isCredit > b.isCredit) {
            return -1;
          }
          else if (a.isCredit < b.isCredit) {
            return 1;
          }
          else {
            if (a.displayName > b.displayName) {
              return -1;
            }
            else if (a.displayName === b.displayName) {
              return 0;
            }
            else {
              return 1;
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
        animation: {
          duration: 1000,
          startup: true,
        },
        areaOpacity: 0.8,
        axisTitlesPosition: 'none',
        chartArea: {
          width: '100%',
          height: 200,
          top: 0,
          bottom: 0,
        },
        colors: [
          '#000000',
          '#e67e22', //Orange
          '#2ecc71', //Green
          '#f1c40f', //Yellow
          '#3498db', //Blue                            
        ],
        focusTarget: 'category',
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