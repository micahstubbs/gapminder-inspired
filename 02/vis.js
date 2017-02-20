
    var width = 600;
    var height = 500;

    var margin = {
      left:20,
      top:80,
      right:0,
      bottom:30
    };

    function calculateDistance(x1,y1,x2,y2){
      return Math.sqrt( Math.pow(x1-x2,2) + Math.pow(y1-y2,2) )
    }

    var svg = d3.select("svg")
      .at({
        width: width + "px",
        height: height + "px"
      })
      .st({
        width,
        height
      });

    var heading = svg.append("text.heading")
      .translate([0, 16])
      .tspans(["A snapshot of global socio-economic development in 2016,", "as measured by GDP per capita and life expectancy"],1.1)

    function prepare(d){

      d.label = d.shortName;
      d.region = d.region;
      d.lifeEx = +d.lifeEx;
      d.gdpPerCap10 = +d.gdpPerCap10;
      d.gdpPerCapPPP11 = +d.gdpPerCapPPP11;
      d.population = +d.population;
      return d;

    }

    function render(data){

      data = data.filter(d => !isNaN(d.gdpPerCap10) && !isNaN(d.lifeEx));

      // console.log(data);

      // Define and draw x axis
      var x = d3.scaleLog()
        .base(10)
        .range([margin.left, width-margin.right])
        .domain(d3.extent(data, d=> d.gdpPerCap10));

      var xAxis = d3.axisTop()
        .scale(x)
        .ticks(5)
        .tickFormat(d3.format(","))
        .tickSize(-(height-(margin.bottom+margin.top)));

      var xDraw = svg.append("g.axis.x")
        .translate([0, margin.top])
        .call(xAxis);

      // Show/hide and style ticks to make the log scale clear
      d3.selectAll(".x .tick").filter(d => [100, 300, 1000, 3000, 10000, 30000].indexOf(d) < 0)
        .selectAll("text, line")
        .st({
          "stroke-dasharray": "2 2"
        })
        .text("");

      // Add an x-axis title
      var xTitle = svg.append("text.x.title.shadow")
        .translate([x(300)-11, margin.top+13])
        .html("GDP per capita (constant 2010 US$) &rarr;");

      // Define and draw y axis
      var y = d3.scaleLinear()
        .range([height-margin.bottom, margin.top])
        .domain(d3.extent(data, d=> d.lifeEx));

      var yAxis = d3.axisLeft()
        .scale(y)
        .ticks(5)
        .tickSize(-(width-(margin.left+margin.right)));

      var yDraw = svg.append("g.axis.y")
        .translate([margin.left, 0])
        .call(yAxis);

      // Add a y-axis title
      var yTitle = svg.append("text.y.title.shadow")
        .translate([margin.left+2, y(79)-6])
        .tspans(["Life", "expectancy", "at birth", "(years)","&darr;"],1.1);

      // Define a circle area scale
      var areaScale = d3.scaleSqrt()
        .range([0, 35])
        .domain([0, d3.max(data, d => d.population)]);

      var pops = data.map(d => d.population).sort((a,b) => a-b);

      // Draw an area legend
      var areaLegend = svg.append("g.legend").translate([width-85, height-180]);
      var areaGroups = areaLegend.selectAll("g")
        .data([10000000, 100000000, 500000000])
        .enter()
        .append("g");
      var areaCircles = areaGroups.append("circle")
        .at({
          cy: d => -areaScale(d),
          r: d => areaScale(d),
          fill: "none",
          stroke: "#74736c"
        });
      var areaLines = areaGroups.append("line")
        .at({
          y1: d => -2*areaScale(d),
          y2: d => -2*areaScale(d),
          x2: 50,
          stroke: "#74736c"
        });
      var areaNames = areaGroups.append("text.shadow")
        .at({
          y: d => -2*areaScale(d)+5,
          x: 50
        })
        .html(d => (d/1000000) + "m");

      // Define a region colour scale
      var colours = d3.scaleOrdinal()
        .range(['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f'])
        .domain(data.map(d => d.region).filter((element, index, array) => array.indexOf(element)===index));

      // Draw a colour legend
      var colourLegend = svg.append("g.legend").translate([width-155, height-150]);
      var colourGroups = colourLegend.selectAll("g")
        .data(colours.domain())
        .enter()
        .append("g")
        .translate((d,i) => [0, i*20]);
      var colourNames = colourGroups.append("text.shadow")
        .html(d => d);
      var colourDots = colourGroups.append("circle")
        .at({
          cx: -8,
          cy: -5,
          r: 5,
          fill: d => colours(d)
        })

      // Draw and position a group element for each country
      var countries = svg.selectAll("g.country")
        .data(data)
        .enter()
        .append("g.country")
        .translate(d => [x(d.gdpPerCap10), y(d.lifeEx)]);

      // Draw a bubble for each country
      var bubbles = countries.append("circle")
        .at({
          r: d => areaScale(d.population)
        })
        .st({
          fill: d => colours(d.region),
          "fill-opacity": 0.6,
          stroke: d => colours(d.region)
        });

      labels.forEach(d => {
          countries.filter(v => v.label == d.label)
            .selectAll("text.label")
            .data([d])
            .enter()
            .append("text.label.shadow")
            .html(d.label);

          countries.selectAll(".label").filter(v => v.label == d.label)
            .translate(d.translate);

          countries.filter(v => v.label == d.label)
            .selectAll("path")
            .data([d])
            .enter()
            .insert("path","text")
            .attr("d", d.path)
            .style("fill", "none")
            .style("stroke", "#74736c");
        });

      countries.on("click", function(d){
        var selection = d3.select(this);

        selection
          .selectAll("text.label")
          .data([d])
          .enter()
          .append("text.label.shadow")
          .html(d.label);

        if(labels.map(a => a.label).indexOf(selection.data()[0].label)<0){
          labels.push({
            label: selection.data()[0].label
          });
        };    

        countries.selectAll(".label")
        .st({cursor: "pointer"})
        .call(
          d3.drag()
            .on("drag", function(){
              var selection = d3.select(this);
              var dataPoint = data[data.map(a => a.label).indexOf(selection.data()[0].label)];

              selection
                .translate([d3.event.x, d3.event.y])
                .st({cursor: "crosshair"});

              if(calculateDistance(d3.mouse(svg.node())[0], d3.mouse(svg.node())[1], x(dataPoint.gdpPerCap10), y(dataPoint.lifeEx)) > areaScale(dataPoint.population)){

                var path = d3.select(selection.node().parentNode)
                  .selectAll("path")
                  .data(["M " + (d3.event.x + selection.node().getBoundingClientRect().width/2) + ", " + d3.event.y + " A 30 30 0 0 0 0,0"], p => p);

                path
                  .attr("d", p => p)
                  .style("fill", "none")
                  .style("stroke", "#74736c");

                path.exit().remove()

                path.enter()
                  .insert("path","text")
                  .attr("d", p => p)
                  .style("fill", "none")
                  .style("stroke", "#74736c");

              }else{
                var path = d3.select(selection.node().parentNode)
                  .selectAll("path")
                  .remove();
              }
            })
            .on("end", function(){
              var selection = d3.select(this);
              var dataPoint = data[data.map(a => a.label).indexOf(selection.data()[0].label)];

              selection
                .st({cursor: "pointer"});
              if(labels.map(a => a.label).indexOf(selection.data()[0].label)>=0){
                labels[labels.map(a => a.label).indexOf(selection.data()[0].label)].translate = [d3.event.x, d3.event.y];

                if(calculateDistance(d3.mouse(svg.node())[0], d3.mouse(svg.node())[1], x(dataPoint.gdpPerCap10), y(dataPoint.lifeEx)) > areaScale(dataPoint.population)){
                labels[labels.map(a => a.label).indexOf(selection.data()[0].label)].path = d3.select(selection.node().parentNode).select("path").attr("d");
                }else{
                  delete labels[labels.map(a => a.label).indexOf(selection.data()[0].label)].path;
                }

              }else{
                labels.push({
                  label: selection.data()[0].label,
                  translate: [d3.event.x, d3.event.y],
                  path: d3.select(selection.node().parentNode).select("path").attr("d")
                });
              }
            })
          );
        });

        countries.selectAll(".label")
        .st({cursor: "pointer"})
        .call(
          d3.drag()
            .on("drag", function(){
              var selection = d3.select(this);
              var dataPoint = data[data.map(a => a.label).indexOf(selection.data()[0].label)];

              selection
                .translate([d3.event.x, d3.event.y])
                .st({cursor: "crosshair"});

              if(calculateDistance(d3.mouse(svg.node())[0], d3.mouse(svg.node())[1], x(dataPoint.gdpPerCap10), y(dataPoint.lifeEx)) > areaScale(dataPoint.population)){

                var path = d3.select(selection.node().parentNode)
                  .selectAll("path")
                  .data(["M " + (d3.event.x + selection.node().getBoundingClientRect().width/2) + ", " + d3.event.y + " A 30 30 0 0 0 0,0"], p => p)

                path
                  .attr("d", p => p)
                  .style("fill", "none")
                  .style("stroke", "#74736c");

                path.exit().remove()

                path.enter()
                  .insert("path","text")
                  .attr("d", p => p)
                  .style("fill", "none")
                  .style("stroke", "#74736c");

              }else{
                var path = d3.select(selection.node().parentNode)
                  .selectAll("path")
                  .remove();
              }
            })
            .on("end", function(){
              var selection = d3.select(this);
              var dataPoint = data[data.map(a => a.label).indexOf(selection.data()[0].label)];

              selection
                .st({cursor: "pointer"});
              if(labels.map(a => a.label).indexOf(selection.data()[0].label)>=0){
                labels[labels.map(a => a.label).indexOf(selection.data()[0].label)].translate = [d3.event.x, d3.event.y];
                
                if(calculateDistance(d3.mouse(svg.node())[0], d3.mouse(svg.node())[1], x(dataPoint.gdpPerCap10), y(dataPoint.lifeEx)) > areaScale(dataPoint.population)){
                labels[labels.map(a => a.label).indexOf(selection.data()[0].label)].path = d3.select(selection.node().parentNode).select("path").attr("d");
                }else{
                  delete labels[labels.map(a => a.label).indexOf(selection.data()[0].label)].path;
                }

              }else{
                labels.push({
                  label: selection.data()[0].label,
                  translate: [d3.event.x, d3.event.y],
                  path: d3.select(selection.node().parentNode).select("path").attr("d")
                });
              }
            })
          );


    }
    d3.csv("gapMinder2015.csv", prepare, render);

    var labels = [];
