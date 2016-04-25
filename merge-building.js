var util = require("josm/util");
var cmd = require("josm/command");

var data = {
    "building": true
};

console.clear();

var results = [];
var all_nodes = [];
var layer;
var ds;
mergedBuildings = [];

function buildings() {
	layer = josm.layers.activeLayer;
    if (layer == null) return;
    ds = layer.data;
    results = ds.query("building=*");
    console.print("number of buildings" + results.length);
    console.print(results[0]['nodes'][1]);

}

buildings();
get_nodes();
sort_nodes();
//debug_nodes();

process_nodes();

select_buildings();

function debug_nodes() {
	for (var i = 0; i < all_nodes.length; i++) {
		console.print(all_nodes[i]['id']+"\n");
	}
}


function get_nodes() {
 for (var i = 0; i < results.length; i++) {
 	for (var k = 0; k < results[i]['nodes'].length; k++) {
 		all_nodes.push({
 			id : results[i]['nodes'][k]['id'],
 			buildingIdx : i,
 			valid : true
 		})
 	}
 }
}

function sort_nodes() {
	all_nodes.sort(function(a, b){
	    var keyA = a['id'],
	        keyB = b['id'];

	    if(keyA < keyB) return -1;
	    if(keyA > keyB) return 1;
	    return 0;
	});
}

function process_nodes() {
	for (var i = 0; i < all_nodes.length; i++) {
		all_nodes[i];
		if (i != all_nodes.length - 1) {
			if (all_nodes[i]['valid'] && all_nodes[i+1]['valid']) {
				if (all_nodes[i]['id'] == all_nodes[i+1]['id'] && all_nodes[i]['buildingIdx'] != all_nodes[i+1]['buildingIdx']) {
					merge_buildings(all_nodes[i]['buildingIdx'], all_nodes[i+1]['buildingIdx']);
				}
			}
		}
	}
}

function merge_buildings(a,b) {
	var buildingA = results[a];
	var buildingB = results[b];
	console.print("Matching building ids "+a+" -- "+b);
	console.print(buildingA.tags);
	console.print("\n");
	console.print(buildingB.tags);
	console.print("\n");

	// ABCD - buildingA
	// ABCCDD - all_nodes
	// ABCD - result
	for (var i = 0; i < buildingA['nodes'].length; i++) {
		
		var count = 0;
		
		for (var j = 0; j < all_nodes.length; j++) {
			
			if(all_nodes[i]['valid']) {
				if (buildingA['nodes'][i]['id'] == all_nodes[j]['id']) {
					count ++;
					if (count == 2) {
						console.print(buildingA['nodes'][i]['id'] + " " + all_nodes[j]['id']+"\n");
						all_nodes[j]['valid'] = false;		
					}
				}
			}
		}
	}

	if(building_area(buildingA)>=building_area(buildingB)) {
		// copy b tags into a
		copy_tags(buildingB, buildingA);
	}
	else {
		// copy a tags into b
		copy_tags(buildingA, buildingB);
	}

	mergedBuildings.push(buildingA, buildingB);
}

function copy_tags(buildingFrom, buildingTo) {

	for (var tagName in buildingFrom.tags) {

  		if (buildingFrom.tags.hasOwnProperty(tagName)) {
    		buildingTo['tags'][tagName] = buildingFrom['tags'][tagName];
  		}
	}
}

function building_area(building)  { 
	var X = [];
	var Y = [];
	var numPoints = building['nodes'].length;

	for (var i = 0; i < numPoints; i++) {
		X.push(building['nodes'][i]['lat']);
		Y.push(building['nodes'][i]['lon']);
		
	}
	area = 0;  // Accumulates area in the loop   
	j = numPoints-1;  // The last vertex is the 'previous' one to the first

	for (i=0; i < numPoints; i++) { 
		area = area +  (X[j]+X[i]) * (Y[j]-Y[i]); 
		j = i;  //j is previous vertex to i
	}   
  	return area/2; 
}

function select_buildings() {
	ds.$setSelected(mergedBuildings);
	josm.alert('Please go to tools-> Join overlapping areas to merge areas!');
	
}
