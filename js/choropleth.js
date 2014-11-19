var lineGraphSpacing = 20.0;

var summary = {};
                /*"min_year"      : 2004, 
                  "max_year"      : 2009,Name 
                  "min_avg_wage"  : 12000, 
                  "max_avg_wage"  : 90000, 
                  "min_avg_agi"   : 20, 
                  "max_avg_agi"   : 130000, 
                  "min_avg_div"   : 30, 
                  "max_avg_div"   : 200000, 
                  "min_avg_int"   : 2000, 
                  "max_avg_int"   : 142000};*/



var dimNames = { "avg_wage"  : "Average Wages",
                  "avg_agi"   : "Average Adjusted Gross Income",
                  "avg_div"   : "Average Dividends",
                  "avg_int"   : "Average Interest" };

var fills = { 
  'avg_agi' : 'Greens',
  'avg_wage': 'Blues',
  'avg_int' : 'Purples',
  'avg_div' : 'Oranges',
};
  
var years = _.keys(summary_data);
//console.log(years);
var dims = ['avg_agi','avg_wage','avg_int','avg_div'];

function summarize() { 
  summary["min_year"] = years[0];
  summary["max_year"] = years[years.length-1];
  for (j in dims) {
    var dim = dims[j];
    var max = 0;
    var min = 9999999;
    for (d in county_data) {
      var datum = county_data[d];
      for (y in years) {
        var yr = years[y];
        try {
          var val = datum['data'][yr][dim];
          if (val > max){
            max = val;
          }
          if (val != null && val < min){
            min = val;
          }
        } catch(e) {
          // no op
          // console.log(e);
        }
      }
    }
    summary['min_'+dim] = min;
    summary['max_'+dim] = max;
  }
}

summarize();

var multiples = { 'avg_agi'  : 1000,
                  'avg_wage' : 1000,
                  'avg_div'  : 100,
                  'avg_int'  : 100 };

var nDims = _.keys(fills).length;



function initScales(county_data) {
  var quantScales = {};
  var yearScales = {};
  yearValues = {};
  for (var y in years) {
    yearValues[years[y]] = {'avg_agi':[],'avg_wage':[],'avg_div':[],'avg_int':[]};
    yearScales[years[y]] = {};
  }
  for (var i in dims) {
    var dim = dims[i];
    values = [];
    for (var k in county_data) {
      for (var j in years){
        try {
          var val = county_data[k]['data'][years[j]][dim];
        } catch (e) {
          //console.log(k+' ('+years[j]+'): not found');
        }
        if (val != null && val > 0) {
          values.push(val);
          yearValues[years[j]][dim].push(val);
        } else {
          continue;
          //console.log('not including value '+val);
        }
      }
    }
    //var q = d3.scale.quantile().domain(values).range([0,1,2,3,4]);
    var values = values.sort(d3.ascending);
    var quantiles = makeQuantiles(values,dim,[0,.2,.4,.6,.8,.9,.95,.99]);
    var threshes = [];
    var qkeys = _.keys(quantiles);
    for (var key=1;key<qkeys.length;key++) {
      threshes.push(quantiles[qkeys[key]].lower_threshold);
    }
    //console.log(threshes);
    quantScales[dim] = { 'fct'       : d3.scale.threshold().domain(threshes).range([0,.2,.4,.6,.8,.9,.95,.99]),
                         'quantiles' : quantiles };
    for (var a in years){
      var yrvals = yearValues[years[a]][dim].sort(d3.ascending);
      var yrquantiles = makeQuantiles(yrvals,dim,[0,.2,.4,.6,.8,.9,.95,.99]);
      var yrthreshes = [];
      //console.log(dim+','+years[a]+':');
      var yrqkeys = _.keys(quantiles);
      for (var yrkey=1;yrkey<yrqkeys.length;yrkey++) {
        yrthreshes.push(yrquantiles[yrqkeys[yrkey]].lower_threshold);
      }
      //console.log(yrthreshes);
      yearScales[years[a]][dim] = {
        'fct' : d3.scale.threshold().domain(yrthreshes).range([0,.2,.4,.6,.8,.9,.95,.99]),
        'quantiles' : yrquantiles };
    }
  }
  var scales = [quantScales,yearScales];
  return scales;
};

