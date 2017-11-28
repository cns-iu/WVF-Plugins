visualizationFunctions.AngularTable = function(element, data, opts) {
	var network = visualizations[opts.ngIdentifier];
	network.parentVis = visualizations[opts.ngComponentFor];
	network.config = network.CreateBaseConfig();
	network.meta = network.config.meta;
	network.VisFunc = function() {

		Utilities.runJSONFuncs(network.config.meta, [data, network.config]);
		var headerString = "";
		var labelString = "";
		network.config.meta.table.attributes.forEach(function(d, i) {
			headerString += createDOMString(d.prettyLabel, 'th st-sort="' + d.attr + '"', "th")
			var formatString = d.attr;
			if (d.format != '' && d.format != null) {
				formatString += ' | ' + d.format
			}
			labelString += createDOMString('{{row.' + formatString + '}}', 'td class="' + d.attr + '"')
		})

		function createDOMString(data, elempre, elempost) {
			if (!elempost) {
				elempost = elempre
			}
			return "<" + elempre + ">" + data + "</" + elempost + ">";
		}

		var $injector = angular.injector(['ng', 'app']);
		$injector.invoke(function($rootScope, $compile) {
			var container = document.createElement("div");
			container.id = "table-container";
			container.className += "table-container"
			var string = '<div id="' + opts.ngIdentifier + '-table" class="angular-table table-container" ng-controller="basicCtrl">'
			string += '	<table ng-bind-html-unsafe=true st-set-filter="myFilter" st-table="displayedCollection" st-safe-src="rowCollection" class="table table-striped">'
			string += '		<thead>'
			string += '		<tr>'
			string += headerString
			string += '		</tr>'
				//Global search
			if (network.config.meta.table.globalSearch) {
				string += '	<tr style="display:none"><th colspan="5" ><input style="widht:0px;height:0px" st-input-event="input" id="qwertyasdf" value="" st-search="" class="form-control" placeholder="global search ..." type="text"/></th></tr>'
			}
			string += '		</thead>'
			string += '		<tbody>'
			string += '		<tr ng-repeat="row in displayedCollection">'
			string += labelString
				//Remove button
			if (network.config.meta.table.removeRow) {
				string += '		<td>'
				string += '			<button type="button" ng-click="removeItem(row)" class="btn btn-sm btn-danger">'
				string += '				<i class="glyphicon glyphicon-remove-circle"></i>'
				string += '			</button>'
				string += '		</td>'
			}
			string += '		</tr>'
			string += '		</tbody>'
			string += ' 	<tfoot>'
				//Pagination
			if (network.config.meta.table.pagination > 0) {
				string += ' 	<tr>'
				string += ' 		<td colspan="5" class="text-center">'
				string += ' 			<div st-pagination="" st-items-by-page="itemsByPage" st-displayed-pages="10"></div>'
				string += ' 		</td>'
				string += ' 	</tr>'
			}
			string += ' 	</tfoot>'
			string += '	</table>'
			string += '</div>'
			$(container).html($compile(string)($rootScope));
			$(element).append(container);
			$rootScope.$apply(function() {
				$rootScope.$$childHead.setrowCollection(network.filteredData.records.data);
			});

			network.applyFilter = function(val) {
				$rootScope.$apply(function() {
					angular.element('#' + opts.ngIdentifier + '-table').scope().filter(val);
				})

				// events[network.ngIdentifier](network);
			}
		});
	}
	return network;
}
