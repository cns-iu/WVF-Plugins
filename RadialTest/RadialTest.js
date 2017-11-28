visualizationFunctions.RadialTest = function(element, data, opts) {
    var network = visualizations[opts.ngIdentifier];
    network.parentVis = visualizations[opts.ngComponentFor];
    network.VisFunc = function() {
        network.config = network.CreateBaseConfig();
        //TODO: Cut down on some of these parameters
        Utilities.runJSONFuncs(network.config.meta, [data, network.config]);
        var useData = network.filteredData.records.data
        //TODO: Make layouts from the...layouts.
        network.SVG = network.config.easySVG(element[0], {
                "background": "white"
            })
            .attr("class", "canvas " + opts.ngIdentifier)
            .append("g")
            .attr("transform", "translate(" + (network.config.dims.width / 2) + "," + (network.config.dims.height / 2) + ")");

        network.SVG.vArc = d3.svg.arc()
            .startAngle(function(d) {
                return parseFloat(d.property("sA"));
            })
            .endAngle(function(d) {
                return parseFloat(d.property("eA"));
            })
            .innerRadius(function(d) {
                return parseFloat(d.property("iR"));
            })
            .outerRadius(function(d) {
                return parseFloat(d.property("oR"));
            });
        //TODO: Add scaletype to config

        //Accomodating for the inner radius, plus some exterior padding
        network.SVG.t = 4;
        network.SVG.arcRadius = 1;
        if (network.config.meta.styleEncoding.arcs.overrideSize) {
            network.SVG.arcRadius = network.config.meta.styleEncoding.arcs.overrideSize;
        } else {
            network.config.meta.aggregates.forEach(function(d, i) {
                if (d.type == "single") {
                    var t1 = [];
                    useData.forEach(function(d1, i1) {
                        t1.push(d1[d.attr].length);
                    })
                    network.SVG.t += d3.max(t1);
                } else {
                    network.SVG.t += 1;
                }
            })
            network.SVG.arcRadius = d3.max([network.config.dims.width / 2, network.config.dims.height / 2]) / network.SVG.t;
        }
        network.Scales.arcScale = d3.scale.log()
            .domain([0, network.SVG.t])
            .range([0, d3.min([network.config.dims.fixedWidth, network.config.dims.fixedHeight]) / 2])


        network.SVG.g = network.SVG.append("g");
        network.SVG.g.selectAll(".arcGroup")
            .data(useData)
            .enter()
            .append("g")
            .attr("class", function(d, i) {
                return "arcGroup arcGroup-" + i
            })
            .each(function(d, i) {
                var currNode = d3.select(this)
                var sA = ((360 / useData.length) * i) * (Math.PI / 180);
                var eA = ((360 / useData.length) * (i + 1)) * (Math.PI / 180);
                var lastR = network.SVG.arcRadius;
                var aggG = currNode.append("g")
                    .attr("class", "agg agg-" + i)
                var n = aggG.append("path")
                    .property("sA", sA)
                    .property("eA", eA)
                    .property("iR", 0)
                    .property("oR", network.Scales.arcScale(network.SVG.t))
                n.attr("d", network.SVG.vArc(n))
                    .attr("id", "arc" + i)
                var oRs = [] 
                for (var i1 = 0; i1 < network.config.meta.aggregates.length; i1++) {
                    var currNodeArcGroup;
                    if (network.config.meta.aggregates[i1].type == "single") {
                        d[network.config.meta.aggregates[i1].attr].forEach(function(d2, i2) {
                            currNodeArcGroup = currNode.append("g")
                                .attr("class", "arc-" + i1 + "-" + i2 + " " + network.config.meta.aggregates[i1].attr);
                            var n1 = currNodeArcGroup.append("path")
                                .attr("id", "arc-" + i + "-" + i1 + "-" + i2)
                                .property("sA", sA)
                                .property("eA", eA)
                                .property("iR", lastR)
                            lastR += network.SVG.arcRadius
                            n1.property("oR", lastR)
                                .attr("d", network.SVG.vArc(n1))
                            currNodeArcGroup.append("text")
                                .attr("dy", 15)
                                .append("textPath")
                                .attr("xlink:href", "#arc-" + i + "-" + i1 + "-" + i2)
                                .style("text-anchor", "start")
                                .attr("startOffset", ".5%")
                                .text("single")
                        })
                    }
                    if (network.config.meta.aggregates[i1].type == "multi") {
                        d[network.config.meta.aggregates[i1].attr].forEach(function(d2, i2) {
                            var currNodeArcGroup = currNode.append("g")
                                .attr("class", "arc-" + i1 + "-" + i2 + " " + network.config.meta.aggregates[i1].attr);
                            var n1 = currNodeArcGroup.append("path")
                                .attr("id", "arc-" + i + "-" + i1 + "-" + i2)
                                .property("sA", sA + ((((360 / useData.length) / d[network.config.meta.aggregates[i1].attr].length) * i2) * (Math.PI / 180)))
                                .property("eA", sA + ((((360 / useData.length) / d[network.config.meta.aggregates[i1].attr].length) * (i2 + 1)) * (Math.PI / 180)))
                                .property("iR", lastR)
                                .property("oR", lastR + network.SVG.arcRadius)
                            n1.attr("d", network.SVG.vArc(n1))
                                .attr("fill", function() {
                                    return '#' + Math.floor(Math.random() * 16777215).toString(16);
                                })
                            currNodeArcGroup.append("text")
                                .attr("dy", 15)
                                .append("textPath")
                                .attr("xlink:href", "#arc-" + i + "-" + i1 + "-" + i2)
                                .style("text-anchor", "start")
                                .attr("startOffset", ".5%")
                                .text("multi")
                        })
                        lastR += network.SVG.arcRadius;
                    }
                }
            })

    }
    return network;
}