function makeQuantiles(values,dim,probs) {
  //valueSet = _.map(values,function(n) { return mround(n,multiples[dim]);});
  var valueSet = values;
  quantiles = {}
  min = 0
  lastSize = 0
  for (var i=0;i<(probs.length - 1);i++) {
    prob_lo = probs[i];
    prob_hi = probs[i+1]
    val_hi = d3.quantile(valueSet,prob_hi);
    val_lo = d3.quantile(valueSet,prob_lo);
    newLastSize = _.sortedIndex(values,val_hi);
    currSize = newLastSize - lastSize;
    //console.log(currSize);
    quantiles[prob_lo] = { upper_threshold : val_hi,
                        lower_threshold : val_lo,
                        size            : currSize };
    lastSize = newLastSize;
  }
  last = _.last(probs);
  currSize = values.length - _.sortedIndex(values,d3.quantile(valueSet,last));
  quantiles[last] = { upper_threshold : Infinity,
                      lower_threshold : d3.quantile(values,last),
                      size            : currSize };
  return quantiles;
}

scales = initScales(county_data);
quantScales = scales[0];
yearScales = scales[1];

colorScale = { 0   : 'q0-8',
               .2  : 'q1-8',
               .4  : 'q2-8',
               .6  : 'q3-8',
               .8  : 'q4-8',
               .9  : 'q5-8',
               .95 : 'q6-8',
               .99 : 'q7-8' };

function scaleDim() {
  qs = quantScales[globalDim];
  var scale_out = function(val) {
      quantile = qs.fct(val);
      return colorScale[quantile];
  };
  return scale_out;
}

function updateYearScale() {
  qs = yearScales[globalYear][globalDim];
  var scale_out = function(val) {
    quantile = qs.fct(val);
    return colorScale[quantile];
  };
  return scale_out;
}

// GLOBAL VARS
var globalYear = 2004;
var globalDim = 'avg_agi';
var globalScale = updateYearScale();
//var yearScale = yearScaleDim();
var globalZoom = 1;
var globalPanX = 0;
var globalPanY = 0;
var centered;
var zoomRefX = 0;
var zoomRefY = 0;
var zoomRefK = 1;


function makeTransformString(k,x,y) {
  var k = k || globalZoom;
  var x = x || globalPanX;
  var y = y || globalPanY;
  return "scale("+k+") translate("+x+","+y+")";
}

function clickZoom(d) {
  container = d3.select("#mapContainer");

  var x = (parseInt(d3.select("#rightSide").style("width"))/2),
      y = (parseInt(d3.select("#map").style("height"))/2),
      k = 1;

  zoomRefX = 0;
  zoomRefY = 0;
  zoomRefK = k;

  if (d && centered !==d) {
    //console.log('getting centroid');
    hideTooltip();
    d3.select('#lockedtip').remove();
    var centroid = path.centroid(d);
    //console.log(d);
    //console.log('centroid is '+centroid);
    k = 10;
    zoomRefK = 10;
    x = -centroid[0] + ((mapWidth / 2) / k);
    y = -centroid[1] + ((mapHeight / 2) / k);
    zoomRefX = centroid[0]
    zoomRefY = centroid[1]
    //console.log('k is now 4');
    centered = d;
    d3.select('#resetZoomButton').style("visibility","visible");
    countyName = county_data[d.id]['name'];
    stateName = county_data[d.id]['state'];
    d3.select('#areaShown').text('for '+countyName+', '+stateName);
    showLockedTooltip(d);
    focusSidebar(d);
  } else {
    //console.log('null centered because d was null or centered === d');
    centered = null;
    d3.select('#lockedtip').remove();
    d3.select('#resetZoomButton').style("visibility","hidden");
    d3.select('#areaShown').text('nationally');
    unFocusSidebar();
  }

  counties.selectAll("path")
   .classed("active",centered && function(d) { return d === centered; });

  d3.select("#mapContainer").transition()
                            .duration(1000)
                            .attr("transform",makeTransformString(k,x,y));

}

function resetZoom() {
  centered = null;
  d3.select('#areaShown').text('nationally');
  d3.select('#lockedtip').remove()
  var x = (parseInt(d3.select("#rightSide").style("width"))/2),
      y = (parseInt(d3.select("#map").style("height"))/2);

  zoomRefX = 0;
  zoomRefY = 0;
  zoomRefK = 1;

  d3.select("#mapContainer").transition()
                            .duration(1000)
                            .attr("transform",makeTransformString(1,x,y));
  d3.select("#resetZoomButton").transition()
                               .duration(1000)
                               .style("visibility","hidden");
  unFocusSidebar();
}


