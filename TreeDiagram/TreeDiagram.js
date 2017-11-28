visualizationFunctions.TreeDiagram = function(element, data, opts) {
    var context = this;
    context.VisFunc = function() {
    	function nestData() {
    		var nestedData = context.filteredData.records.data;
    		nestedData.forEach(function(d, i) {
    			d.children = [];
    			if (d[context.config.meta.visualization.parent] == "") d[context.config.meta.visualization.parent] = null;
    		})
    		nestedData.forEach(function(d, i) {
    			//Find is more than twice as fast as filter.
    			var parent = nestedData.find(function(d1, i1) {
    				return d[context.config.meta.visualization.parent] == d1[context.config.meta.visualization.name];
    			})
    			if (parent) {
    				parent.children.push(d);
    			}
    		})
    		return nestedData;
    	}

        context.collapseByDefault = function() {
        	context.nestedData.forEach(function(d, i) {
        		d._children = d.children;
        		d.children = null;
        	})
			context.SVG.update(root);
        }

        context.collapseDepth = function(depth) {
        	context.nestedData.filter(function(d, i) {
        		return d.depth >= depth;
        	}).forEach(function(d, i) {
        		d._children = d.children;
        		d.children = null;
        	})
        	context.SVG.update(root);
        }

        context.SVG.update = function(source) {

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(),
                links = tree.links(nodes);

            // Normalize for fixed-depth.
            nodes.forEach(function(d) { d.y = d.depth * 180; });

            // Update the nodes…
            context.SVG.nodeG = context.SVG.selectAll("g.wvf-node")
                .data(nodes, function(d) {
                    return d.id || (d.id = ++i); });

            // Enter any new nodes at the parent's previous position.
            var nodeEnter = context.SVG.nodeG.enter().append("g")
                .attr("class", "wvf-node")
                .attr("transform", function(d) {
                    return "translate(" + source.y0 + "," + source.x0 + ")"; })

                .on("click", click);

            nodeEnter.append("circle")
                .attr("r", 1e-6)
                .style("fill", function(d) {
                    return d._children ? "lightsteelblue" : "#fff"; });


            // Transition nodes to their new position.
            var nodeUpdate = context.SVG.nodeG.transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + d.y + "," + d.x + ")"; });

            nodeUpdate.select("circle")
                .attr("r", 10)
                .style("fill", function(d) {
                    return d._children ? "lightsteelblue" : "#fff"; });

            // Transition exiting nodes to the parent's new position.
            var nodeExit = context.SVG.nodeG.exit().transition()
                .duration(duration)
                .attr("transform", function(d) {
                    return "translate(" + source.y + "," + source.x + ")"; })
                .remove();

            nodeExit.select("circle")
                .attr("r", 1e-6);

            nodeExit.select("text")
                .style("fill-opacity", 1e-6);

            // Update the links…
            context.SVG.edgeG = context.SVG.selectAll("path.wvf-edge")
                .data(links, function(d) {
                    return d.target.id; });

            // Enter any new links at the parent's previous position.
            context.SVG.edgeG.enter().insert("path", "g")
                .attr("class", "wvf-edge")
                .attr("d", function(d) {
                    var o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                });

            // Transition links to their new position.
            context.SVG.edgeG.transition()
                .duration(duration)
                .attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            context.SVG.edgeG.exit().transition()
                .duration(duration)
                .attr("d", function(d) {
                    var o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                })
                .remove();

            // Stash the old positions for transition.
            nodes.forEach(function(d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });
        }

        // Toggle children on click.
        function click(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            context.SVG.update(d);
        }

    	context.nestedData = nestData();

        var margin = { top: 20, right: 120, bottom: 20, left: 120 },
            width = context.config.dims.fixedWidth - margin.right - margin.left,
            height = context.config.dims.fixedHeight - margin.top - margin.bottom;

        var i = 0,
            duration = context.config.meta.visualization.animationDuration,
            root;
        var tree = d3.layout.tree()
            .size([height, width]);

        var diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x]; });

        root = context.nestedData[0];
        root.x0 = height / 2;
        root.y0 = 0;

        if (context.config.meta.visualization.collapseByDefault) {
        	context.collapseByDefault();
        } else {
        	context.SVG.update(root);	
        }

    }

    this.configSchema = {
        visualization: {
            name: "name",
            parent: "parent",
            animationDuration: 0,
            collapseByDefault: false
        }
    }
    this.config = this.CreateBaseConfig();
    context.SVG = context.config.easySVG(element[0])

    return context;
}
