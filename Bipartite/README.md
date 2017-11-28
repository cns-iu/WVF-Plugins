# Expected Data Format

### Description
* The visualization separates the bipartiteType field and appends nodes on the left or right based on the value. Paths link left and right nodes. 

### Data Format 
```javascript
"nodes": [{
	"bipartiteType": "[string]",
	"id": "[number]",
	"label": "[string, number]",
	...
}],
"edges": [{
	"source": "[number]",
	"target": "[number]",
	"id": "[number]",
	...
}]
```

### Config Format
```javascript
	{
        "bipartite": {
    		"left": "[string]",
    		"right": "[string]",
    		"field": "[string]"
	    }	
	}
```