function initializeMap() {
  map_svg = d3.select("#map");

  mapHeight = parseInt(map_svg.style('height'));
  mapWidth = parseInt(map_svg.style('width')); 
  
  projection = d3.geo.albersUsa()
                     .scale(mapWidth)
                     .translate([0, 0]);

  path = d3.geo.path().projection(projection);

  mapContainer = d3.select("#mapContainer");
  mapContainer.attr("transform","translate(" + mapWidth/2 + "," +  mapHeight/2 +")");

  counties = d3.select("#counties");
  counties.attr("class",fills[globalDim]);

  states = d3.select("#states");

  d3.json("data/us-states.json", function(json) {
    states.selectAll("path")
        .data(json.features)
      .enter().append("path")
        .attr("d", path);
  });

  d3.json("data/us-counties.json", function(json) {
    counties.selectAll("path")
        .data(json.features)
      .enter().append("path")
        .attr("d", path)
        .attr("id", function(d){ return 'cty'+d.id; })
        .attr("class",fill_color)
        .classed("county",true)
        .attr("name", function(d){ return d.id; })
        .attr("state", getState)
        .on("click",clickZoom)
        .on("mouseover",showTooltip)
        //.on("mousemove",moveTooltip)
        .on("mouseout",hideTooltip);
  });
  
  resetZoomButton = d3.select('#resetZoomButton');
  resetZoomButton.on("click",resetZoom)
    .style("visibility","hidden");
}

function getCountyDetails(d) {
  var county = county_data[d.id];
  var val = county['data'][globalYear][globalDim];
  var countyName = county['name'];
  var stateName = county['state'];
  var dim = dimNames[globalDim];
  var html = '<div class="countyDetail">';
  html += '<h3>'+countyName+', '+stateName+'</h3>';
  html += '<p>'+dim+'</p>';
  html += '<p>'+countyName+': '+formatCurrency(val)+'</p>';
  //TODO: add state and national average data objects
  html += '<p>'+stateName+': $18,000</p>';
  html += '<p>nationwide: $18,000</p>';
  //TODO: add check for poverty line
  html += '</div>';
  return html;
}



function showTooltip(d) {
  //console.log(d);
  centroid = path.centroid(d);
  d3.select('#mapTooltip')
    .append('div')
    .style('position','absolute')
    .classed('tooltip',true)
    .classed('tophalf','true')
    .attr('id','hovertip')
    .html(getCountyDetails(d))
    .style('margin-left',((zoomRefK * (centroid[0] - zoomRefX)) + 350 - 15)+'px')
    .style('margin-top',((zoomRefK * (centroid[1] - zoomRefY)) + 215 + 7)+'px');
}

function showLockedTooltip(d) {
  d3.select('#lockedtip').remove();
  d3.select('#mapTooltip')
    .append('div')
    .style('position','absolute')
    .classed('tooltip',true)
    .classed('tophalf',false)
    .classed('bottomhalf',false)
    .classed('locked','true')
    .attr('id','lockedtip')
    .html(getCountyDetails(d))
    .style('margin-left',(350 - 15)+'px')
    .style('margin-top',(215 + 7)+'px');
}

function hideTooltip(d) {
  d3.select('#hovertip').remove();
}

function makeRangeLabel(lownum,highnum){
  var lowstring;
  var highstring;
  if (highnum === Infinity) {
        if (lownum > 999) {
          lowstring = '$'+(lownum / 1000.0).toPrecision(2) + 'k';
          return lowstring + '+';
        } else {
          lowstring = '$'+Math.round(lownum);
          return lowstring + '+';
        }
  } else if (lownum > 0) {
    if (lownum > 999) {
      // both in the thousands
      lowstring = '$'+(lownum / 1000.0).toPrecision(2) + 'k';
      highstring = '$'+(highnum / 1000.0).toPrecision(2) + 'k';
    } else if (highnum < 999) {
      // both less than 1k
      lowstring = '$'+Math.round(lownum);
      highstring = '$'+Math.round(highnum);
    } else {
      // low is < 1k, high is > 1k
      lowstring = '$'+Math.round(lownum);
      highstring = '$'+(highnum / 1000.0).toPrecision(2) + 'k';
    }
  } else {
    lowstring = '$0';
    if (highnum > 999) {
      // low is 0, high is > 1k
      highstring = '$'+(highnum / 1000.0).toPrecision(2) + 'k';
    } else {
      highstring = '$'+Math.round(highnum);
    }
  }
  return lowstring + ' - ' + highstring;
}

