const size = {w: 100, h: 100};
const offest = {w: 50, h: 50};

// The svg
let svg = d3.select("svg.map"),
  width = size.w,
  height = size.h;


// Map and projection
let path = d3.geoPath();


let projection = d3.geoMercator();

// Data and color scale
let data = d3.map();
let colorScale = d3.scaleThreshold()
  .domain([5, 10, 25, 50, 100, 250, 1000, 2500])
  .range(d3.schemeBlues[7]);

// Load external data and boot
d3.queue()
  .defer(d3.json, 'data/map/world.geo.topo.json')
  .defer(d3.csv, "data/netflix_titles_by_country.csv", function(d) { data.set(d.code, +d.number_films); })
  .await(ready);

function ready(error, topo) {


  console.log(topo.features);
  
  // Draw the map
  svg.append("g")
    .selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
      // draw each country
      .attr("d", d3.geoPath()
        .projection(projection)
      )
      // set the color of each country
      .attr("fill", function (d) {
        d.total = data.get(d.id) || 0;
        return colorScale(d.total);
      });
    }
