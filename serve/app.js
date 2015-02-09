var app = angular.module("AspiNodesApp", []);
app.controller('SimulationController', function ($scope) {

    $scope.form = {};
    // Form defaults
    $scope.form.fieldWidth = '200';   //1800
    $scope.form.fieldHeight = '200';  //800
    $scope.form.fieldMaxRange = '50';//50
    $scope.form.showTheImage = true;
    $scope.form.fieldMinRange = '0'; //10
    $scope.form.nodeQuantity = '3'; //4000

    //DEFINE SIMULATION PARAMETERS
    var width, height, minR, maxR, nQ;

    $scope.datum = {};
    $scope.datum.oneRangeStepExperiments = 1;
    $scope.datum.pointData = [];

    var euclidDistance = function(ax, ay, bx, by) {
        return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
    };

    //start  sim with parameters variation
    $scope.startSim = function() {
        width = parseInt($scope.form.fieldWidth),
        height = parseInt($scope.form.fieldHeight),
        minR = parseInt($scope.form.fieldMinRange),
        maxR = parseInt($scope.form.fieldMaxRange),
        nQ = parseInt($scope.form.nodeQuantity);

        populateField();
        createQuadtree();
        //defineOneHopNeighbors();
        var iteration = 10;
        var svg = d3.select("body").append("svg")
            .attr("width", width)
            .attr("height", height);
        (function(){
            var i = 100;
            (function k(){
                drawNodes(svg);
                changePointData();
                createQuadtree();
                iteration--;
                if( --i ) {
                    setTimeout( k, 40 );
                }

            })();
        })();



    };

    // Only generates pointData: x,y,r,id,1hop(empty object)
    var populateField = function () {
        var pointData = d3.range(nQ).map(function (element,index) {
            return {"x": Math.random() * width,
                "y": Math.random() * height,
                "r": Math.random() * (maxR - minR) + minR,
                "id": index,
                "speed": Math.random() * 10,
                "direction": Math.random() * 2 * Math.PI,
                "HopOneNeighbors": []};
        });

        // Share data (or rewrite)
        $scope.datum.pointData = pointData;
    };

    var createQuadtree = function () {
        var qData = $scope.datum.pointData;
        var qtr = d3.geom.quadtree()
            .extent([[-1, -1], [parseInt($scope.form.fieldWidth) + 1, parseInt($scope.form.fieldHeight) + 1]])
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
        (qData);

        // Share data (or rewrite)
        $scope.datum.quadTree = qtr;
    };

    var drawNodes = function(svg) {
        var quadtree = $scope.datum.quadTree;

        svg.selectAll("*").remove();
        svg.selectAll(".node")
            .data(nodes(quadtree))
            .enter().append("rect")
            .attr("class", "node")
            .attr("x", function(d) { return d.x; })
            .attr("y", function(d) { return d.y; })
            .attr("width", function(d) { return d.width; })
            .attr("height", function(d) { return d.height; });

        var point = svg.selectAll(".point")
            .data(plain(quadtree))
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", 4);

        function nodes(quadtree) {
            var nodes = [];
            quadtree.visit(function(node, x1, y1, x2, y2) {
                nodes.push({x: x1, y: y1, width: x2 - x1, height: y2 - y1});
            });
            return nodes;
        }

        function plain(quadtree) {
            var data = [];
            quadtree.visit(function(node, x1, y1, x2, y2) {
                var p = node.point;
                if (p) {
                    data.push({x: node.x, y: node.y});
                }
            });
            return data;
        }
    };

    var changePointData = function() {
        var pointData = $scope.datum.pointData;
        pointData.forEach(function(element,index){
            var newX = element.x + element.speed*Math.cos(element.direction);
            if (newX>0 && newX<width) {
                element.x = newX;
            } else {
                element.direction = Math.PI - element.direction;
                element.x = element.x + element.speed*Math.cos(element.direction);
            }

            var newY = element.y - element.speed*Math.sin(element.direction);
            if (newY>0 && newY<height) {
                element.y = newY
            } else {
                element.direction = - element.direction;
                element.y = element.y - element.speed*Math.sin(element.direction);
            }
        });
        // Share data (or rewrite)
        $scope.datum.pointData = pointData;

    };


    var defineOneHopNeighbors = function() {
        qtree = $scope.datum.quadTree;
        qtree.forEach(function (d, i) {
            $scope.temp.that = d;
            QTsearch(quadtree, d.x - d.r, d.y - d.r, d.x + d.r, d.y + d.r);
        });
        function QTsearch(quadtree, x0, y0, x3, y3) {
            quadtree.visit(function (node, x1, y1, x2, y2) {
                var p = node.point;
                if (p) {
                    var xp = (x0+x3)/2;
                    var yp = (y0+y3)/2;
                    var rp = Math.abs(xp-x0);
                    var xn = p[0];
                    var yn = p[1];
                    var rn = p[2];
                    var distToDraw = euclidDistance(xp,yp,xn,yn);
                    if (Math.min(rn,rp)>distToDraw && distToDraw != 0) {
                        foundLinks++;
                    }
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0
            });
        };
    };

});