// BEGIN LEGEND
function makeLegend() {
  legend = d3.select("#legend");
  legend.attr("class",fills[globalDim]);
  histogram = d3.select("#histogram");
  histogramMask = d3.select('#histogramMask');
  labelText = d3.select("#labels");

  var histogramHeight = parseInt(histogram.attr("height"));
  var histogramWidth = parseInt(histogram.attr("width"));

  hist = [];
  labels = [];
  probs = [0,0.2,0.4,0.6,0.8,0.9,0.95,0.99];
  max_y = 0;
  for (i in probs) {
    q = yearScales[globalYear][globalDim].quantiles[probs[i]];
    max_y = max_y > q.size ? max_y : q.size;
    hist.push({prob: probs[i], color:colorScale[probs[i]], y:q.size});
    labels.push(makeRangeLabel(q.lower_threshold,q.upper_threshold));
  }

  lscale = d3.scale.linear().domain([0,max_y]).range([0,histogramHeight]);

  barWidth = 67.5;

  histogram.selectAll("rect")
    .remove();

  histogram.selectAll("rect")
    .data(hist)
    .enter()
    .append("rect")
    .attr("x",function(d,i) { return i * (barWidth + 20); })
      .attr("y",function(d) { return histogramHeight - lscale(d.y); })
    .attr("height", function(d) { return lscale(d.y); })
    .attr("width",barWidth)
    .attr("class", function(d) { return d.color; });

  histogramMask.selectAll("rect")
    .data(hist)
    .enter()
    .append("rect")
    .attr("x",function(d,i) { return (i * (barWidth + 20))+1.5; })
      .attr("y",function(d) { return 1.5; })
      .attr("rx",5)
      .attr("ry",5)
    .attr("height", function(d) { return (histogramHeight - 3); })
    .attr("width",function(d) { return (barWidth-1.5);})
    .style("stroke-width","0px")
    .classed("histogramMask",true)
    .attr("id",function(d) {return d.color+'histMask'; })
    //.style('fill','rgba(128,128,128,0)')
    .on("mouseover",legendHighlightCounties)
    .on("mouseout",legendDehighlightCounties);

  d3.select('#legendLabel').selectAll('p').remove();

  d3.select('#legendLabel').selectAll("p")
    .data(labels)
    .enter()
    .append("p")
    .style("display","inline-block")
    .style("width",barWidth)
    .style("text-align","center")
    .style("margin-left","10px")
    .style("margin-right","10px")
    .text(function(d) {return d;});

}

function legendHighlightCounties(d) {
  d3.select('#'+d.color+'histMask')
    .style("stroke-width","3px");
    //.style("fill","rgba(0,0,0,0.5)");

  d3.selectAll('.county')
    .classed('hidden',true);

  d3.selectAll('.county.'+d.color)
    .classed('hidden',false);

}

function legendDehighlightCounties(d) {
  d3.select('#'+d.color+'histMask')
    .style("stroke-width","0px");
    //.style('fill','rgba(128,128,128,0)');

  d3.selectAll('.county')
    .classed('hidden',false);
}
//END LEGEND

function darken(d) {
  d_id = '#'+d+'lineGraphMask';
  //console.log(d_id);
  d3.select(d_id)
    .classed("darkened",true)
   // .style("fill","rgba(0,0,0,0.5)");
}

function undarken(d) {
  d_id = '#'+d+'lineGraphMask';
  d3.select(d_id)
    .classed("darkened",false);
    //.style("fill", "rgba(128,128,128,0)");
}

var lineScales = {};

