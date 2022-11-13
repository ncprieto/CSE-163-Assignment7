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

// something about scaleThreshold
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
    .attr("transform", "translate(0,620)");

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
    .scale(1280)
    .translate([width / 2, height / 2.25]);

var path = d3.geoPath()
    .projection(projection);

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
    
d3.queue()
    .defer(d3.json, "us-10m.json")
    .defer(d3.csv, "Population-Density-By-County.csv", function(d) {rateById.set(d.id, +d.density), idToCounty.set(d.id, d.county_name), idToState.set(d.id, d.state_name);})
    .await(ready);

function ready(error, us) {
  if (error) throw error;
    
    // draw counties
  svg.append("g")
      .attr("class", "counties")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
        // this function determines if the current data piece we are looking
        // belongs to nevada based on the first two digits of its id
        // if so then we get the correct color based on the data
        // if not the we set the color fo the county to grey
      .attr("fill", function(d) {return (d.id.toString()[0] == "3" && d.id.toString()[1] == "2") ? color(rateById.get(d.id)) : "#D3D3D3"; })
        // stroke of the county is also determined by the same function
      .attr("stroke", function(d) {return (d.id.toString()[0] == "3" && d.id.toString()[1] == "2") ? color(rateById.get(d.id)) : "#D3D3D3"; })
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
        .attr("fill", function(d) {return (d.id != undefined && d.id.toString()[0] == "3" && d.id.toString()[1] == "2") ? color(rateById.get(d.id)) : "#D3D3D3"; });
    // if county outlines are not turned off then update stroke 
    // color of counties to be correct based on new color scheme
    if(svg.selectAll("path").attr("stroke") != "none"){
        svg.selectAll("path")
            .attr("stroke", function(d) {return (d.id != undefined && d.id.toString()[0] == "3" && d.id.toString()[1] == "2") ? color(rateById.get(d.id)) : "#D3D3D3"; });
    }
    // change legend colors
    g.selectAll("rect")
        .attr("fill", function(d) { return color(d[0]); });
}

// function that looks at current outline color and decides if we should
// hide the outline by setting stroke to light grey
// or if we should display the outline  by setting the stroke color to none
function toggleOutlines(){
    let newStroke;
    if(svg.selectAll("path").attr("stroke") != "none"){
        newStroke = "none";
    }
    else{
        newStroke = function(d) {return (d.id != undefined && d.id.toString()[0] == "3" && d.id.toString()[1] == "2") ? color(rateById.get(d.id)) : "#D3D3D3"; }
    }
    svg.selectAll("path").attr("stroke", newStroke);
}

// references
// https://bl.ocks.org/Fil/0bf58d23011ab244c657a1262bcbe4b2 (for color scheme)