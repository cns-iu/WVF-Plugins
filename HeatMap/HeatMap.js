visualizationFunctions.HeatMap = function(element, data, opts) {
    var context = this;
    this.config = this.CreateBaseConfig();
    this.meta = this.config.meta;
    this.SVG = this.config.easySVG(element[0], { noG: true })
        .attr("overflow", "scroll")
        .attr("background", "white")
        .attr("class", "canvas " + opts.ngIdentifier)
        .append("g")
        .attr("transform", "translate(" + (this.config.margins.left) + "," + (this.config.margins.top) + ")");
    this.VisFunc = function() {
        Utilities.runJSONFuncs(context.config.meta, [data, context.config]);
        var barScaleValues = [];
        var scaleValues = [];
        var gridOffsetX = [175, 150];
        var gridOffsetY = [75, 150];
        var barOffset = 25;

        context.SVG.displayBars = true;
        context.SVG.displayLabels = true;
        if (context.config.meta.styleEncoding) {
            if (context.config.meta.styleEncoding.offset) {
                gridOffsetX[0] = context.config.meta.styleEncoding.offset[0];
                gridOffsetY[0] = context.config.meta.styleEncoding.offset[1];
            }
        }
        if (context.config.meta.labels) {
            if (context.config.meta.labels.display) {
                gridOffsetX[0] += 50;
                gridOffsetY[0] += 50;
            } else {
                context.SVG.displayLabels = false;
            }
        }

        if (context.config.meta.aggregateBars) {
            if (context.config.meta.aggregateBars.display == false) {
                context.SVG.displayBars = false;
            }
        }

        if (!context.SVG.displayBars) {
            gridOffsetX[1] = 0;
            gridOffsetY[1] = 0;
        }

        formatData();
        createScales();
        context.SVG.cellWidth = context.Scales.gridAreaX(1) - context.Scales.gridAreaX(0) - 2;
        context.SVG.cellHeight = context.Scales.gridAreaY(1) - context.Scales.gridAreaY(0) - 2;
        createCells();
        createAxes();
        var barData;

        if (context.SVG.displayBars) {
            appendMarkers();
        }

        //TODO: Separate bars from labels
        barData = formatBarData();
        createBars(barData);
        if (!context.SVG.displayBars) {
            context.SVG.selectAll(".bar").remove();
        }
        createBarAxes();

        function createCells() {
            var columns = context.SVG.selectAll(".coll")
                .append("g")
                .data(context.filteredData.records.data)
                .enter()
                .append("g")
                .attr("class", function(d, i) {
                    return "col col-" + i
                }).each(function(d, i) {
                    var elem = d3.select(this);
                    elem.append("g").selectAll(".roww")
                        .append("g")
                        .data(d[context.config.meta.records.rowAggregator])
                        .enter()
                        .append("g")
                        .attr("class", function(d1, i1) {
                            return "row row-" + i1
                        })
                })

            context.filteredData.records.data.forEach(function(d, i) {
                d[context.config.meta.records.rowAggregator].forEach(function(d1, i1) {
                    context.SVG.selectAll(".col-" + i).selectAll(".row-" + i1).append("g")
                        .attr("class", "cell cell-" + i + "-" + i1)
                        .property("column", i)
                        .property("row", i1)
                        .attr("transform", "translate(" + context.Scales.gridAreaX(i) + "," + context.Scales.gridAreaY(i1) + ")")
                })
            })

            context.SVG.selectAll(".cell")
                .append("rect")
                .attr("width", context.SVG.cellWidth)
                .attr("height", context.SVG.cellHeight)
            context.SVG.selectAll(".cell")
                .append("text")
                .attr("class", "l2")
                .attr("x", context.SVG.cellWidth / 2)
                .attr("y", context.SVG.cellHeight / 2 + 5)
                .attr("text-anchor", "middle")

            context.rowLabels = []
            context.SVG.selectAll(".row").each(function() {
                var key = d3.select(this).data()[0].key;
                if (context.rowLabels.indexOf(key) == -1) {
                    context.rowLabels.push(key)
                }
            })
        }

        function createBars(barData) {
            context.SVG.rowBarArea = context.SVG.append("g")
                .attr("transform", "translate(" + (context.Scales.gridAreaX.range()[1] + barOffset) + ",0)")
            context.SVG.colBarArea = context.SVG.append("g")
                .attr("transform", "translate(0," + (context.Scales.gridAreaY.range()[1] + barOffset) + ")")
            context.SVG.rowBars = createRowAggBars(barData.row);
            context.SVG.colBars = createColAggBars(barData.col);
        }

        function createAxes() {
            context.Scales.yAxis = d3.svg.axis()
                .scale(d3.scale.linear()
                    .domain([0, 1])
                    .range([0, 100]))
                .ticks(2)
                .tickFormat(d3.format("s"))
                .tickSize(d3.max(context.Scales.gridAreaY.range()) - d3.min(context.Scales.gridAreaY.range()))
                .orient("top")
                .outerTickSize(0);


            context.Scales.xAxis = d3.svg.axis()
                .scale(d3.scale.linear()
                    .domain([0, 1])
                    .range([0, 100]))
                .ticks(2)
                .tickFormat(d3.format("s"))
                .tickSize(d3.max(context.Scales.gridAreaX.range()) - d3.min(context.Scales.gridAreaX.range()))
                .orient("left")
                .outerTickSize(0);
        }

        function createBarAxes() {
            context.SVG.xAxisg = context.SVG.colBarArea.append("g")
            context.SVG.xAxis = context.SVG.colBarArea.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(" + (d3.max(context.Scales.gridAreaX.range())) + ",0)")
                // .call(context.Scales.xAxis);
            context.SVG.yAxis = context.SVG.rowBarArea.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(0," + (context.Scales.gridAreaY(d3.max(context.Scales.gridAreaY.domain()))) + ")")
                // .call(context.Scales.yAxis);
        }

        function createScales() {
            context.Scales.gridAreaX = d3.scale.linear()
                .domain([0, context.filteredData.records.data.length])
                .range([gridOffsetX[0], context.config.dims.fixedWidth - context.config.margins.left - gridOffsetX[1]])
            context.Scales.gridAreaY = d3.scale.linear()
                .domain([0, d3.max(context.filteredData.records.data, function(d) {
                    return d[context.config.meta.records.rowAggregator].length
                })])
                .range([gridOffsetY[0], context.config.dims.fixedHeight - context.config.margins.top - gridOffsetY[1]])
        }

        function createRowAggBars(barData) {
            return context.SVG.rowBarArea.selectAll(".bars")
                .append("g")
                .data(barData)
                .enter()
                .append("g")
                .attr("class", function(d, i) {
                    return "bar row-bar row-bar-" + i
                })
                .attr("transform", function(d, i) {
                    return "translate(0," + context.Scales.gridAreaY(i) + ")"
                })
                .each(function(d, i) {
                    var label = context.SVG.append("g")
                        .attr("class", "l yaxis yaxis-" + i)
                        .attr("transform", "translate(" + (context.Scales.gridAreaX.range()[0] - 5) + "," + (context.Scales.gridAreaY(i) + context.SVG.cellHeight / 2 + 5) + ")")
                    label.append("text")
                        .attr("class", "l2")
                        .attr("text-anchor", "end")
                        .text(context.rowLabels[i].trim())
                    var bar = d3.select(this);
                    bar.append("rect")
                        .attr("width", 10)
                        .attr("height", context.SVG.cellHeight)
                        .attr("fill", "lightgrey")
                    bar.append("text")
                        .attr("class", "l2")
                        .attr("x", 7)
                        .attr("y", context.SVG.cellHeight / 2 + 5)
                        .attr("text-anchor", "start")
                })
        }

        function createColAggBars(barData) {
            return context.SVG.colBarArea.selectAll(".bars")
                .append("g")
                .data(barData)
                .enter()
                .append("g")
                .attr("class", function(d, i) {
                    return "bar col-bar col-bar-" + i
                })
                .attr("transform", function(d, i) {
                    return "translate(" + context.Scales.gridAreaX(i) + "," + (context.Scales.gridAreaY.range()[0] - gridOffsetY[0]) + ")"
                })
                .each(function(d, i) {
                    var label = context.SVG.append("g")
                        .attr("class", "l xaxis xaxis-" + i)
                        .attr("transform", "translate(" + (context.Scales.gridAreaX(i)) + "," + (context.Scales.gridAreaY.range()[0] - 5) + ")")
                    label.append("text")
                        .attr("class", "l2")
                        .attr("x", context.SVG.cellWidth / 2 + 5)
                        .attr("text-anchor", "middle")
                        .text(context.filteredData.records.data[i].key.trim())
                    var bar = d3.select(this);
                    bar.append("rect")
                        .attr("width", context.SVG.cellWidth)
                        .attr("height", 10)
                    bar.append("text")
                        .attr("class", "l2")
                        .attr("x", context.SVG.cellWidth / 2 + 5)
                        .attr("y", 22)
                        .attr("text-anchor", "middle")
                })
        }


        function formatData() {
            context.possibleRowValues = [];
            context.filteredData.records.data.forEach(function(d, i) {
                if (context.possibleRowValues.indexOf(d[context.config.meta.records.rowAggregator]) == -1) {
                    context.possibleRowValues.push("" + d[context.config.meta.records.rowAggregator])
                }
            })
            context.possibleRowValues.sort(function(a, b) {
                if (a > b) return 1
                return -1
            })
            context.filteredData.records.data = nest(context.filteredData.records.data, context.config.meta.records.colAggregator)
            context.filteredData.records.data.forEach(function(d, i) {
                d[context.config.meta.records.rowAggregator] = nest(d.values.children, context.config.meta.records.rowAggregator)
            });
            context.filteredData.records.data.forEach(function(d, i) {
                var list = d[context.config.meta.records.rowAggregator].map(function(d1, i1) {
                    return d1.key
                });
                var uniqueDifference = getUnique($(context.possibleRowValues).not(list).get());
                uniqueDifference.forEach(function(d1, i1) {
                    var obj = new Object();
                    obj.key = d1;
                    obj.values = {
                        children: []
                    };
                    d[context.config.meta.records.rowAggregator].push(obj);
                })
            })
            if (typeof context.cellSortFunc == "function") {
                context.cellSortFunc(context.filteredData.records.data);
            } else {
                context.filteredData.records.data.forEach(function(d, i) {
                    d[context.config.meta.records.rowAggregator] = d[context.config.meta.records.rowAggregator].sort(function(a, b) {
                        return a.key.toString() > b.key.toString()
                    });
                });
                // context.filteredData.records.data = context.filteredData.records.data.sort(function(a, b) {
                //     return a.key - b.key
                // });
                context.filteredData.records.data.forEach(function(d, i) {
                    d[context.config.meta.records.rowAggregator] = d[context.config.meta.records.rowAggregator].sort(function(a, b) {
                        return a.key - b.key;
                    })
                })
            }
        }

        function formatBarData() {
            var dataAgg1 = [];
            var dataAgg2 = [];
            var dataAgg2Prep = {};
            context.filteredData.records.data.forEach(function(d, i) {
                var obj = new Object();
                obj.key = d.key;
                obj.values = d.values;
                dataAgg1.push(obj);
                d[context.config.meta.records.rowAggregator].forEach(function(d1, i1) {
                    if (Object.keys(dataAgg2Prep).indexOf(d1.key) == -1) {
                        dataAgg2Prep[d1.key] = new Object();
                        dataAgg2Prep[d1.key].key = d1.key;
                        dataAgg2Prep[d1.key].values = {};
                        dataAgg2Prep[d1.key].values.children = [];

                        dataAgg2Prep[d1.key].agg = [];
                    }
                    dataAgg2Prep[d1.key].values.children = dataAgg2Prep[d1.key].values.children.concat(d1.values.children);
                    dataAgg2Prep[d1.key].agg = rollup(dataAgg2Prep[d1.key].values.children)
                    delete dataAgg2Prep[d1.key].agg.children
                    Object.keys(dataAgg2Prep[d1.key].agg).forEach(function(d2, i2) {
                        dataAgg2Prep[d1.key].values[d2] = dataAgg2Prep[d1.key].agg[d2];
                    })
                    delete dataAgg2Prep[d1.key].agg
                })
            })
            Object.keys(dataAgg2Prep).forEach(function(d, i) {
                dataAgg2.push(dataAgg2Prep[d])
            })

            return { "col": dataAgg1, "row": dataAgg2 }
        }

        function appendMarkers() {
            defs = context.SVG.append("defs")
            defs.append("marker")
                .attr({
                    "id": "arrow",
                    "viewBox": "0 -5 10 10",
                    "refX": 5,
                    "refY": 0,
                    "markerWidth": 4,
                    "markerHeight": 4,
                    "orient": "auto"
                })
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("class", "arrowHead");
            var maxScaleX = context.Scales.gridAreaX(d3.max(context.Scales.gridAreaX.domain())) + gridOffsetX[1] - 25
            var maxScaleY = context.Scales.gridAreaY(d3.max(context.Scales.gridAreaY.domain())) + gridOffsetY[1] - 25
            context.SVG.append("path")
                .attr("class", "arrow")
                .attr("d", Utilities.lineFunction([{
                    "x": context.Scales.gridAreaX(0),
                    "y": 30
                }, {
                    "x": context.Scales.gridAreaX(d3.max(context.Scales.gridAreaX.domain())),
                    "y": 30
                }]))
                .attr("stroke", "black")
                // .attr("marker-end", "url(#arrow)")
            context.SVG.append("path")
                .attr("class", "arrow")
                .attr("d", Utilities.lineFunction([{
                    "x": 30,
                    "y": context.Scales.gridAreaY(0)
                }, {
                    "x": 30,
                    "y": context.Scales.gridAreaY(d3.max(context.Scales.gridAreaY.domain()))
                }]))
                .attr("stroke", "black")
                // .attr("marker-end", "url(#arrow)")
            context.SVG.append("text")
                .attr("class", "l2")
                .attr("x", context.Scales.gridAreaX(d3.max(context.Scales.gridAreaX.domain()) / 2) - 3)
                .attr("y", 25)
                .attr("text-anchor", "middle")
                .text(context.config.meta.labels.xAxis)
            context.SVG.append("text")
                .attr("class", "l2")
                .attr("x", -context.Scales.gridAreaY(d3.max(context.Scales.gridAreaY.domain()) / 2) - 3)
                .attr("y", 25)
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(270)")
                .text(context.config.meta.labels.yAxis)
        }
    }

    function rollup(leaves) {
        var obj = { children: leaves };
        context.filteredData.records.schema.forEach(function(d) {
            if (d.type == "numeric") {
                obj[d.name] = d3.sum(leaves, function(d1) {
                    return d1[d.name];
                })
            }
        })
        return obj;
    }
    context.SVG.rollup = rollup;

    function nest(data, attr) {
        return d3.nest()
            .key(function(d) {
                return d[attr]
            })
            .rollup(rollup)
            .entries(data)
    }
    context.SVG.nest = nest;

    function getUnique(arr) {
        var u = {},
            a = [];
        for (var i = 0, l = arr.length; i < l; ++i) {
            if (u.hasOwnProperty(arr[i])) {
                continue;
            }
            a.push(arr[i]);
            u[arr[i]] = 1;
        }
        return a;
    }

    return context;

}