//BEGIN SIDEBAR
function initializeSidebar(){
  sidebar = d3.select("#sidebar");  
  
  lineGraphContainer = d3.select("#lineGraphContainer")
    .attr("height",parseInt(sidebar.style("height")))
    .attr("width",parseInt(d3.select('#leftSide').style("width")));

  selectorHeight = (lineGraphContainer.attr("height")-((dims.length-1)*lineGraphSpacing))/(dims.length);
  selectorWidth = lineGraphContainer.attr("width")-2;

  lineGraphContainer.selectAll("g")
    .data(dims)
    .enter()
    .append("g")
    .attr("id",function(d) { return d; })
    .attr("class",function(d) { return fills[d]; })
    .attr("transform",function(d,i) {
                        tr_x = 1;
                        tr_y = i * (selectorHeight + lineGraphSpacing);
                        return makeTransformString(1,tr_x,tr_y);})
    .append("g")
    .append("rect")
    .attr("class","lineGraphMask")
    .attr("id",function(d) {return d+"lineGraphMask";})
    .attr("x",function(d) { return 1; })
    .attr("y",function(d) { return 1; })
    .attr("width",selectorWidth)
    .attr("height",selectorHeight)
    .on("mouseover",darken)
    .on("mouseout",undarken)
    .on("click",updateDim);
  
  lineGraphSelector = lineGraphContainer.append("rect")
    .attr("width",selectorWidth-1.5)
    .attr("height",selectorHeight-1.5)
    .attr("x",1.5)
    .attr("y",1.5)
    .attr("rx","5")
    .attr("ry","5")
    .attr("id","lineGraphSelector");

  for (i in dims) {
    dimensionLineGraph(dims[i],i);
  }

}

// Make Line graph

parseDate = function (n) { 
  n = n.toString(); 
  return d3.time.format("%Y").parse(n);
}

var yearDates = _.map(years,parseDate);

function dimensionLineGraph(dim_name,dim_index){

  var data = [];
  for (var y in years) {
    data.push(summary_data[years[y]][dim_name])
  }

  //console.log(data);
  var margin = {top:30,right:20,bottom:30,left:45}
  var width = lineGraphSelector.attr("width") - margin.left - margin.right;
  var height = lineGraphSelector.attr("height") - margin.top - margin.bottom;
  xLineScale = d3.time.scale()
    .range([0,width]);
  var yLineScale = d3.scale.linear()
    .range([height-5,0]);
  var xAxis = d3.svg.axis()
    .scale(xLineScale)
    .orient("bottom")
    .tickFormat(d3.time.format('%y'));
  var yAxis = d3.svg.axis()
    .scale(yLineScale)
    .ticks(4)
    .orient("left");


  xLineScale.domain(d3.extent(yearDates));
  //console.log(summary['min_'+dim_name]);
  //console.log(summary['max_'+dim_name]);
  yLineScale.domain([summary['min_'+dim_name],summary['max_'+dim_name]]);

  var line = d3.svg.line()
    .x(function(d,i) { return xLineScale(yearDates[i]);})
    .y(function(d) { return yLineScale(d);});

  var g = d3.select("#"+dim_name)
    .append("g")
    .attr("transform","translate("+margin.left+","+margin.top+")")
    .attr("class","lineGraph");

  g.append("text")
    .text(dimNames[dim_name])
    .attr("transform","translate(-35,-17)")
    .classed("lineGraphTitle",true);

  g.append("text")
    .attr("transform","translate(-35,-3)")
    .classed("lineGraphSubTitle",true)
    .append("tspan")
    .classed("dimText",true)
    .text(globalYear+': '+formatCurrency(summary_data[years[i]][dim_name]));
    ;

  g.append("g")
    .attr("class","x axis")
    .attr("transform","translate(5," + height + ")")
    .call(xAxis);

  g.append("g")
    .attr("class","y axis")
    .attr("transform","translate(0,0)")
    .call(yAxis);

   g.append("line")
      .attr("x1",xLineScale(parseDate(globalYear)))
      .attr("x2",xLineScale(parseDate(globalYear)))
      .attr("y1",yLineScale(summary['min_'+dim_name]))
      .attr("y2",yLineScale(summary['max_'+dim_name]))
      .classed("yearLine",true)
      .attr("id",dim_name+"YearLine")
      .attr("transform","translate(5,0)");

  /*g.selectAll("line")
    .data(yearDates)
    .enter()
    .append("line")
    .attr("x1",function(d) {return xLineScale(d);})
    .attr("x2",function(d) {return xLineScale(d);})
    .attr("y1",yLineScale(summary['min_'+dim_name]))
    .attr("y2",yLineScale(summary['max_'+dim_name]))
    .classed("yearLine",true)
    .classed("hidden",true)
    .attr("id",dim_name+"YearLine")
    .attr("transform","translate(5,0)")
    .on("mouseover",function(d){d3.select(this).classed("hidden",false);})
    .on("mouseout",function(d){d3.select(this).classed("hidden",true);});*/
  
  g.append("path")
    .classed("line",true)
    .classed("nationalLine",true)
    .attr("d",line(data))
    .attr("transform","translate(5,0)");

  lineScales[dim_name] = {"xScale":xLineScale,"yScale":yLineScale,"line":line};
  //console.log(lineScales);

  g.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx",function(d,i) { return xLineScale(yearDates[i]);})
    .attr("cy",function(d) { return yLineScale(d);})
    .attr("r",2)
    .classed("dot",true)
    .classed("nationalDot",true)
    .attr("transform","translate(5,0)");
    /*.on("mouseover",function(d,i) { 
      var lgs = d3.select('#'+dim_name+' .lineGraphSubTitle');
      if (centered == undefined || centered == null) {
        darken(dim_name);
        d3.select('#'+dim_name+' .yearLine')
          .attr("x1",xLineScale(yearDates[i]))
          .attr("x2",xLineScale(yearDates[i]))
        //console.log(county_data[centered.id]);
        //
        lgs.text(years[i]+': '+formatCurrency(summary_data[years[i]][dim_name]));
      }
    })
    .on("mouseout",function(d) { 
      var lgs = d3.select('#'+dim_name+' .lineGraphSubTitle');
      d3.select('#'+dim_name+" .yearLine")
       .attr("x1",xLineScale(parseDate(globalYear)))
       .attr("x2",xLineScale(parseDate(globalYear)))
      lgs.text(globalYear+': '+formatCurrency(summary_data[years[i]][dim_name]));
        });*/

    /*.on("mouseover.tooltip",function(d,i){d3.select('text#'+dim_name+'Text').remove();
                                          d3.select(this)
                                          .transition()
                                          .attr("r",4);
                                          darken(dim_name);
                                          g.append("text")
                                          .text(formatCurrency(d))
                                          .attr("x",xLineScale(parseDate('2004'))+10)
                                          .attr("y",yLineScale(d3.min(data))-10)
                                          .classed("valueText",true)
                                          .attr("id",dim_name+"Text");})
    /.on("mouseout.tooltip",function() {d3.select('text#'+dim_name+'Text').remove();
                                       d3.select(this).attr("r",2);});*/

}
  
