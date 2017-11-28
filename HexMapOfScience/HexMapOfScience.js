head.js("http://d3js.org/d3.hexbin.v0.min.js");
head.js("visuals/HexMapOfScience/HexMapOfScience/underlyingScimapData.js");
head.js('visuals/HexMapOfScience/HexMapOfScience/disc_lookup.js')

visualizationFunctions.HexMapOfScience = function(element, data, opts) {
    var context = this;
    context.VisFunc = function() {
        context.config = context.CreateBaseConfig();
        context.config.hexLayout = {};
        //50, 30, + offsets
        context.config.hexLayout.columns = 52;
        context.config.hexLayout.rows = 36;

        context.Scales.xMap = d3.scale.linear()
            .domain(d3.extent(underlyingScimapData.nodes.data, function(d, i) {
                return d.x;
            }))
            .range([1, context.config.hexLayout.columns - 3])

        context.Scales.yMap = d3.scale.linear()
            .domain(d3.extent(underlyingScimapData.nodes.data, function(d, i) {
                return d.y;
            }))
            .range([1, context.config.hexLayout.rows - 2].reverse())

        context.SVG = context.config.easySVG(element[0], {
            zoomable: true,
            zoomLevels: [.5, 20]
        })
        context.background = context.SVG.append("rect")
            .attr("width", context.config.dims.fixedWidth)
            .attr("height", context.config.dims.fixedHeight)
            .attr("fill", "white")
            .attr("opacity", .000000001)
            //Map discipline data to each node
        underlyingScimapData.nodes.data.forEach(function(d, i) {
            d.disc_data = underlyingScimapData.disciplines.data.filter(function(d1, i1) {
                return d.disc_id == d1.disc_id
            })[0]
        })
        underlyingScimapData.nodes.data.forEach(function(d, i) {
            d.hexX = Math.round(context.Scales.xMap(d.x));
            d.hexY = Math.round(context.Scales.yMap(d.y));
        })


        // var newColors = ["#9036F7", "#039BE5", "#E91E63","#64FFDA","#8BC34A","#546E7A", "#FF3D00", "#880E4F", "#F9A825", "#558B2F", "#009688", "#FF5252", "#B71C1C"].reverse()
        //     underlyingScimapData.disciplines.data.forEach(function(d, i) {
        //     d.color = newColors[12 - i]
        // })
        context.config.hexLayout.hexRadius = d3.min([
            context.config.dims.fixedWidth / ((context.config.hexLayout.columns + .5) * Math.sqrt(3)),
            context.config.dims.fixedHeight / ((context.config.hexLayout.rows + 1 / 3) * 1.5)
        ]);
        context.config.dims.fixedWidth = context.config.hexLayout.columns * context.config.hexLayout.hexRadius * Math.sqrt(3);
        context.config.dims.fixedHeight = context.config.hexLayout.rows * 1.5 * context.config.hexLayout.hexRadius + .5 * context.config.hexLayout.hexRadius
        context.hexbin = d3.hexbin().size([context.config.dims.fixedWidth, context.config.dims.fixedHeight]).radius(context.config.hexLayout.hexRadius);
        context.points = calculateHexCore();
        context.nodeStates = {
            nodeVisited: false,
            nodeClicked: false
        }
        context.labelStates = {
            labelVisited: false,
            labelClicked: false
        }
        context.SVG.hexagonG = createNodes();
        context.SVG.labelG = createLabels();

        context.SVG.hexagonText = context.SVG.hexagonG.append("text")
            .text(function(d, i) {
                if (d[0][2].length > 1) return d[0][2].length;
            })

        applyNodeEvents(context.SVG.hexagonG);
        applyBackgroundEvents(context.background);
        applyLabelEvents(context.SVG.labelG);

        function applyNodeEvents(nodes) {
            nodes.on("mouseover", function(d, i) {
                    if (!context.nodeStates.nodeClicked) {
                        context.nodeStates.nodeVisited = true;
                        context.selectNodesAndEdges(d, i);
                        d3.select(this).moveToFront();
                        d3.select(this).selectAll("text").style("display", "block")
                    }
                })
                .on("mouseout", function() {
                    context.SVG.hexagonG.selectAll("text").style("display", "none")
                })
                .on("click", function(d, i) {
                    context.nodeStates.nodeVisited = false;
                    context.nodeStates.nodeClicked = true;
                    context.selectNodesAndEdges(d, i);
                })
        }

        function applyLabelEvents(labels) {
            labels.on("mouseover", function(d, i) {
                    if (!context.labelStates.labelClicked) {
                        context.labelStates.labelVisited = true;
                        context.selectNodesFromLabel(d, i);
                    }
                })
                .on("click", function(d, i) {
                    context.labelStates.labelVisited = false;
                    context.labelStates.labelClicked = true;
                    context.selectNodesFromLabel(d, i);
                })
        }


        function applyBackgroundEvents(background) {
            background.on("mouseover", function() {
                if (!context.nodeStates.nodeClicked && !context.labelStates.labelClicked) {
                    context.nodeStates.nodeVisited = false;
                    setTimeout(function() {
                        if (!context.nodeStates.nodeVisited) {
                            context.SVG.hexagonG.classed("selected", false).classed("deselected", false).classed("highlighted", false)


                        }
                    }, 250)
                }
            
            }).on("click", function() {
                context.SVG.hexagonG.classed("selected", false).classed("deselected", false).classed("highlighted", false);
                context.nodeStates.nodeVisited = false;
                context.nodeStates.nodeClicked = false;
                context.labelStates.labelVisited = false;
                context.labelStates.labelClicked = false;
            })
        }

        function createNodes() {
            var hexagonG = context.SVG.append("g")
                .attr("transform", "translate(" + [context.config.hexLayout.hexRadius, context.config.hexLayout.hexRadius] + ")")
                .attr("class", "hexbin")
                .selectAll(".hexagon")
                .data(context.hexbin(context.points))
                .enter()
                .append("g")

            hexagonG.data().forEach(function(d, i) {
                d.subd_data = d[0][2][0];
            })
            hexagonG
                .attr("class", function(d, i) {
                    return "disc_" + d.subd_data.disc_id + " subd_" + d.subd_data.subd_id;
                })
                .attr("transform", function(d, i) {
                    var x = d.x;
                    var y = d.y;
                    return "translate(" + [x, y] + ")";
                })
            var hexagonNode = hexagonG.append("path")
                .attr("class", "hexagon")
                .attr("d", function(d, i) {
                    return context.hexbin.hexagon();
                })
                .attr("stroke", "black")
                .attr("fill", function(d, i) {
                    return d.subd_data.disc_data.color
                })
                .attr("opacity", .8)

            hexagonG.append("text")
                .attr("class", "subd_label subd")
                .text(function(d, i) {
                    return d.subd_data.subd_name
                })
                .attr("x", context.config.hexLayout.hexRadius / 1.25 + 4)
                .attr("y", 6)
                .style("display", "none")
            return hexagonG;
        }

        function createLabels() {
            var labelG = context.SVG.append("g")
                .attr("transform", "translate(" + [context.config.hexLayout.hexRadius, context.config.hexLayout.hexRadius] + ")")
                .attr("class", "disc-label")
                .selectAll(".LABEL")
                .data(underlyingScimapData.disciplines.data)
                .enter()
                .append("g")
            labelG
                .attr("transform", function(d, i) {
                    var anchorOffset = 1;
                    if (d.hex_label.anchor == "end") anchorOffset = -1
                    var subd_anchor = context.SVG.selectAll(".subd_" + d.hex_label.sub_anchor).data()[0]
                    var x = subd_anchor.x + ((context.config.hexLayout.hexRadius * 2) * anchorOffset) + d.hex_label.dx;
                    var y = subd_anchor.y + d.hex_label.dy;
                    return "translate(" + [x, y] + ")";
                })
            var hexagonNode = labelG
                .append("text")
                .text(function(d, i) {
                    return d.disc_name;
                })
                .attr("fill", function(d, i) {
                    return d.color;
                })
                .attr("text-anchor", function(d, i) {
                    return d.hex_label.anchor;
                })
                // .append("foreignObject")
                // .append("xhtml:body")
                // .html(function(d, i) {
                //     return "<span>" + d.disc_data.disc_name + "</span>"
                // })
                // .style("color", function(d, i) {
                //     return d.disc_data.color;
                // })
                // .style("fill", "none")
            return labelG;
        }


        function calculateHexCore() {
            var points = [];
            for (var i = 0; i < context.config.hexLayout.rows; i++) {
                for (var j = 0; j < context.config.hexLayout.columns; j++) {
                    var mappedNodes = underlyingScimapData.nodes.data.filter(function(d1, i1) {
                        return d1.hexX == j && d1.hexY == i
                    })

                    if (mappedNodes.length > 0) {
                        points.push([
                            context.config.hexLayout.hexRadius * j * 1.75,
                            context.config.hexLayout.hexRadius * i * 1.5,
                            mappedNodes
                        ]);
                    }
                }
            }
            return points;
        }
        context.selectNodesAndEdges = function(d, i) {
            context.SVG.hexagonG.classed("selected", false).classed("deselected", true).classed("highlighted", false)
            underlyingScimapData.edges.data.filter(function(d1, i1) {
                return d1.source == d.subd_data.subd_id || d1.target == d.subd_data.subd_id
            }).forEach(function(d1, i1) {
                context.SVG.hexagonG.filter(".subd_" + d1.source).classed("deselected", false).classed("highlighted", true)
                context.SVG.hexagonG.filter(".subd_" + d1.target).classed("deselected", false).classed("highlighted", true)
            })
            context.SVG.hexagonG.filter(".subd_" + d.subd_data.subd_id).classed("deselected", false).classed("highlighted", false).classed("selected", true);
        }
        context.selectNodesFromLabel = function(d, i) {
            context.SVG.hexagonG.classed("deselected", true).classed("selected", false)
            context.SVG.labelG.classed("deselected", false).classed("selected", true)
            context.SVG.selectAll(".disc_" + d.disc_id).classed("deselected", false).classed("selected", true)
        }



        context.nestedData = nestDiscChildData(nestDiscData(context.filteredData[context.PrimaryDataAttr].data));

        function nestDiscData(data) {
            data.forEach(function(d, i) {
                var disc = disc_lookup.records.data.filter(function(d1, i1) {
                    return d.subd_id == d1.subd_id
                })
                d.disc_id = disc[0].disc_id;
                // console.log(d);
            })

            return {
                disc: d3.nest()
                    .key(function(d) {
                        return parseInt(d.disc_id);
                    })
                    .rollup(function(leaves) {
                        var obj = {
                            children: leaves
                        };
                        context.filteredData[context.PrimaryDataAttr].schema.forEach(function(d) {
                            if (d.type == "numeric") {
                                obj[d.name] = d3.sum(leaves, function(d1) {
                                    return d1[d.name];
                                })
                            }
                        })
                        return obj;
                    })
                    .entries(data),
                sub_disc: []
            }
        }

        function nestDiscChildData(data) {
            data.disc.forEach(function(d, i) {
                d.values.nestedChildren = d3.nest()
                    .key(function(d1) {
                        return parseInt(d1.subd_id);
                    })
                    .rollup(function(leaves) {
                        var obj = {
                            children: leaves
                        };
                        context.filteredData[context.PrimaryDataAttr].schema.forEach(function(d1) {
                            if (d1.type == "numeric") {
                                obj[d1.name] = d3.sum(leaves, function(d2) {
                                    return d2[d1.name];
                                })
                            }
                        })
                        return obj;
                    }).entries(d.values.children);
                data.sub_disc = data.sub_disc.concat(d.values.nestedChildren);
            });
            return data;
        }






    }
    return context;
}
