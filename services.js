angular.module('underscore', [])
    .factory('_', function () {
        return window._; // assumes underscore has already been loaded on the page
    });

angular.module('d3', [])
    .factory('d3Service', [
            function () {
                var d3;
                // insert d3 code here
                return d3;
  }];
