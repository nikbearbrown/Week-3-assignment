const size = {w: 350, h: 300};

// contains the full xvarilne
const xvarSVG = d3.select('svg.xvar');
// contains the detailed bar chart
const mapSVG = d3.select('svg.map');

// defining a container group
// which will contain everything within the SVG
// we can transform it to make things everything zoomable
const xvarG = xvarSVG.append('g').classed('container', true);

   // --------- DRAW MAP ----------
    // creating a group for map paths
const mapG = mapSVG.append('g').classed('container', true);


// const mapG = mapSVG.append('g').classed('container', true);

// defining all the required variables as global
let df_bar, df_map, topo,
    mapScaleX, mapScaleY,
    xvarScaleX, xvarScaleY,
    xvarBrush, arrivalBrush, filters = {};


// setting width and height of the SVG elements
xvarSVG.attr('width', size.w)
    .attr('height', size.h);

mapSVG.attr('width', size.w)
    .attr('height', size.h);

// loading our data
// xvar	delay	number_films	origin	destination
// xvar type

Promise.all([
    d3.csv('data/netflix_titles_releaseYear.csv'),
    d3.csv('data/netflix_titles_by_country.csv'),
    d3.json('data/map/world.geo.json')
]).then(function (datasets) {
    // processing data a bit to calculate xvars and change strings to numbers
    df_bar = datasets[0].map((row, i) => {
        row.year = +row.year;
        row.number_films = +row.number_films;        
        return row;
    });

   // console.log(df_bar[0]);

    drawBarChart(df_bar);
    //

    df_map = datasets[1].map((row, i) => {
        // row.code = row.code;
        row.number_films = +row.number_films;        
        return row;
    });


  //  console.log(df_map[0]);

    topo = datasets[2];

    //  console.log(df_topo);

    let pathSelection = drawMap(topo, mapSVG, size);    

    choroplethiseMap(pathSelection, df_map);  



});



// DRAW BAR CHART for xvar
function drawBarChart(data = df) {
  //  data = d3.group(data, d => d.year);
    data = Array.from(data);
    data = data.sort();   
    let x=[1925,1942,1943,1944,1945,1946,1947,1954,1955,1956,1958,1959,1960,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021];
    let y=[1,2,3,3,3,2,1,2,3,2,3,1,4,3,2,1,2,1,5,5,2,2,5,4,10,7,6,9,7,6,11,9,9,15,9,9,9,10,7,16,13,20,17,18,22,16,19,19,30,31,33,34,36,45,49,59,73,85,85,125,137,173,166,219,267,334,541,882,1012,1121,996,868,31];    
    // console.log(y);  
    
    //  console.log(data);
    // console.log(data);    
    // console.log(data[0].xvar);  
    // console.log(data[0].number_films);       
   // console.log(data[0][1][1]);           
   // console.log(typeof(data[0]));

   if (!xvarScaleX) {
    xvarScaleX = d3.scaleBand()
        .padding(0.2)
        .domain(d3.extent(x))
        .domain(data.map(d => {
          //  console.log(d.year);
            return d.year;}))
        .range([0, size.w]);
}
  
if (!xvarScaleY) {
    xvarScaleY = d3.scaleLinear()
        .domain(d3.extent(y))
        .range([size.h, 0]);
}


// console.log(data);

xvarG.selectAll('rect')
.data(data)
.join('rect')
.transition()
.duration(0.5)
.attr('width', xvarScaleX.bandwidth())
.attr('height', d => {
    // console.log(d.number_films);   
    return size.h - xvarScaleY(d.number_films);})
 .attr('x', d => {
     // console.log(d.year);  
     // console.log(xvarScaleX(d.year));               
      return xvarScaleX(d.year);

  })
  .attr('y', d => {
    // console.log(d.number_films);  
    // console.log(xvarScaleY(d.number_films));               
    return xvarScaleY(d.number_films);

})


 let x_axis = d3.axisBottom(xvarScaleX);

 xvarG.append("g") 
 .attr("transform", "translate(25,295)") 
 .call(x_axis);




};  


function drawMap (mapData, ele, sz) {
// Map and projection
let path = d3.geoPath();

const newLocal = d3.geoMercator()
.fitSize([sz.w, sz.h], df_map);
let projection = newLocal;

let geoPath = d3.geoPath(projection);

// console.log(mapData.features);

let pathSelection = ele.selectAll('path')
.data(mapData.features)
.enter()
.append('path')
.attr('id', (d) => d.properties.brk_a3)
.attr('d', (d) => { d3.geoPath();
  //  console.log(d);  
});


// returning the path selection (d3 selection)
// for other functions to utilise the geo-data attached 
return pathSelection;



// console.log(mapData);

}


function choroplethiseMap (pathSelection, data) {

    // creating a color scale to translate
    // pctChange age to respective colors
    const colorScale = d3.scaleSequential()
        // the domain is the [min, max] pctChange age
        .domain(d3.extent(data, d => +d.number_films))
        // the range is the color-gradient from yellow-green-blue
        .interpolator(d3.interpolatePuRd);

    // time to fill the SVG path of the region with respective color
    pathSelection.style('fill', function(d) {
        // each path is related to a geographic region
        // we are filtering out the region's life expectancy data
       // console.log(data[0])
        let region = data.filter(e => e.code === d.properties.brk_a3);
        // this returns an array
        // if pctChange data exists for a region, the array will be non-empty
        if (region.length > 0) {
            // pctChange is measured for that region
            region = region[0];
            // translate pctChange to color
            return colorScale(region.number_films);
        }

        // if no data exists, we return a light grey
        return '#43464B';
    })
};

