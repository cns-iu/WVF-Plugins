# Expected Data Format

### Description
* The visualization processes records into rows to display as a table.

### Data Format 
```javascript
"records": [{
	"key": "[string, number, boolean]",
	...
}]

```

### Config Format
```javascript
{
		"styleEncoding": {
			"size": {
				"attr": "[string]",
				"scale": "[linear, log]" //optional. Defines the scale type. Defaults to linear. 
			},
			"size2": {
				"attr": ["number"] //optional. Unused. Can be set as a hard value to define the static dimension of a bar. 
			},
			"color": {
				"attr": "[string]",
				"range": ["[string]"] //optional. Must be a minimum of two values. Will use the attr color.attr property to fill in bars on the defined scale. 
			}
		},
		"identifier": {
			"attr": "[string]" //Unique identifier
		}
	},
	"labels": {
		"styleEncoding": {
			"attr": "[string]", //optional. Attribute to determine what to apply the displayTolerance on. 
			"displayTolerance": "[number]" //Filters out x-percentile of bars. 0 = no filtering, 90 = only top 10-percentile will be shown.
		},
		"identifier": {
			"attr": "[string]"
		}
	}
```
