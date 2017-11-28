# Visualization Description
The Heatmap visualization aggregates data in two levels, which translate to rows and columns. Each cell represents an intersection between a column and a row. In the middle of the cell, text displays the value for that intersection. The cells may also use fill colors to represent another metric.

On the bottom and right of the Heatmap grid are two bar graphs. Each bar represents a total sum of the values in the respective row/column. 

# Expected data format

### Description
* The visualizations aggregates data points into cells. 
* Cells are laid out in rows and columns where each axis maps a different metric.
* Flat data can be aggregated into columns. 
* Data in each column is then aggregated again to produce rows. 
* **Hint:** d3.nest() is very useful to easily obtain this format. Use it first to aggregate the column values. Then iterate through each column and aggregate it's children. 
* **Note:** Some combinations of row and column aggregates do not exist (ex: for columns a,b,c with possible rows 1,2,3...the combination of a->1 may not exist. This will result in blank cells. This may need to be handled in the dataprep step depending on the solution).

### Data Format 
```javascript
"records": ["0": {
	"key": [{ //Column value
		"0": {
			"key": "[string]", //Row value
			"values": {
				"aggVal": "[number]", //Any numerical values representing a sum/avg/etc of the aggregated values
				"children": ["[object]"] //Contains each raw data object that contribute to the aggregation
			}
		}
	}],
	"key": "[string]",
	"values": {
		"aggVal": "[number]", //Any numerical values representing a sum/avg/etc of the aggregated values
		"children": ["[object]"] //Contains each raw data object that contribute to the aggregation
	}
}]

```

### Config Format 
```javascript
{
	"records": {
		"rowAggregator": "[string]",
		"colAggregator": "[string]"
	},
	"styleEncoding": {
		"gridOffsetX": ["[number]"],
		"gridOffsetY": ["[number]"],
		"barOffset": "[number]"
	},
	"labels": {
		"xAxis": "[string]",
		"yAxis": "[string]"
	}
}

```
