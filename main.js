width = 750;
height = 450;
chart_margins = {left: 50, right: 30, top: 30, bottom: 30};
bar_margins = {left: 100, right: 50, top: 30, bottom: 30};

var barWidth = 600;

var numBoxes = 0;
var lineOn = true;

var brushContainer;
var brush;

var xScale, yScale, xScaleBar, yScaleBar;

var xAxisBar, yAxisBar;

var genres, countries, continents, ratings;

var dropdownOptions = ["genre", "continent", "rating"];

var data;

var brushActive = false;

var sel = null;

var selectedContinent = null;

function appendDetailsBox(id, title, duration, year, rating, genres, director, cast, country, budget, gross, score) {
    if (numBoxes) { return; }

    numBoxes++;

    $("#main").append("<div id=details-" + id + " class=details></div>")
    id = "#details-" + id;
    $(id).append("<p class=title>" + title + "</p>");
    $(id).append("<p class=subheader>" + duration + " min | " + year + " | " + rating + "</p>");
    $(id).append("<p class=subheader>" + genres.join(" | ") + "</p>");
    $(id).append("<p><strong>Director: </strong>" + director + "</p>");
    cast_members = cast.join(", ");
    $(id).append("<p><strong>Cast: </strong>" + cast_members + "</p>");
    $(id).append("<p><strong>Country: </strong>" + country + "</p>");
    $(id).append("<p><strong>Budget: </strong>$" + budget + "</p>");
    $(id).append("<p><strong>Gross: </strong>$" + gross + "</p>");
    $(id).append("<p><strong>Score: </strong>" + score + " / 10</p>");

    $(id).click(() => {
        $(id).unbind("click");
        $(id).remove();
        numBoxes--;
    });
}

function appendCountriesBox(continent) {
    $(".contDetails").remove();
    d3.selectAll(".clicked").classed("clicked", false);
    d3.select("#bar-" + continentToId(continent)).classed("clicked", true);
    id = continentToId(continent);
    selectedContinent = continent;
    $("#bar").append("<div id=" + id + " class=contDetails></div>");
    countriesData = [];
    countries.forEach((c) => {
        countriesData.push({country: c, freq: 0});
    })
    d3.selectAll(".brushed")
      .each((d) => {
          if (d.continent == continent) {
              countriesData.forEach((elem) => {
                  if (d.country == elem.country) {
                      elem.freq++;
                  }
              })
          }
      })
      countriesData.sort((a, b) => {
          return b.freq - a.freq;
      })
    id = "#" + id;
    $(id).append("<p class=title>" + continent + "</p>");
    countriesData.forEach((elem) => {
        if (elem.freq > 0) {
            $(id).append("<p><strong>" + elem.country + ": </strong>" + elem.freq + "</p>");
        }
    })
    $(id).click(() => {
        $(id).unbind("click");
        $(id).remove();
        d3.select("#bar-" + continentToId(continent)).classed("clicked", false);
        selectedContinent = null;
    });
}

var plot = d3.select('#chart').append("svg")
            .attr("width", width)
            .attr("height", height);

var bar = d3.select('#bar')
            .append("svg")
            .attr("width", barWidth)
            .attr("height", height)

var bars = bar.append("g");

