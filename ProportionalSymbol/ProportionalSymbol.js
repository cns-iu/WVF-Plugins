visualizationFunctions.ProportionalSymbol = function(element, data, opts) {
	var network = visualizations[opts.ngIdentifier];
	network.parentVis = visualizations[opts.ngComponentFor];
	network.config = network.CreateBaseConfig();
	network.VisFunc = function() {
		var data = network.AngularArgs.data.get("records");

		var categories = ['lat'];
		var categoryBank = {};

		categories.forEach(function(category) {
			categoryBank[category] = d3.nest()
				.key(function(d) { return d[category]; })
				.rollup(function(leaves) { 
					var obj = {children:leaves};
					data.schema.forEach(function(d) {
						if (d.type == "numeric") {
							obj[d.name] = d3.mean(leaves, function(d1) {
								return d1[d.name];
							})
						}
					})
					return obj;
				})
				.entries(data.data);
		})
		network.leaflet = network.config.easyLeafletMap(element[0], {
			worldCopyJump: true,
			minZoom: 2,
			maxZoom: 8,
			center: [39, -98],
			zoom: 3,
			closePopupOnClick: true
		}, "http://{s}.tile.openstreetmap.org").addInteractionLayer().addTileLayer();
		network.leaflet.map._initPathRoot();
		network.SVG = d3.select(element[0]).select("svg"),

		network.leaflet.map.on("viewreset", update);

		var circ = network.SVG.append("circle")
			.attr("r", 12)

		// var network.Scales.rScale = d3.scale.linear()
		// 	.domain([
		// 		d3.min(categoryBank.ipREGION, function(d) { return d.values.Count}),
		// 		d3.max(categoryBank.ipREGION, function(d) { return d.values.Count})])
		// 	.range([2, 12])
		
		network.Scales.rScale = d3.scale.linear()
			.domain([0,100])
			.range([2, 12])

		network.SVG.nodes = network.SVG.selectAll(".circle")
			.data(categoryBank.lat)
			.enter()
			.append("circle")
			.attr("class", function(d, i) {
				return "id" + i
			})
			.attr("r", function(d, i) {
				return 12;
				// network.Scales.rScale(d.values.val)
			})
		// network.SVG.edges = network.SVG.selectAll(".path")
		// 	.data(network.AngularArgs.data.edges.data)
		// 	.enter()
		// 	.append("path")
		// 	.attr("stroke", "#FF0000")
		// 	.attr("stroke-width", "#FF0000")

		update();

		function update() {
			network.SVG.nodes
				.attr("transform", function(d, i) {
					var l1= network.leaflet.map.latLngToLayerPoint({
						"lat": d.values.lat || 0,
						"lng": d.values.lng || 0
					});
					var x = l1.x;
					var y = l1.y;
					return "translate(" + x + "," + y + ")";
				}).on("click", function(d) {
					d.popupContent = [];
					network.config.meta.nodes.popup.forEach(function(d1, i1) {
						l = d1.prettyLabel;
						d.popupContent.push({l: d.values[d1.attr]})
					})
					console.log(d.popupContent)
					var popup = L.marker(network.leaflet.map.layerPointToLatLng(network.leaflet.map.latLngToLayerPoint({
						"lat": d.values.lat || 0,
						"lng": d.values.lng || 0
					})), {
						icon: new network.leaflet.marker({
							options: {
								autoPan: false,
								iconSize: [0, 0],
								iconAnchor: [0, 0],
								popupAnchor: [0, 0]
							}
						})
					}).addTo(network.leaflet.map).bindPopup('<div class="popup-content"></div>');
					setTimeout(function() {
						popup.openPopup();
					}, 1);					
				})
			// network.SVG.edges
			// 	.attr("d", function(d, i) {
			// 		var sourceNode = d3.select(network.SVG.nodes.filter(".id" + d.source).node());
			// 		var targetNode = d3.select(network.SVG.nodes.filter(".id" + d.target).node());
			// 		console.log(sourceNode);
			// 		return Utilities.lineFunction([{
			// 			"x": sourceNode.attr("cx"),
			// 			"y": sourceNode.attr("cy")
			// 		}, {
			// 			"x": targetNode.attr("cx"),
			// 			"y": targetNode.attr("cy")
			// 		}])
			// 	})

		}
	}
	return network;
}
