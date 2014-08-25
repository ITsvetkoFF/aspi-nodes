var app = angular.module("AspiNodesApp", []);
app.controller('SimulationController', function ($scope) {

  $scope.nodeQuantity = '5';
  $scope.fieldWidth = '1000';
  $scope.fieldHeight = '1000';
    $scope.fieldMinRange = '50';
    $scope.fieldMaxRange = '200';

    $scope.perform = function () {
        clearAndPopulate();
        showResults();

        function clearAndPopulate() {
            $scope.nodes = [];
            $scope.nodes = _.map(_.range($scope.nodeQuantity), function(num) {
                return {x:Math.random()*$scope.fieldWidth, y:Math.random()*$scope.fieldHeight};
            });
        };

        function showResults() {
            console.log(JSON.stringify($scope.nodes));
        };

    };
});
