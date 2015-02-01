var app = angular.module("AspiNodesApp", []);
app.controller('SimulationController', function ($scope) {

    $scope.datum = {};
    $scope.temp = {};

    // Form defaults
    $scope.datum.nodeQuantity = '1000'; //4000
    $scope.datum.fieldWidth = '500';   //1800
    $scope.datum.fieldHeight = '500';  //800
    $scope.datum.fieldMaxRange = '30';//50
    $scope.datum.fieldMinRange = '30'; //10
    $scope.datum.pointData = [];
    $scope.datum.populated = false;
    $scope.datum.drawEverything = true;
    $scope.datum.rangeStepNumber = 1;
    $scope.datum.oneRangeStepExperiments = 2;

    var euclidDistance = function(ax, ay, bx, by) {
        return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
    };
    var calculateLinks = function(svg) {
        var linkGroup = svg.selectAll("#linkGroup");
        return linkGroup.selectAll(".link")[0].length;
    };
    var calculateDegree = function(svg) {
        var linkGroup = svg.selectAll("#linkGroup");
        var sum = linkGroup.selectAll(".link")[0].length;

        return sum/$scope.datum.nodeQuantity; //WE DO NOT NEED MULTIPLICATION BECAUSE OF DRAWING LINKS TWICE
    };

    var defineNumberOfDisconnectedNodes = function() {
        var defined = false;
        var MAIN_GROUP_CAPACITY = 0.8; // main group should contain at least...
        var candidatesQuantity = $scope.datum.pointData.length;
        var tryN = 0;
        var message;
        while (!defined) {
            tryN++;
            var tempMainGroup = [];
            var searchStack = [];
            var candidateIndex = Math.floor(Math.random() * candidatesQuantity);
            var candidate = $scope.datum.pointData[candidateIndex];
            searchStack.push(candidate.id);
            while (searchStack.length > 0) {
                var candidateId = searchStack.pop();
                tempMainGroup.push(candidateId);
                var arr = $scope.datum.pointData[candidateId].HopOneNeighbors;
                if (arr.length>0) {
                    arr.forEach(function(element, index, array) {
                        if (tempMainGroup.indexOf(element) == -1 && searchStack.indexOf(element) == -1) {
                            searchStack.push(element);
                        }
                    });
                }
            };
            if (tempMainGroup.length>MAIN_GROUP_CAPACITY*$scope.datum.nodeQuantity) {message = "Connected: "+tempMainGroup.length; defined = true;}
            if (tryN == Math.ceil($scope.datum.nodeQuantity)) {message = "No group found!"; break;}
        };
        return message;
    };
    var clearNeighborsInfo = function() {
        $scope.datum.pointData.forEach(function(element,index,array) {
            element.HopOneNeighbors = [];
        });
    };
    var universalDrawLinks = function(experimentElement, algorithm) {
        //DEFINE SIMULATION PARAMETERS
        var width = parseInt($scope.datum.fieldWidth),
            height = parseInt($scope.datum.fieldHeight);

        var minR = parseInt($scope.datum.fieldMinRange),
            maxR = parseInt($scope.datum.fieldMaxRange);

        var nQ = parseInt($scope.datum.nodeQuantity);

        var svg = experimentElement.append("svg");
        var linkGroup = svg.append('g').attr("id","linkGroup");

        svg.attr("width", width)
            .attr("height", height);

        var point = svg.selectAll(".point")
            .data($scope.datum.pointData)
            .enter().append("circle")
            .attr("class", "point")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", function(d) { return d.r; });
        clearNeighborsInfo();
        //passing pointData for quadtree
        var qData = $scope.datum.pointData.map(function(one) {
            return [one.x,one.y,one.r,one.id];
        });

        // Create quadtree
        var quadtree = d3.geom.quadtree()
            .extent([[-1, -1], [$scope.datum.fieldWidth + 1, $scope.datum.fieldHeight + 1]])
        (qData);

        // Collapse the quadtree into an array of rectangles
        function nodes(quadtree) {
            var nodes = [];
            quadtree.visit(function(node, x1, y1, x2, y2) {
                nodes.push({x: x1, y: y1, width: x2 - x1, height: y2 - y1});
            });
            return nodes;
        }

        if ($scope.datum.drawEverything) {

            var linkGroup = svg.selectAll("#linkGroup");
            linkGroup.html('');
            // Draw rectangles
            //linkGroup.selectAll(".node")
            //    .data(nodes(quadtree))
            //    .enter().append("rect")
            //    .attr("class", "node")
            //    .attr("x", function (d) {
            //        return d.x;
            //    })
            //    .attr("y", function (d) {
            //        return d.y;
            //    })
            //    .attr("width", function (d) {
            //        return d.width;
            //    })
            //    .attr("height", function (d) {
            //        return d.height;
            //    });
        }



        //////////////////////////////////////////////////////////////////////////////
        ///////////////////////HERE IS THE ALGORITHM//////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        var search = algorithm(linkGroup);

        var point = svg.selectAll(".point");
        point.each(function(d,i) {

            // helper

            //console.log(d + " " + i + " this:" + this);
            // 448.97178455721587,48.42824942898005 9 this:[object SVGCircleElement]
            $scope.temp.that = d;
            search(quadtree, d.x-d.r, d.y-d.r, d.x+d.r, d.y+d.r);

        });



        var linksMessage = calculateLinks(svg);
        var degreeMessage = calculateDegree(svg);
        var connectionMessage = defineNumberOfDisconnectedNodes();

        var resultThis = experimentElement.append("div");
        resultThis.text("Links: " + linksMessage + " | Degree: " + degreeMessage + "| " + connectionMessage);
    };

    //start  sim with parameters variation
    $scope.startSim = function() {
        var nOfExp = parseInt($scope.datum.oneRangeStepExperiments);
        var simParameters = generateParameters();
        simParameters.forEach(function(parameterSet,index,arr){
            var i;
            for(i = 0; i<nOfExp; i++){
                $scope.populate(parameterSet.minR, parameterSet.maxR);
            }
        });
    };

    var generateParameters = function() {
        var arrayOfParameters = [];

        var minR = parseInt($scope.datum.fieldMinRange),
            maxR = parseInt($scope.datum.fieldMaxRange),
            steps = parseInt($scope.datum.rangeStepNumber);

        if (steps == 1) {arrayOfParameters.push({minR: minR, maxR:maxR});}
        else if (steps > 1) {
            var averageR = (maxR+minR)/2;
            var delta = (maxR-minR)/2;
            var i;
            for(i = 0; i<steps; i++){
                arrayOfParameters.push({minR: averageR-(delta*i/steps), maxR:maxR+(delta*i/steps)});
            }
        }


        return arrayOfParameters;
    };

    // Only generates pointData: x,y,r,id,1hop(empty object)
    $scope.populate = function (minR, maxR) {
        var start = new Date().getTime();

        var oneExperiment = d3.select("body").append("div").attr("class", "oneExperiment");
        var ex1 = oneExperiment.append("div").attr("class","noPlanarization Planarization");
        var ex2 = oneExperiment.append("div").attr("class","RNGPlanarization Planarization");
        var ex3 = oneExperiment.append("div").attr("class","GGPlanarization Planarization");
        oneExperiment.append("div").attr("style","clear:both");

        //DEFINE SIMULATION PARAMETERS TODO - define them here and pass to universalDrawer somehow
        var width = parseInt($scope.datum.fieldWidth),
            height = parseInt($scope.datum.fieldHeight);


        var nQ = parseInt($scope.datum.nodeQuantity);

        var pointData = d3.range(nQ).map(function (element,index) {
            return {"x":Math.random() * width,
                "y":Math.random() * height,
                "r":Math.random() * (maxR - minR) + minR,
                "id":index,
                "HopOneNeighbors":[]};
        });

        // Share data
        $scope.datum.pointData = pointData;

        ///DRAW THREE types here
        [ex1,ex2,ex3].forEach(function(experimentElement, index) {
                if (index==0) {performNothing(experimentElement);}
                if (index==1) {performRNGPlanarization(experimentElement);}
                if (index==2) {performGGPlanarization(experimentElement);}
            }
        );

        var time = new Date().getTime() - start;
        console.log("Population is finished in " + time + "ms");
    };

    $scope.hideNeighbors = function () {
        linkGroup.html('');
    };

    // This is not a simulation - just display links!
    var performNothing = function (svgHolder) {
        var noPlanarizatioin = function(linkGroup) {

            function search(quadtree, x0, y0, x3, y3) {
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
                            if ($scope.datum.drawEverything) {
                                linkGroup.append("line")
                                    .attr("x1", p[0])
                                    .attr("y1", p[1])
                                    .attr("x2", xp)
                                    .attr("y2", yp)
                                    .attr("class","link");
                            }
                            $scope.temp.that.HopOneNeighbors.push(p[3]);
                        }
                    }
                    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0
                });
            };
            return search;
        };

        universalDrawLinks(svgHolder, noPlanarizatioin);


    };

    var performRNGPlanarization = function(svgHolder) {

        var RNGPlanarization = function(linkGroup) {
            function search(quadtree, x0, y0, x3, y3) {
                quadtree.visit(function (node, x1, y1, x2, y2) {
                    var p = node.point;
                    if (p) {
                        var xp = (x0+x3)/2;
                        var yp = (y0+y3)/2;
                        var rp = Math.abs(xp-x0);
                        var xn = p[0];
                        var yn = p[1];
                        var rn = p[2];

                        var dis = euclidDistance(xp,yp,xn,yn);

                        // Draw links if both see each other
                        var flag = false;
                        if (Math.min(rn,rp)>dis && dis>0) {
                            flag = true;
                            // Center of possible search zone
                            var iXc = (xp + xn) / 2;
                            var iYc = (yp + yn) / 2;

                            quadtree.visit(function (midNode, x1, y1, x2, y2) {
                                var pInner = midNode.point;
                                if (pInner) {

                                    var xInner = pInner[0];
                                    var yInner = pInner[1];
                                    var d1 = euclidDistance(xInner, yInner, xn, yn);
                                    var d2 = euclidDistance(xInner, yInner, xp, yp);

                                    if (d1 > 0 && d2 > 0) {
                                        // If it is in zone
                                        if (dis > Math.max(d1, d2)) {
                                            flag = false;
                                        }
                                    }
                                }
                                // Condition to move only around possible figure
                                return x1 >= iXc + dis || y1 >= iYc + dis || x2 < iXc - dis || y2 < iYc - dis
                            });
                        }
                        if (flag === true) {
                            if ($scope.datum.drawEverything) {
                                linkGroup.append("line")
                                    .attr("x1", xn)
                                    .attr("y1", yn)
                                    .attr("x2", xp)
                                    .attr("y2", yp)
                                    .attr("class", "link");
                            }
                            $scope.temp.that.HopOneNeighbors.push(p[3]);
                        }
                    }
                    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0
                });
            };

            return search;
        };

        universalDrawLinks(svgHolder,RNGPlanarization);
    };

    var performGGPlanarization = function(svgHolder) {

        var GGPlanarization = function(linkGroup) {
            function search(quadtree, x0, y0, x3, y3) {
                quadtree.visit(function (node, x1, y1, x2, y2) {
                    var p = node.point;
                    if (p) {
                        var xp = (x0+x3)/2;
                        var yp = (y0+y3)/2;
                        var rp = Math.abs(xp-x0);
                        var xn = p[0];
                        var yn = p[1];
                        var rn = p[2];

                        var dis = euclidDistance(xp,yp,xn,yn);

                        // Draw links if both see each other
                        var flag = false;
                        if (Math.min(rn,rp)>dis && dis>0) {
                            flag = true;
                            // Center of possible search zone
                            var iXc = (xp + xn) / 2;
                            var iYc = (yp + yn) / 2;

                            quadtree.visit(function (midNode, x1, y1, x2, y2) {
                                var pInner = midNode.point;
                                if (pInner) {

                                    var xInner = pInner[0];
                                    var yInner = pInner[1];
                                    var dm = euclidDistance(xInner, yInner, iXc, iYc);

                                    if (dm > 0) {
                                        // If it is in zone
                                        if (dis/2 > dm) {
                                            flag = false;
                                        }
                                    }
                                }
                                // Condition to move only around possible figure
                                return x1 >= iXc + dis || y1 >= iYc + dis || x2 < iXc - dis || y2 < iYc - dis
                            });
                        }
                        if (flag === true) {
                            if ($scope.datum.drawEverything) {
                                linkGroup.append("line")
                                    .attr("x1", xn)
                                    .attr("y1", yn)
                                    .attr("x2", xp)
                                    .attr("y2", yp)
                                    .attr("class", "link");
                            }
                            $scope.temp.that.HopOneNeighbors.push(p[3]);
                        };
                    }
                    return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0
                });
            };

            return search;
        };

        universalDrawLinks(svgHolder,GGPlanarization);
    };



    var oneStep = function () {
        var point = svg.selectAll(".point");
        // для каждого узла происходит переход состояний
        //
        point.each(function(d,i) {

            // helper

            // console.log(d + " " + i + " this:" + this);
            // 448.97178455721587,48.42824942898005 9 this:[object SVGCircleElement]

            //search(quadtree, d.x-d.r, d.y-d.r, d.x+d.r, d.y+d.r);

        });
    };


});