function updateLineGraphSubTitles() {
  for (var j=0;j<dims.length;j++) {
    var dim = dims[j];
    //console.log(j+': '+dim);
    var lgs = d3.select('#'+dim+' .lineGraphSubTitle');
    if (centered || centered != null) {
      lgs.selectAll('tspan').remove();
      lgs.append('tspan')
        .classed("dimText",true)
        .text(globalYear+': '+formatCurrency(county_data[centered.id]['data'][globalYear][dim]));
      lgs.append('tspan')
        .classed("fadedDimText",true)
        .text(' (natl: '+formatCurrency(summary_data[globalYear][dim])+')');
    } else {
      lgs.selectAll('tspan').remove();
      lgs.append('tspan')
        .classed("dimText",true)
        .text(globalYear+': '+formatCurrency(summary_data[globalYear][dim]));
    }
  }}


function focusSidebar(d) {
  updateLineGraphSubTitles();

  d3.selectAll('.nationalLine')
     .classed('line',false)
     .classed('fadedLine',true);

  d3.selectAll('.nationalDot')
    .classed('dot',false)
    .classed('fadedDot',true);
  
  d3.selectAll('.dimLine').remove();
  d3.selectAll('.dimDot').remove();

  var lineScale;

  for (var j=0;j<dims.length;j++) {
    var dim = dims[j];
    //console.log(j+': '+dim);
    lineScale = lineScales[dim]
    //console.log(lineScale);
    //console.log(d);
    var data = [];
    for (y in years) {
      try {
        data.push(county_data[d.id]['data'][years[y]][dim]);
      } catch(e) {
        //console.log(e)
      }
    }
    //console.log(data)
    
    var g = d3.select('#'+dim+' .lineGraph');
    
    g.append('path')
      .classed("line",true)
      .classed("dimLine",true)
      .attr("d",lineScale.line(data))
      .attr("transform","translate(5,0)");

    for (var i=0;i<data.length;i++) {
      var datum = data[i];
      //console.log(datum);
      cx = lineScale.xScale(yearDates[i]);
      cy = lineScale.yScale(datum);
      g.append("circle")
      .attr("cx",cx)
      .attr("cy",cy)
      .attr("r",2)
      .classed('dot',true)
      .classed("dimDot",true)
      .attr("transform","translate(5,0)");
/*    .on("mouseover",function(dim) { 
      console.log(dim);
      var dim_name = dim.toString();
      darken(dim_name);
      d3.select('#'+dim_name+' .yearLine')
        .attr("x1",lineScale.xScale(yearDates[i]))
        .attr("x2",lineScale.xScale(yearDates[i]))
      var lgs = d3.select('#'+dim_name+' .lineGraphSubTitle')
      //console.log(county_data[centered.id]);
      lgs.text(
          years[i]+': '+formatCurrency(county_data[centered.id]['data'][years[i]][dim_name])+' (natl: '+formatCurrency(summary_data[years[i]][dim_name])+')');
      })
    .on("mouseout",function(d) { 
      var dim_name = dim.toString();
      var lgs = d3.select('#'+dim_name+' .lineGraphSubTitle')
      d3.select('#'+dim_name+" .yearLine")
       .attr("x1",lineScale.xScale(parseDate(globalYear)))
       .attr("x2",lineScale.xScale(parseDate(globalYear)))
      lgs.text('Natl: '+formatCurrency(summary_data[years[i]][dim_name]));
        });*/
    }
  }

}

