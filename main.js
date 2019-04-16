width = 750;
height = 450;
chart_margins = {left: 50, right: 30, top: 30, bottom: 30};

function appendDetailsBox(id, title, duration, year, rating, director, cast, country, budget, gross, score) {
    $("#main").append("<div id=details-" + id + " class=details></div>")
    id = "#details-" + id;
    $(id).append("<p class=title>" + title + "</p>");
    $(id).append("<p class=subheader>" + duration + " min | " + year + " | " + rating + "</p>");
    $(id).append("<p><strong>Director: </strong>" + director + "</p>");
    cast_members = cast.join(", ");
    $(id).append("<p><strong>Cast: </strong>" + cast_members + "</p>");
    $(id).append("<p><strong>Country: </strong>" + country + "</p>");
    $(id).append("<p><strong>Budget: </strong>" + budget + "</p>");
    $(id).append("<p><strong>Gross: </strong>" + gross + "</p>");
    $(id).append("<p><strong>Score: </strong>" + score + "</p>");
}

d3.csv("movies.csv", (movies) => {
    for (var i = 0; i < movies.length; i++) {
        movies[i].id = i;
        movies[i].gross = +movies[i].gross;
        movies[i].budget = +movies[i].budget;
        movies[i].imdb_score = +movies[i].imdb_score;
    }

    var budgetExtent = d3.extent(movies, function(row) { return row.budget; });
    var grossExtent = d3.extent(movies, function(row) { return row.gross; });
    var imdbExtent = d3.extent(movies, function(row) { return row.imdb_score; });

    var xScale = d3.scalePow().exponent(0.4).domain(budgetExtent).range([chart_margins.left, width - chart_margins.right])
    var yScale = d3.scalePow().exponent(0.4).domain(grossExtent).range([height - chart_margins.top, chart_margins.bottom])
    var xAxis = d3.axisBottom().scale(xScale)
    var yAxis = d3.axisLeft().scale(yScale)

    var plot = d3.select('#chart').append("svg")
            .attr("width", width)
            .attr("height", height);

    plot.selectAll("circle")
       .data(movies)
       .enter()
       .append("circle")
       .attr("id", function(d, i) {return i;} )
       .attr("stroke", function(d) {
            if (d.budget == 0 || d.gross == 0) {
                return "red";
            } else {
                return "black";
            }
       })
       .attr("cx", function(d) { return xScale(d.budget); })
       .attr("cy", function(d) { return yScale(d.gross); })
       .attr("r", 2)
       .on("click", function(d, i) {
            appendDetailsBox(i, d.movie_title,
                                 d.duration,
                                 d.title_year,
                                 d.content_rating,
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


    /*plot.append('line')
        .attr('x1', xScale(0))
        .attr('x2', xScale(20))
        .attr('y1', yScale(0))
        .attr('y2', yScale(10))*/
});