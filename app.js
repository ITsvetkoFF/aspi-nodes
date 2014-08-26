var app = angular.module("AspiNodesApp", []);
app.controller('SimulationController', function ($scope) {

    $scope.nodeQuantity = '10000';
    $scope.fieldWidth = '1000';
    $scope.fieldHeight = '1000';
    $scope.fieldMinRange = '50';
    $scope.fieldMaxRange = '200';

    $scope.perform = function () {
        clearAndPopulate();
        findOneHopNeighbors();

        function clearAndPopulate() {
            var start = new Date().getTime();
            var data = d3.range($scope.nodeQuantity).map(function () {
                return [Math.random() * $scope.fieldWidth, Math.random() * $scope.fieldHeight];
            });

            var quadtree = d3.geom.quadtree()
                .extent([[-1, -1], [$scope.fieldWidth + 1, $scope.fieldHeight + 1]])
                (data);

            //Remember data to perform next step and quadtree to operate this step
            $scope.quadtree = quadtree;
            $scope.positions = data;

            var time = new Date().getTime() - start;
            console.log("Population is finished in " + time + "ms");
        };

        function findOneHopNeighbors() {
            // calculate euclidean distance of two points with coordinates: a(ax, ay) and b(bx, by)
            function euclidDistance(ax, ay, bx, by) {
                return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
            };
            // Find the nodes within the specified rectangle.
            function search(quadtree, x0, y0, x3, y3) {
                quadtree.visit(function (node, x1, y1, x2, y2) {
                    var p = node.point;
                    if (p) {
                        p.scanned = true;
                        p.selected = (p[0] >= x0) && (p[0] < x3) && (p[1] >= y0) && (p[1] < y3);
                    }
                    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
                });
            };

            search($scope.quadtree,0,$scope.fieldWidth/2,0,$scope.fieldHeight/2);
        };

    };
});