d3.csv("movies.csv", (movies) => {
    genres = [];
    countries = [];
    continents = ["Oceania",
                  "Asia",
                  "Africa",
                  "Europe",
                  "S. America",
                  "N. America"];
    ratings = ["Not Rated",
               "Unrated",
               "NC-17",
               "R",
               "TV-MA",
               "TV-14",
               "PG-13",
               "PG",
               "TV-PG",
               "G",
               "TV-G",
               "TV-Y7",
               "TV-Y"];
    for (var i = 0; i < movies.length; i++) {
        movies[i].id = i;
        movies[i].gross = +movies[i].gross;
        movies[i].budget = +movies[i].budget;
        movies[i].imdb_score = +movies[i].imdb_score;
        movies[i].genres = movies[i].genres.split("|");
        movies[i].genres.forEach((x) => {
            if (!genres.includes(x)) {
                genres.push(x);
            }
        })
        movies[i].continent = countryToContinent(movies[i].country);
        if (!countries.includes(movies[i].country) && movies[i].country != "") {
            countries.push(movies[i].country);
        }
    }

    data = movies;

    var budgetExtent = d3.extent(movies, function(row) { return row.budget; });
    var grossExtent = d3.extent(movies, function(row) { return row.gross; });
    var imdbExtent = d3.extent(movies, function(row) { return row.imdb_score; });

    xScale = d3.scalePow().exponent(0.4).domain(budgetExtent).range([chart_margins.left, width - chart_margins.right])
    yScale = d3.scalePow().exponent(0.4).domain(grossExtent).range([height - chart_margins.top, chart_margins.bottom])
    var xAxis = d3.axisBottom().scale(xScale)
    var yAxis = d3.axisLeft().scale(yScale)

    xScaleBar = d3.scaleLinear().domain([]).range([bar_margins.left, barWidth - bar_margins.right]);
    yScaleBar = d3.scaleBand().domain(genres).range([height - bar_margins.top, bar_margins.bottom]);
    xAxisBar = d3.axisBottom().scale(xScaleBar);
    yAxisBar = d3.axisLeft().scale(yScaleBar);

    brushContainer = plot.append('g')
                         .attr('id', 'brush-container');


    brush = d3.brush()
               .extent([[40, 20], [width - 20, height - 20]])
        
    brush.on('start', handleBrushStart)
         .on('brush', handleBrushMove)
         .on('end', handleBrushEnd);

    brushContainer.call(brush);

    plot.selectAll("circle")
       .data(movies)
       .enter()
       .append("circle")
       .attr("id", function(d, i) {return i;} )
       .classed("profit", function(d) { return d.budget <= d.gross && lineOn; })
       .classed("loss", function(d) { return d.budget > d.gross && lineOn; })
       .attr("cx", function(d) { return xScale(d.budget); })
       .attr("cy", function(d) { return yScale(d.gross); })
       .attr("r", 3)
       .on("click", function(d, i) {
            appendDetailsBox(i, d.movie_title,
                                 d.duration,
                                 d.title_year,
                                 d.content_rating,
                                 d.genres,
                                 d.director_name,
                                 [d.actor_1_name, d.actor_2_name, d.actor_3_name],
                                 d.country,
                                 d.budget,
                                 d.gross,
                                 d.imdb_score);
       });

    plot.append("g")
        .call(xAxis.tickFormat(d => (d / 1000000) + "m"))
        .attr("transform", "translate(0, " + (height - chart_margins.bottom) + ")")
        .selectAll("text")
        .attr("transform", function (d) { return "rotate(-30)"; });

    plot.append("g")
        .call(yAxis.tickFormat(d => (d / 1000000) + "m"))
        .attr("transform", "translate(" + chart_margins.left + ", 0)")

    plot.append('line')
        .attr('class', 'budget-line')
        .attr('stroke-width', 2)
        .attr('stroke', 'blue')
        .attr("x1", xScale(0))
        .attr("x2", xScale(budgetExtent[1]))
        .attr("y1", yScale(0))
        .attr("y2", yScale(budgetExtent[1]));

    bar.append("g")
       .classed("xAxisBar", true)
       .call(xAxisBar)
       .attr("transform", "translate(0, " + (height - bar_margins.bottom) + ")")
    
    bar.append("g")
       .classed("yAxisBar", true)
       .call(yAxisBar)
       .attr("transform", "translate(" + bar_margins.left + ", 0)");

    bars.selectAll('rect')
        .data(genres)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', bar_margins.left)
        .attr('y', (d) => {
            return yScaleBar(d);
        })
        .attr('width', 0)
        .attr('height', function(d) {
            return yScaleBar.bandwidth()*.8;
        });
});

$("#line-toggle").click(() => {
    lineOn = !lineOn;

    plot.selectAll("circle")
        .classed("profit", function(d) { return d.budget <= d.gross && lineOn; })
        .classed("loss", function(d) { return d.budget > d.gross && lineOn; })

    d3.select(".budget-line").classed("hidden", !lineOn);
});

$("#dropdown").change(() => {
    bars.selectAll(".bar")
            // .transition()
            // .attr("width", 0)
            .remove();
    // bars.selectAll(".bar")
    //     .remove();
    var value = $("#dropdown").val();
    if (value == "genre") {
        yScaleBar.domain(genres);
        bars.selectAll('.rect')
            .data(genres)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', bar_margins.left)
            .attr('y', (d) => {
                return yScaleBar(d);
            })
            .attr('width', 0)
            .attr('height', function(d) {
                return yScaleBar.bandwidth()*.8;
            });
    } else if (value == "continent") {
        yScaleBar.domain(continents);
        bars.selectAll('.rect')
            .data(continents)
            .enter()
            .append('rect')
            .attr('class', 'bar continent')
            .attr('id', (d) => {
                return "bar-" + continentToId(d);
            })
            .attr('x', bar_margins.left)
            .attr('y', (d) => {
                return yScaleBar(d);
            })
            .attr('width', 0)
            .attr('height', function(d) {
                return yScaleBar.bandwidth()*.8;
            })
            .on("click", (d) => {
                appendCountriesBox(d);
            })
    } else if (value == "rating") {
        yScaleBar.domain(ratings);
        bars.selectAll('.rect')
            .data(ratings)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', bar_margins.left)
            .attr('y', (d) => {
                return yScaleBar(d);
            })
            .attr('width', 0)
            .attr('height', function(d) {
                return yScaleBar.bandwidth()*.8;
            });
    }
    bar.select(".yAxisBar")
      .transition()
      .call(yAxisBar);
      if (brushActive) {
          handleBrushStart();
          handleBrushMove();
      }
})

function handleBrushStart() {
    console.log("START");
    brushActive = true;
}