function unFocusSidebar() {
  updateLineGraphSubTitles();
  d3.selectAll('.dimLine').remove();
  d3.selectAll('.dimDot').remove();
  d3.selectAll('.nationalLine').classed('fadedLine',false);
  d3.selectAll('.nationalLine').classed('line',true);
  d3.selectAll('.nationalDot').classed('fadedDot',false).classed('dot',true);
}



function initializeAll() {
  initializeMap();
  makeLegend();
  initializeSidebar();
}

function updateYear(newYear) {
  globalYear = newYear;
  updateLineGraphSubTitles();
  globalScale = updateYearScale();
  d3.select('#yearShown')
    .text(globalYear)
  updateMapFill();
  d3.selectAll('.yearLine')
    .transition()
    .attr("x1",xLineScale(parseDate(globalYear)))
    .attr("x2",xLineScale(parseDate(globalYear)));
  makeLegend();
}

function moveSelector() {
  lgs = d3.select("#lineGraphSelector");
  h = parseFloat(lgs.attr('height'))+1.5;
  lgs.transition()
    .duration(500)
    .attr("y",function() { 
                  dim_num = _.indexOf(dims,globalDim);
                  return (dim_num * (lineGraphSpacing + h));});
}

function updateDim(newDim) {
  globalDim = newDim;
  //yearScale = yearScaleDim();
  globalScale = updateYearScale();
  moveSelector();
  d3.select('#dimShown')
    .text(dimNames[globalDim]);
  updateMapFill();
  makeLegend();
}

function updateMapFill() {
  counties.attr("class",fills[globalDim]);
  counties.selectAll("path")
    .attr("class",fill_color)
    .classed("county",true);
};


function fill_color(d) { 
  var className = "not_found";
  try {
    var val = county_data[d.id]['data'][globalYear][globalDim];
    className = globalScale(val);
  } catch (e) {
    //var goo = 2;
    //console.log(e);
  } finally {
    return className;
  }
}

function getState(d) { 
  try {
    return county_data[d.id]['state'];
  } catch (e) {
    return '';
  }
}

/* OLD REDRAW */
function redraw() {
  map_svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
} 

function zoomIn() {
  current
  map_svg.attr("transform", "scale(" + 1.1 +")");
}


function getData(county_id){
  try {
    return county_data[county_id]['data'][globalYear][globalDim];
  } catch (e) {
    //console.log(e);
    return false;
  }
}

function formatCurrency(num) {
  num = num.toString().replace(/\$|\,/g, '');
  if (isNaN(num)) num = "0";
  sign = (num == (num = Math.abs(num)));
  num = Math.floor(num * 100 + 0.50000000001);
  num = Math.floor(num / 100).toString();
  for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
    num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
  return (((sign) ? '' : '-') + '$' + num );
}

function mround(n,m) {
   n = Number(n);
   m = Number(m).toPrecision(2);
   if(n > 0){
     return Math.floor(n/m) * m;
   } else {
     return 0;
   }
}

initializeAll();
