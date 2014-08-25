var app = angular.module("AspiNodesApp", []);
app.controller('SimulationController', function ($scope) {

    $scope.nodeQuantity = '10000';
    $scope.fieldWidth = '1000';
    $scope.fieldHeight = '1000';
    $scope.fieldMinRange = '50';
    $scope.fieldMaxRange = '200';

    $scope.perform = function () {
        clearAndPopulate();
        showResults();

        function clearAndPopulate() {
            var start = new Date().getTime();
            var data = d3.range($scope.nodeQuantity).map(function () {
                return [Math.random() * $scope.fieldWidth, Math.random() * $scope.fieldHeight];
            });

            var quadtree = d3.geom.quadtree()
                .extent([[-1, -1], [$scope.fieldWidth+1, $scope.fieldHeight+1]])
                (data);

            $scope.nodes = quadtree;

            var time = new Date().getTime() - start;
            console.log("Population is finished in "+time+"ms");
        };

        function showResults() {

        };

    };
});
