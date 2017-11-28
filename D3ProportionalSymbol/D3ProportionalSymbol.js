head.js('visuals/D3ProportionalSymbol/D3ProportionalSymbol/us.js');
head.js('visuals/D3ProportionalSymbol/D3ProportionalSymbol/topojson.js');

// head.js('visuals/D3ProportionalSymbol/D3ProportionalSymbol/mingle/graph.js');
// head.js('visuals/D3ProportionalSymbol/D3ProportionalSymbol/mingle/mingle.js');
// head.js('visuals/D3ProportionalSymbol/D3ProportionalSymbol/mingle/kdtree.js');

head.js('visuals/D3ProportionalSymbol/D3ProportionalSymbol/d3-ForceEdgeBundling.js')


visualizationFunctions.D3ProportionalSymbol = function(element, data, opts) {
    var that = this;
    this.VisFunc = function() {


        that.config = that.CreateBaseConfig();

        that.SVG = that.config.easySVG(element[0], {
            zoomable: true,
            zoomLevels: [.5, 20],
        })

        that.SVG.background = that.SVG.append("rect")
            .attr("opacity", .000001)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("x", 0)
            .attr("y", 0)

        nestData();



        that.SVG.g = that.SVG.append("g")

        var shapeData = usShapeData;
        that.SVG.projection = d3.geo.albersUsa()
            .scale(that.config.dims.fixedWidth)
            .translate([that.config.dims.fixedWidth / 2, that.config.dims.fixedHeight / 2])

        that.SVG.pathG = that.SVG.g.selectAll("path")
            .data(topojson.feature(shapeData, shapeData.objects.states).features)
            .enter()

        that.SVG.path = that.SVG.pathG
            .append("path")
            .classed("feature wvf-path", true)
            .attr("d", d3.geo.path()
                .projection(that.SVG.projection))

        // .on("click", clicked)

        that.update = function() {
            try { that.SVG.nodeG.selectAll("*").remove(); } catch (e) {};
            try { that.SVG.edges.selectAll("*").remove(); } catch (e) {};

            that.SVG.nodeG = that.SVG.g.selectAll(".nodeG")
                .data(that.filteredData[that.PrimaryDataAttr].data[that.currCategory])
                .enter()
                .append("g")
                .attr("class", function(d, i) {
                    var outStr = "";
                    d.values.children.forEach(function(d1, i1) {
                        outStr += "id-" + d1[that.config.meta.identifier] + " ";
                    })
                    return "node " + outStr;
                })
                .attr("transform", function(d, i) {
                    var arr = [d.values[that.config.meta.lng], d.values[that.config.meta.lat]]
                    d.projected = that.SVG.projection(arr)
                    if (d.projected == null) {
                        d3.select(that).remove()
                    } else {
                        d.x = d.projected[0];
                        d.y = d.projected[1];
                        return "translate(" + (d.projected[0]) + "," + (d.projected[1]) + ")"
                    }
                })


            that.SVG.nodes = that.SVG.nodeG
                .append("circle")
                .classed("wvf-node", true)
                .attr("r", function(d, i) {
                    return that.categoryScales[that.currCategory].size(d.sizeSum)
                })
                .attr("fill", "#0BBCCE")
            var toBundle = false;
            if (that.PrimaryDataAttr == "nodes") {
                if (that.config.meta.edges) {
                    if (that.config.meta.edges.bundle) {
                        toBundle = true;
                    }
                }
                if (toBundle) {
                    var nodeData = {};
                    var edgeData = [];
                    that.filteredData[that.PrimaryDataAttr].data[that.currCategory].forEach(function(d, i) {
                        nodeData[i] = d;
                    })
                    console.log(nodeData);
                    that.filteredData.edges.data.forEach(function(d, i) {
                        var s = Object.keys(nodeData).filter(function(d1, i1) {
                            return nodeData[d1].values.children.filter(function(d2, i2) {
                                return d2.id == d.source
                            }).length > 0;
                        })[0]

                        var t = Object.keys(nodeData).filter(function(d1, i1) {
                            return nodeData[d1].values.children.filter(function(d2, i2) {
                                return d2.id == d.target
                            }).length > 0;
                        })[0]

                        if (s == t) {
                            //do something about this?
                        } else {
                            var existingEdge = edgeData.filter(function(d1, i1) {
                                return ((d1.source == s) && (d1.target == t))
                            })
                            if (existingEdge.length > 0) {
                                existingEdge[0].d.push(d);
                            } else {
                                edgeData.push({
                                    //TODO: This needs to change to find the node id. 
                                    "source": s,
                                    "target": t,
                                    "d": [d]
                                })
                            }
                        }
                    });
                    var fbundling = d3.ForceEdgeBundling()
                        .step_size(10)
                        .compatibility_threshold(.05)
                        .bundling_stiffness(1)
                        .step_size(.1)
                        .cycles(8)
                        .iterations(90)
                        .iterations_rate(.0125)
                        .subdivision_points_seed(1)
                        .subdivision_rate(2)
                        .nodes(nodeData)
                        .edges(edgeData);

                    var results = fbundling();
                    that.SVG.edgeG = that.SVG.g.selectAll(".edge")
                        .data(results)
                        .enter()
                        .append("path")
                        .attr("class", "wvf-edge")
                        .attr("d", function(d, i) {
                            return Utilities.lineFunction(d);
                        })
                        // .attr("stroke-width", function(d, i) {
                        //     console.log(d);
                        // })
                        .attr("opacity", .2)



                    // var edgeMap = [];
                    // that.filteredData.edges.data.forEach(function(d, i) {
                    //     var s = that.SVG.nodeG.filter(".id-" + d.source).data()[0];
                    //     var t = that.SVG.nodeG.filter(".id-" + d.target).data()[0];
                    //     edgeMap.push({
                    //         id: i,
                    //         name: i,
                    //         data: {
                    //             coords: [
                    //                 s.projected[0],
                    //                 s.projected[1],
                    //                 t.projected[0],
                    //                 t.projected[1]
                    //             ],
                    //             weight: d.Weight
                    //         }
                    //     })
                    // });
                    // var bundle = new Bundler();
                    // bundle.setNodes(edgeMap);
                    // bundle.buildNearestNeighborGraph();
                    // bundle.MINGLE();

                    // that.SVG.edges = that.SVG.g.append("g");
                    // bundle.graph.each(function(node) {
                    //     var edges = node.unbundleEdges(.2);
                    //     edges.forEach(function(d, i) {
                    //         var lineArr = [];
                    //         d.forEach(function(d1, i1) {
                    //             // console.log((d1.node.id + "").split("-")[0])
                    //             lineArr.push({
                    //                 x: d1.pos[0],
                    //                 y: d1.pos[1]
                    //             })
                    //         })
                    //         that.SVG.edges.append("path")
                    //             .attr("class", "wvf-edge")
                    //             .attr("opacity", .2)
                    //             .attr("d", Utilities.lineFunction(lineArr))
                    //     })
                    // })

                } else {
                    that.Scales.edgeSizeScale = d3.scale[that.config.meta.edges.styleEncoding.size.scaleType || "linear"]()
                        .domain(d3.extent(that.filteredData.edges.data, function(d1, i1) {
                            return d1[that.config.meta.edges.styleEncoding.size.attr];
                        }))
                        .range(that.config.meta.edges.styleEncoding.size.range)

                    that.SVG.edges = that.SVG.g.selectAll(".edge")
                        .data(that.filteredData.edges.data)
                        .enter()
                        .append("path")
                        .attr("class", "wvf-edge")
                        .attr("d", function(d, i) {
                            var s = that.SVG.nodeG.filter(".id-" + d.source).data()[0];
                            var t = that.SVG.nodeG.filter(".id-" + d.target).data()[0];
                            try {
                                return Utilities.lineFunction([{
                                    x: s.projected[0],
                                    y: s.projected[1]
                                }, {
                                    x: t.projected[0],
                                    y: t.projected[1]
                                }])
                            } catch (e) {
                                return "";
                            }
                        })
                        .attr("stroke-width", function(d, i) {
                            return that.Scales.edgeSizeScale(d[that.config.meta.edges.styleEncoding.size.attr])
                        })
                        .attr("opacity", .4)

                }
            }

            that.SVG.nodeG.moveToFront();
        }

        function nestData() {
            that.categories = that.config.meta.categories;
            that.categoryBank = {};

            that.categories.forEach(function(category, i) {
                that.categoryBank[category] = nest(category, i);
            })

            that.filteredData[that.PrimaryDataAttr].data = that.categoryBank;
            that.currCategory = that.categories[0];

            that.categoryScales = {};
            that.categories.forEach(function(d, i) {
                var sizeScale = d3.scale[that.config.meta.nodes.styleEncoding.size.scaleType || "linear"]()
                    .domain(d3.extent(that.filteredData[that.PrimaryDataAttr].data[d], function(d1, i1) {
                        d1.sizeSum = d3.sum(d1.values.children, function(d2, i2) {
                            return d2[that.config.meta.nodes.styleEncoding.size.attr]
                        })
                        return d1.sizeSum;
                    }))
                    .range(that.config.meta.nodes.styleEncoding.size.range)
                that.categoryScales[d] = {};
                that.categoryScales[d].size = sizeScale;
            });
        }

        function nest(category, i) {
            return d3.nest()
                .key(function(d) {
                    return d[category];
                })
                .rollup(function(leaves) {
                    var obj = {
                        children: leaves
                    };
                    that.filteredData[that.PrimaryDataAttr].schema.forEach(function(d) {
                        if (d.type == "numeric") {
                            obj[d.name] = d3.mean(leaves, function(d1) {
                                return d1[d.name];
                            })
                        } else {}
                    })
                    return obj;
                })
                .entries(that.filteredData[that.PrimaryDataAttr].data);
        }

        that.update();

    }
    return this;
}
