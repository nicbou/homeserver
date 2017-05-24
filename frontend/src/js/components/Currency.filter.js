const currencyFilter = function(value) {
  return accounting.formatMoney(value, {
  	symbol: "€",
  	format: "%v %s",
  	precision: 0
  });
};

Vue.filter('currency', currencyFilter);