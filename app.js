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
            var data = d3.range(50000).map(function () {
                return [Math.random() * $scope.fieldWidth, Math.random() * $scope.fieldHeight];
            });

            var quadtree = d3.geom.quadtree()
                .extent([[-1, -1], [$scope.fieldWidth, $scope.fieldHeight]])
                (data);

            $scope.nodes = quadtree;
        };

        function showResults() {
            console.log(JSON.stringify($scope.nodes));
        };

    };
});
