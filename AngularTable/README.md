# Expected Data Format

### Description
* The visualization processes records into rows to display as a table.

### Data Format 
```javascript
"nodes": [{
	"key": "[string, number, boolean]",
	...
}]
```

### Config Format
```javascript
	{
		"table": {
			"attributes": [{
				"prettyLabel": "[string]",
				"attr": "[string]",
				"format": "[currency, number, etc (VERIFY)]" //optional
			}],
			"pagination": "[number]", //optional. If -1, deactivates pagination. Will be set to however may items per page. Feature not implemented yet.
			"globalSearch": "[boolean]", //optional. Adds row for search option if true.
			"removeRow": "[boolean]" //optional. Adds option to remove each row. Dev feature currently. 
		}
```