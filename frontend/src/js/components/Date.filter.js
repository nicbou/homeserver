const dateFilter = function (date) {
  return moment(date).format('MMM. D, YYYY');
};

Vue.filter('date', dateFilter);