function handleBrushMove() {
    console.log("MOVE");
    if (d3.event) {
        sel = d3.event.selection;
    }

    if (!sel) {
        return;
    }
    if (selectedContinent != null) {
        appendCountriesBox(selectedContinent);
    }

    var [[left, top], [right, bottom]] = sel;
    
    var genreData = []
    genres.forEach((g) => {
        genreData.push({genre: g, freq: 0});
    })
    var continentData = [];
    continents.forEach((c) => {
        continentData.push({continent: c, freq: 0});
    })
    var ratingData = [];
    ratings.forEach((l) => {
        ratingData.push({rating: l, freq: 0});
    })
	plot.selectAll("circle")
		.classed('brushed', (d) => {
			var cx = xScale(d.budget);
            var cy = yScale(d.gross);
            return left <= cx && cx <= right && top <= cy && cy <= bottom;
        });
    plot.selectAll(".brushed")
        .each((d) => {
            genreData.forEach((elem) => {
                if (data[d.id].genres.includes(elem.genre)) {
                    elem.freq++;
                }
            });
            continentData.forEach((elem) => {
                if (elem.continent == data[d.id].continent) {
                    elem.freq++;
                }
            });
            ratingData.forEach((elem) => {
                if (elem.rating == data[d.id].content_rating) {
                    elem.freq++;
                }
            });
        });
    var value = $("#dropdown").val();
    if (value == "genre") {
        xScaleBar.domain([0, d3.max(genreData, (d) => {
            return d.freq;
        })]);
        bar.select(".xAxisBar")
           .transition()
           .call(xAxisBar);
        bars.selectAll('rect')
            .transition()
            .attr('width', (d, i) => {
                return xScaleBar(genreData[i].freq) - bar_margins.left;
            });
    } else if (value == "continent") {
        xScaleBar.domain([0, d3.max(continentData, (d) => {
            return d.freq;
        })]);
        bar.select(".xAxisBar")
           .transition()
           .call(xAxisBar);
        bars.selectAll('rect')
            .transition()
            .attr('width', (d, i) => {
                return xScaleBar(continentData[i].freq)  - bar_margins.left;
            });
    } else if (value == "rating") {
        xScaleBar.domain([0, d3.max(ratingData, (d) => {
            return d.freq;
        })]);
        bar.select(".xAxisBar")
           .transition()
           .call(xAxisBar);
        bars.selectAll('rect')
            .transition()
            .attr('width', (d, i) => {
                return xScaleBar(ratingData[i].freq)  - bar_margins.left;
            });
    }
}

function handleBrushEnd() {
    console.log("END");
    sel = d3.event.selection;
	if (!sel) {
        bars.selectAll("rect")
            .transition()
            .attr("width", 0);
        d3.selectAll("circle")
          .classed("brushed", false);
        brushActive = false;
        d3.selectAll(".contDetails")
          .remove();
        selectedContinent = null;
		return;
	}
}

function continentToId(continent) {
    switch (continent) {
        case ("N. America"): return "nAmerica";
        case ("S. America"): return "sAmerica";
        case ("Europe"): return "europe";
        case ("Asia"): return "asia";
        case ("Africa"): return "africa";
        case ("Oceania"): return "oceania";
    }
}

function idToContinent(id) {
    switch (id) {
        case ("nAmerica"): return "N. America";
        case ("sAmerica"): return "S. America";
        case ("europe"): return "Europe";
        case ("asia"): return "Asia";
        case ("africa"): return "Africa";
        case ("oceania"): return "Oceania";
    }
}

function countryToContinent(country) {
    switch (country) {
        case "Germany": return continents[3];
        case "USA": return continents[5];
        case "China": return continents[1];
        case "Georgia": return continents[3];
        case "UK": return continents[3];
        case "Denmark": return continents[3];
        case "France": return continents[3];
        case "Iran": return continents[1];
        case "Russia": return continents[3];
        case "New Zealand": return continents[0];
        case "India": return continents[1];
        case "Australia": return continents[0];
        case "Canada": return continents[5];
        case "Spain": return continents[3];
        case "Bulgaria": return continents[3];
        case "Mexico": return continents[5];
        case "Nigeria": return continents[2];
        case "Israel": return continents[1];
        case "Italy": return continents[3];
        case "Czech Republic": return continents[3];
        case "Romania": return continents[3];
        case "Poland": return continents[3];
        case "Sweden": return continents[3];
        case "Bahamas": return continents[5];
        case "Brazil": return continents[4];
        case "Japan": return continents[1];
        case "Switzerland": return continents[3];
        case "Panama": return continents[5];
        case "Ireland": return continents[3];
        case "Norway": return continents[3];
        case "Hong Kong": return continents[1];
        case "Slovenia": return continents[3];
        case "South Korea": return continents[1];
        case "Pakistan": return continents[1];
        case "South Africa": return continents[2];
        case "Finland": return continents[3];
        case "Cambodia": return continents[1];
        case "Greece": return continents[3];
        case "Hungary": return continents[3];
        case "Iceland": return continents[3];
        case "Kyrgyzstan": return continents[1];
        case "Thailand": return continents[1];
        case "Kenya": return continents[2];
        case "Chile": return continents[4];
        case "Taiwan": return continents[1];
        case "United Arab Emirates": return continents[1];
        case "Belgium": return continents[3];
        case "Dominican Republic": return continents[5];
        case "Indonesia": return continents[0];
        case "Egypt": return continents[2];
    }
}