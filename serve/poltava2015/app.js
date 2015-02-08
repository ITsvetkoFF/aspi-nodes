var app = angular.module("AspiNodesApp", []);
app.controller('SimulationController', function ($scope) {

    $scope.datum = {};
    $scope.temp = {};

    // Form defaults
    $scope.datum.nodeQuantity = '10'; //4000
    $scope.datum.fieldWidth = '500';   //1800
    $scope.datum.fieldHeight = '500';  //800
    $scope.datum.fieldMaxRange = '50';//50
    $scope.datum.fieldMinRange = '0'; //10
    $scope.datum.pointData = [];
    $scope.datum.populated = false;
    $scope.datum.drawEverything = true;
    $scope.datum.rangeStepNumber = 1;
    $scope.datum.oneRangeStepExperiments = 1;

    var euclidDistance = function(ax, ay, bx, by) {
        return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
    };

    var clearNeighborsInfo = function() {
        $scope.datum.pointData.forEach(function(element,index,array) {
            element.HopOneNeighbors = [];
        });
    };


    //start  sim with parameters variation
    $scope.startSim = function() {

        var initialNumOfNodes = 100;
        var step = 100;

        // [
        //      {"numOfNodes": .. ,"time": .. }
        //      {"numOfNodes": .. ,"time": .. }
        // ]
        var simDataWithQuadtree =[];
        var simDataWithoutQuadtree =[];

        var lessThanMinute = true;
        var numOfNodes = initialNumOfNodes;
        while (lessThanMinute) {
            var experimentResult = [];
            var start = new Date().getTime();

            populateField(parseInt($scope.datum.fieldMinRange), parseInt($scope.datum.fieldMaxRange),numOfNodes);

            var startExp1 = new Date().getTime();
            defineOneHopNeighbors(true); //withQuadtree
            experimentResult.time = new Date().getTime() - startExp1;
            experimentResult.numOfNodes = numOfNodes;
            simDataWithQuadtree.push(experimentResult);

            experimentResult = [];

            var startExp2 = new Date().getTime();
            defineOneHopNeighbors(false); //withoutQuadtree
            experimentResult.time = new Date().getTime() - startExp2;
            experimentResult.numOfNodes = numOfNodes;
            simDataWithoutQuadtree.push(experimentResult);

            numOfNodes+=step;
            var time = new Date().getTime() - start;
            if (time>500) {lessThanMinute = false;}

        }

        drawLineGraph(simDataWithQuadtree, simDataWithoutQuadtree);

    };

    // Only generates pointData: x,y,r,id,1hop(empty object)
    var populateField = function (minR, maxR, nQ) {
        var start = new Date().getTime();

        //DEFINE SIMULATION PARAMETERS
        var width = parseInt($scope.datum.fieldWidth),
            height = parseInt($scope.datum.fieldHeight);

        var pointData = d3.range(nQ).map(function (element,index) {
            return {"x":Math.random() * width,
                "y":Math.random() * height,
                "r":Math.random() * (maxR - minR) + minR,
                "id":index,
                "HopOneNeighbors":[]};
        });

        // Share data (or rewrite)
        $scope.datum.pointData = pointData;

        var time = new Date().getTime() - start;
    };

    var defineOneHopNeighbors = function(withQuadtreeFlag) {

        var qData = $scope.datum.pointData.map(function(one) {
            return [one.x,one.y,one.r,one.id];
        });



        if (withQuadtreeFlag == true) {
            // Create quadtree
            var foundLinks = 0;
            var quadtree = d3.geom.quadtree()
                .extent([[-1, -1], [parseInt($scope.datum.fieldWidth) + 1, parseInt($scope.datum.fieldHeight) + 1]])
            (qData);

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

            qData.forEach(function (d, i) {
                $scope.temp.that = d;
                QTsearch(quadtree, d[0] - d[2], d[1] - d[2], d[0] + d[2], d[1] + d[2]);
            });


            console.log(foundLinks);
        } else {
            var foundLinks = 0;
            var len = qData.length;
            var i;
            for (i=0;i<len-1;i++) {
                var node = qData[i];
                var j;
                for (j=i+1;j<len;j++) {
                    var candidate = qData[j];

                    var distToDraw = euclidDistance(node[0],node[1],candidate[0],candidate[1]);
                    if (Math.min(node[2],candidate[2])>distToDraw) {foundLinks++;}

                }
            }
            console.log(foundLinks);
        }
    }



    function drawLineGraph(data1,data2) {  //TODO - send titles for data
        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .x(function(d) { return x(d.numOfNodes); })
            .y(function(d) { return y(d.time); });

        var svg = d3.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            x.domain(d3.extent(data1, function(d) { return d.numOfNodes; }));
            y.domain([0, 400]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Час пошуку сусідів, мс");

            svg.append("path")
                .datum(data1)
                .attr("class", "lineWith")
                .attr("d", line);
            svg.append("path")
                .datum(data2)
                .attr("class", "lineWithout")
                .attr("d", line);


    };

});
