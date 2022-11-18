// Most of this code is taken from us unemployment handout
// which can be found here https://canvas.ucsc.edu/courses/57207/files/folder/Programming%20Assignments/Assignment7/US-Unemployment

// setting up svg canvas
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// map used later for mapping density to id
var rateById = d3.map();
var idToCounty = d3.map();
var idToState = d3.map();

// d3.scaleThreshold() maps continuous inputs to discrete regions
// u < 50, 50 <= u < 100, 100 <= u 200, where u is the input
// d3.schemeOrRd() allows us to use certain color schemes given the amount
// of colors that we want, in this case we want 9 colors from the OrRd scheme
let curColor = "red";
var color = d3.scaleThreshold()
    .domain([1, 10, 25, 50, 100, 200, 500, 1000])
    .range(d3.schemeOrRd[9]);

// x domain and range of legend
var x = d3.scaleSqrt()
    .domain([0, 1500])
    .rangeRound([440, 1000]);
    
// legend formatting and position
var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(-50,600)");

g.selectAll("rect")
  .data(color.range().map(function(d) {
      d = color.invertExtent(d);
      if (d[0] == null) d[0] = x.domain()[0];
      if (d[1] == null) d[1] = x.domain()[1];
      return d;
    }))
  .enter().append("rect")
    .attr("height", 8)
    .attr("x", function(d) { return x(d[0]); })
    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
    .attr("fill", function(d) { return color(d[0]); });

g.append("text")
    .attr("class", "caption")
    .attr("x", x.range()[0])
    .attr("y", -6)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("Population density");

g.call(d3.axisBottom(x)
    .tickSize(13)
    .tickValues(color.domain()))
  .select(".domain")
    .remove();

// projection used for projecting spherical maps onto flat images
// ie earth to flat computer screen
var projection = d3.geoAlbersUsa()
    .scale(4000)
    .translate([width * 1.4, height / 1.5]);

// d3.geoPath() translates geoJson files into svg paths
// .projection() defines the type of projection ie project
// spherical distorted image of the us onto a flat surface
var path = d3.geoPath()
    .projection(projection);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// d3.queue() runs asynchronous tasks independently and when finished
// executes the function within the .await() callback
// is this case we load the us json file and the population density csv file
d3.queue()
    .defer(d3.json, "us-10m.json")
    .defer(d3.csv, "Population-Density-By-County.csv", function(d) {rateById.set(d.id, +d.density), idToCounty.set(d.id, d.county_name), idToState.set(d.id, d.state_name);})
    .await(ready);

let stateFilter;
function ready(error, us) {
  if (error) throw error;
    
  svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
        // this function determines if the current data piece we are looking
        // belongs to nevada based on the first two digits of its id
        // if so then we get the correct color based on the data
        // if not the we set the color fo the county to grey
      .attr("fill", function(d) {return verifyNevada(d) ? color(rateById.get(d.id)) : "none"})
        // stroke of the county is also determined by the same function
      .attr("stroke", function(d) {return verifyNevada(d) ? color(rateById.get(d.id)) : "none"})
      .attr("d", path)
      .on("mouseover", function(d) {  
        tooltip.style("opacity", 1)
            .style("left", d3.event.pageX + 25 + "px")
            .style("top", d3.event.pageY - 20 + "px");
        tooltip.html(idToState.get(d.id) + "<br>" + "County Name:   " + idToCounty.get(d.id) + "<br>" + "Population Density :           " + rateById.get(d.id));
        })
      .on("mouseout", function(d) {
        tooltip.style("opacity", 0);
        });
    
    // draw states
  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path);
}

// changeColorScheme() looks at the current color scheme of the visualization
// and changes it, it then updates the color of the counties and their strokes
// it then updates the colors associated with the legend
function changeColorScheme(){
    if(curColor == "red"){
        curColor = "blue";
        color.range(d3.schemeBlues[9]);
    }
    else if(curColor == "blue"){
        curColor = "red";
        color.range(d3.schemeOrRd[9]);
    }
    // update color of counties
    svg.selectAll("path")
        .attr("fill", function(d) {return verifyNevada(d) ? color(rateById.get(d.id)) : "none"; });
    // if county outlines are not on then update stroke 
    // color of counties to be correct based on new color scheme
    if(!toggled){
        svg.selectAll("path")
            .attr("stroke", function(d) {return verifyNevada(d) ? color(rateById.get(d.id)) : "none"; });
    }
    // change legend colors
    g.selectAll("rect")
        .attr("fill", function(d) { return color(d[0]); });
}

// function that looks at current outline color and decides if we should
// hide the outline by setting stroke to light grey
// or if we should display the outline  by setting the stroke color to none
let toggled = false;
function toggleOutlines(){
    svg.selectAll("path")
        .attr("stroke", function(d){
            if(verifyNevada(d)){
                return toggled ? color(rateById.get(d.id)) : "black";
            }
        })
    toggled = toggled ? false : true;
}

function verifyNevada(d){
    return (d.id != undefined && d.id.toString()[0] == "3" && d.id.toString()[1] == "2") ? true : false;
}