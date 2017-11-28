visualizationFunctions.LineGraph = function(element, data, opts) {
	var network = visualizations[opts.ngIdentifier];
	network.parentVis = visualizations[opts.ngComponentFor];
	network.config = network.CreateBaseConfig();
	network.meta = network.config.meta;

	var data = network.filteredData;
	network.SVG = network.config.easySVG(element[0])
		.attr("background", "white")
		.attr("class", "canvas " + opts.ngIdentifier)
		.append("g")
		.attr("transform", "translate(" + network.config.margins.left + "," + network.config.margins.top + ")");
	network.VisFunc = function() {
		
		Utilities.runJSONFuncs(network.config.meta, [data, network.config]);
		function createFakeJSON(x) {
			var groups = ["a", "b", "c"];
			var out = {
				"records": {
					"schema": [],
					"data": []
				}};
			var b = 0;
			for (var i = 0; i < x; i++) {
				out.records.data.push({
					a: Math.floor(Math.random() * 99),
					b: Math.floor(Math.random() * 99),
					label: "Label" + i,
					group: groups[Math.floor(Math.random() * groups.length)],
					id: i
				})}
			for (var i = 0; i < groups.length; i++) {
				out.records.data.push({
					a: 100,
					b: Math.floor(Math.random() * 99),
					label: "Label" + i,
					group: groups[i]
				})}
			return out;}
		var tempData = createFakeJSON(12);
		// var nestedData = d3.nest()
		// 	.sortValues(function(a,b) { return ((a.a < b.a) ? -1: 1);return 0;})
		// 	.key(function(d) { return d[network.config.meta.edges.aggAttr || d[network.config.meta.edges.identifier.attr]]})
		// 	.entries(tempData.records.data);

		nestedData = d3.nest()
		    .key(function(d) { return d.y})				
		    .rollup(function(leaves) { 
				var obj = {children:leaves};
				network.filteredData.records.schema.forEach(function(d) {
					if (d.type == "numeric") {
						obj[d.name] = d3.sum(leaves, function(d1) {
							return d1[d.name];
						})
					}
				})
				return obj;
			})
			.entries(network.filteredData.records.data);



		var colorScale = d3.scale.linear()
			.domain([0, nestedData.length])
			.range(["lightgreen", "black"]);

		network.Scales.x = d3.scale.linear()
			.domain([0, d3.max(network.GetData().records.data, function(d) {
				return d.x;
			})])
		network.Scales.y = d3.scale.linear()
			.domain(d3.extent(network.GetData().records.data, function(d) {
				return d.val;
			}))
		network.Scales.x1 = d3.scale.linear()
			.domain(network.Scales.x.domain())
		network.Scales.y1 = d3.scale.linear()
			.domain(network.Scales.y.domain())
		

		network.config.easyGraphLayout(network);
		network.config.easyGraph(network, {
			x: {
				scale1: network.Scales.x,
				scale2: network.Scales.x1,
				orient: "bottom",
				label: "SomethingX"
			},
			y: {
				scale1: network.Scales.y,
				scale2: network.Scales.y1,
				orient: "left",
				label: "SomethingY"
			},
			t: {
				orient: "top",
				label: opts.ngDataField	
			}
		})

		var line = d3.svg.line()
			.x(function(d) {
				return d.x;
			})
			.y(function(d) {
				return d.y;
			})
			.interpolate("monotone");

		// var tip = d3.tip()
		// 	.attr("class", "d3-tip")
		// 	.offset([0, 0])
		// 	.html(function(d) {
		// 		var str = "";
		// 		Object.keys(d).forEach(function(d1, i1) {
		// 			str += "<strong>" + d1 + ":</strong> <span style='color:red'>" + d[d1] + "</span></br>"
		// 		})
		// 		return str;
		// 	})

		// network.SVG.call(tip);

		// network.SVG.dataCircles = network.SVG.selectAll("dataCircles")
		// 	.data(nestedData)
		// 	.enter()
		// 	.append("circle")
		// 	.attr("class", "n")
		// 	.attr("cx", function(d, i) {
		// 		return network.Scales.x1(d.values.childr.x);
		// 	}).attr("cy", function(d, i) {
		// 		return network.Scales.y1(d.val);
		// 	}).attr("r", function(d, i) {
		// 		return 6;
		// 	})

		network.SVG.dataPaths = network.SVG.selectAll("dataPath")
			.data(nestedData)
			.enter()
			.append("path")
			.attr("class", function(d, i) {
				return "y" + d.key
			})
			.attr("d", function(d, i) {
				var lines = [];
				d.values.children.forEach(function(d1, i1) {
					lines.push({
						"x": network.Scales.x1(d1.x),
						"y": network.Scales.y1(d1.val)
					});
				});
				// var someNodes = network.SVG.selectAll(".someNodes" + i)
				// 	.data(d.values.children)
				// 	.enter()
				// 	.append("circle")
				// 	.attr("class", "n")
				// 	.attr("cx", function(d1, i1) {
				// 		console.log(d1)
				// 		return network.Scales.x1(d1.x);
				// 	}).attr("cy", function(d1, i1) {
				// 		return network.Scales.y1(d1.val);
				// 	}).attr("r", function(d1, i1) {
				// 		return 6;
				// 	})				
				return line(lines)
			})
			.attr("stroke", function(d, i) {
				return colorScale(i);
			})
			.attr("stroke-width", 4)
			.attr("fill", "none")
			.on("mouseover", function(d, i) {
				network.SVG.dataPaths.style("opacity", .25)
				d3.select(this).style("opacity", 1)
			})
			.on("mouseout", function(d, i) {
				network.SVG.dataPaths.style("opacity", 1)
			})
		// network.SVG.dataCircles
		// 	.on("click", function(d) {
		// 		if (d3.select(this).property("popupon") == null) {
		// 			d3.select(this).property("popupon", false);
		// 		}
		// 		if (d3.select(this).property("popupon")) {
		// 			d3.select(this).property("popupon", false);
		// 			tip.hide(d);
		// 		} else {
		// 			d3.select(this).property("popupon", true);
		// 			tip.show(d);
		// 		}
		// 	}).moveToFront();
	}
	return network;
}



