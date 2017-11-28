
### Description
* The visualization creates a collapsible tree similar to [d3 collapsible tree](https://bl.ocks.org/mbostock/4339083) on which it is based.
* The data specific rendering is done through callbacks in the configuration.
* The visualization expects it's data to be put on the `context.data` property.

### Data Format
```javascript
"node": {
  "children": ["[node]"],
  ...
}
```

### Configuration Format
```javascript
{
  "direction": "[string]",

  "nodes": {
    "callbacks": {
      "sorter": "[function]",
      "renderer": "[function]",
      "beforeUpdate": "[function]",
      "afterUpdate": "[function]"
    }
  },

  "links": {
    "callbacks": {
      "renderer": "[function]",
      "beforeUpdate": "[function]",
      "afterUpdate": "[function]"
    }
  },

  "visualization": {
    "callbacks": {
      "beforeUpdate": "[function]",
      "afterUpdate": "[function]"
    }
  }
}
```
