//4:00pm - 4:30pm 
//	Created and started visualization.
//	Added Nodes and edges. Edges don't work yet. 
//4:30pm - 5:00pm 
//	Fixed edges.
//	Generalized node creation. 
visualizationFunctions.Bipartite = function(element, data, opts) {
	var network = visualizations[opts.ngIdentifier];
	network.parentVis = visualizations[opts.ngComponentFor];
	network.config = network.CreateBaseConfig();
	network.SVG = network.config.easySVG(element[0])
		.attr("background", "white")
		.attr("class", "canvas " + opts.ngIdentifier)
	network.VisFunc = function() {
		network.SVG.nodeG = network.SVG.append("g")
			.attr("transform", "translate(0, " + 50 + ")")
		network.SVG.leftG = network.SVG.nodeG.append("g")
			.attr("transform", "translate(" + 50 + ", 0)");
		network.SVG.rightG = network.SVG.nodeG.append("g")
			.attr("transform", "translate(" + (network.config.dims.fixedWidth - 100) + ", 0)");

		var range = [50, network.config.dims.fixedWidth - 100];
		createNodes("left", "start")
		createNodes("right", "end")
		createEdges()
		network.SVG.leftG.moveToFront();
		network.SVG.rightG.moveToFront();


		function createNodes(dir, align) {
		    var split = network.filteredData.nodes.data.filter(function(d, i) {
		        return d[network.config.meta.bipartite.field] == network.config.meta.bipartite[dir];
		    });
		    network.Scales["bipartiteYScale" + dir] = d3.scale.linear()
		        .domain([0, split.length].sort())
		    network.Scales["bipartiteYScale" + dir].range(range)
		    network.SVG[dir + "G"].selectAll("." + dir)
		        .data(split)
		        .enter()
		        .append("g")
		        .each(function(d, i) {
		            var currG = d3.select(this)
		                .attr("transform", "translate(0," + network.Scales["bipartiteYScale" + dir](i) + ")")
		                .attr("class", "bipartite-" + dir + " " + "i-" + i + " id-" + d.id)
		                .property("y", network.Scales["bipartiteYScale" + dir](i))
		            currG.append("circle")
		                .attr("class", "n")
		                .attr("r", 20)
		            currG.append("text")
		                .attr("text-anchor", align)
		                .attr("class", "l")
		                .text(d.label);
		        })
		    network.SVG[dir + "G"].append("text")
		        .attr("text-anchor", align)
		        .text(network.config.meta.bipartite[dir])
		}

		function createEdges() {
			network.SVG.edgeG = network.SVG.nodeG.append("g")
			network.SVG.edgeG.selectAll(".edge")
				.data(network.filteredData.edges.data)
				.enter()
				.append("g")
				.each(function(d, i) {
					var currG = d3.select(this)
					currG.append("path")
						.attr("class", "e")
						.attr("d", Utilities.lineFunction([{
							x: range[0],
							y: network.SVG.selectAll(".id-" + d.source).property("y")
						}, {
							x: range[1],
							y: network.SVG.selectAll(".id-" + d.target).property("y")
						}]))
				})
		}
	}
	return network;
}
