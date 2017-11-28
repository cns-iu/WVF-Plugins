visualizationFunctions.PathLegend = function(element, data, opts) {
	var network = visualizations[opts.ngIdentifier];
	network.config = network.CreateBaseConfig();
	network.parentVis = visualizations[opts.ngComponentFor];
	network.SVG = d3.select(element[0])
		.append("svg")
		.attr("width", network.config.dims.width)
		.attr("height", network.config.dims.height)
		.append("g")
		.attr("background", "white")
		.attr("class", "canvas " + opts.ngIdentifier);
	network.parentVis = visualizations[opts.ngComponentFor];
	network.VisFunc = function() {
		var data = visualizations.lineGraph01.SVG.dataPaths.each(function(d, i) { return d3.select(this)})[0];
		network.lineGroup = network.SVG.selectAll("lksdjf")
			.data(data)
			.enter()
			.append("g")
			.attr("transform", "translate(10, 20)")


		var lineOffset = (network.config.dims.height - 20) / data.length;
		network.lines = network.lineGroup
			.append("path")
			.attr("d", function(d, i) {
				return Utilities.lineFunction([{
					"x": 0,
					"y": lineOffset * i
				}, {
					"x": network.config.dims.width * .25,
					"y": lineOffset * i
				}])
			})
			.attr("stroke", function(d, i) {
				return d3.select(d).attr("stroke");
			})
			.attr("stroke-width", 2)
		network.labels = network.lineGroup
			.append("text")
			.attr("transform", function(d, i) {
				return "translate(" + (network.config.dims.width * .25 + 10) + "," + (lineOffset * i + 3) + ")";
			})
			.text(function(d, i) {
				return d3.select(d).data()[0].key
			})

	}
	return network;
}