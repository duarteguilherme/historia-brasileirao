

function desenha_linha(variavel) {
        var data = dados[variavel];

        svg.append("path")
            .datum(data)
            .attr("class", "linha " + variavel)
            .attr("d", line)
            .style("stroke","lightgray")
            .style("opacity",0.5)
            .on("click", function () {
                poe_destaque(variavel);
                var x_ = d3.mouse(this)[0];
                var d = acha_circulo_mais_proximo(variavel,x_);
                    mostra_tooltip(d,variavel);
            })
            .on("mouseover", function () {
                poe_destaque(variavel);
                var x_ = d3.mouse(this)[0];
                var d = acha_circulo_mais_proximo(variavel,x_);
                mostra_tooltip(d,variavel);
            })
            .on("mouseout",function (d) {
                if (variavel != "Geral") {
                    tira_destaque(variavel);
                }
            })

        svg.append("g")
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return x(d.date);
            })
            .attr("cy", function (d) {
                return y(d.valor);
            })
            .attr("class", "circle " + variavel)
            .attr("r", 5)
            .style("opacity",0.1)
            .style("fill","light-gray")

            .on("mouseover",function (d) {
                poe_destaque(variavel);
                mostra_tooltip(d,variavel);
            })
            .on("click", function (d) {
                poe_destaque(variavel);
                mostra_tooltip(d,variavel);
            })
            .on("mouseout",function (d) {
                if (variavel != "Geral") {
                    tira_destaque(variavel);
                }
            })
    }

    function poe_destaque(variavel) {
        d3.selectAll("circle."+variavel)
            .style("fill",function (d) {
                return partidos[variavel]
            })
            .style("opacity",0.9);

        d3.selectAll("path."+variavel)
            .style("stroke",function (d) {
                return partidos[variavel]
            })
            .style("opacity",0.9);
    }

    function tira_destaque(variavel) {
        d3.selectAll("circle."+variavel)
            .style("fill","lightgray")
            .style("opacity",0.5);

        d3.selectAll("path."+variavel)
            .style("stroke","lightgray")
            .style("opacity",0.5);
    }

    function mostra_tooltip(d,variavel) {
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);

        tooltip.style("border-color",partidos[variavel])
        topo.html(variavel)
        topo.style("background-color",partidos[variavel])
        var dateObj = d.date;
        var month = dateObj.getUTCMonth() + 1; //months from 1-12
        var year = dateObj.getUTCFullYear();
        resto.html("<b>Data:</b> "+ month +"/" +year+"<br/><b>Governismo:</b> "+ d.valor)
    }

    function acha_circulo_mais_proximo(variavel,x_) {
        var maximo = width;
        var objeto;
        d3.selectAll("circle."+variavel).each(function (d) {
            var distancia = Math.abs(d3.select(this).attr("cx") - x_);
            if (distancia < maximo) {
                maximo = distancia;
                objeto = d;
            }
        })
        return objeto
    }