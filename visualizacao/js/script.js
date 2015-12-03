//DIMENSOES DO GRAFICO
var margin = {top: 10, right: 10, bottom: 100, left: 40},
    width = window.innerWidth - margin.right - margin.left - 20,
    margin2 = {top: 430, right: 10, bottom: 20, left: 40},
    height = 500 - margin.top - margin.bottom,
    height2 = 500 - margin2.top - margin2.bottom,
    w = window.innerWidth - 20;

//FORMATO DE PARSEMENTO DOS DADOS DE DATA
var parseData = d3.time.format("%y%m%d").parse;

var timeEscolhido; //ARMAZENA O TIME ESCOLHIDO PELO USUARIO NO MENU
var linhaSelecionada; //ARMAZENA A LINHA ESCOLHIDA A PARTIR DO TIME ESCOLHIDO PELO USUARIO NO MENU
var nomesDosTimes; //ARMAZENA O NOME DOS TIMES; VARIAVEL DE APOIO PARA CHECAGEM E ITERACAO
var times; //ARMAZENA CADA OBJETO-TIME INTEIRO COM SEUS RESPECTIVOS VALORES (DATAS E INDICES)

//TOOLTIP COM INFORMACOES DA LINHA
var tooltip = d3.select("body").append("div")
      .attr("class", "infoTooltip")
      .style("position", "absolute")
      .style("padding", "4px 8px")
      .style("background", function(d) {return "orange"})
      .style("opacity", 0);

//TOOLTIP COM INFOS DO JOGO
var tooltip_jogo = d3.select("body").append("div")
    .attr("class", "infoTooltip")
    .style("position", "absolute")
    .style("padding", "4px 8px")
    .style("background", "black")
    .style("opacity", 0);

//times que têm os escudos à mostra
var escudos = ['atleticomg','atleticopr','avai','chapecoense','corinthians','coritiba','cruzeiro','figueirense','flamengo','fluminense','goias','gremio','internacional','joinville','palmeiras','pontepreta','santos','saopaulo','sport','vasco']

//traducao dos nomes que mudam
var traducao = {
    "americamg":"AMÉRICA-MG",
    "americarj":"AMÉRICA-RJ",
    "americarn":"AMÉRICA-RN",
    "atleticogo":"ATLÉTICO-GO",
    "atleticomg":"ATLÉTICO-MG",
    "atleticopr":"ATLÉTICO-PR",
    "botafogopb":"BOTAFOGO-PB",
    "botafogosp":"BOTAFOGO-SP",
    "brasildepelotas":"BRASIL DE PELOTAS",
    "brasilia":"BRASÍLIA",
    "ceara":"CEARÁ",
    "comercialms":"COMERCIAL-MS",
    "csaal":"CSA-AL",
    "desportivavale":"DESPORTIVA VALE",
    "ferroviario":"FERROVIÁRIO",
    "flamengopi":"FLAMENGO-PI",
    "goias":"GOIÁS",
    "gremio":"GRÊMIO",
    "gremiomaringa":"GRÊMIO MARINGÁ",
    "gremioprudente":"GRÊMIO PRUDENTE",
    "interdelimeira":"INTER DE LIMEIRA",
    "nautico":"NÁUTICO",
    "operarioms":"OPERÁRIO-MS",
    "parana":"PARANÁ",
    "pontepreta":"PONTE PRETA",
    "riobranco":"RIO BRANCO",
    "rionegro":"RIO NEGRO",
    "riverpi":"RIVER-PI",
    "sampaiocorreia":"SAMPAIO CORREIA",
    "santacruz":"SANTA CRUZ",
    "santoandre":"SANTO ANDRÉ",
    "saocaetano":"SÃO CAETANO",
    "saopaulo":"SÃO PAULO",
    "tiradentespi":"TIRADENTES-PI",
    "uberlandia":"UBERLÂNDIA",
    "uniaosaojoao":"UNIÃO SÃO JOÃO",
    "vilanova":"VILA NOVA",
    "vitoria":"VITÓRIA"
};

//lista de campeoes e ano
var campeoes = {
    1971:'ATLÉTICO-MG',
    1972:'PALMEIRAS',
    1973:'PALMEIRAS',
    1974:'VASCO',
    1975:'INTERNACIONAL',
    1976:'INTERNACIONAL',
    1977:'SÃO PAULO',
    1978:'GUARANI',
    1979:'INTERNACIONAL',
    1980:'FLAMENGO',
    1981:'GRÊMIO',
    1982:'FLAMENGO',
    1983:'FLAMENGO',
    1984:'FLUMINENSE',
    1985:'CORITIBA',
    1986:'SÃO PAULO',
    1987:'SPORT',
    1988:'BAHIA',
    1989:'VASCO',
    1990:'CORINTHIANS',
    1991:'SÃO PAULO',
    1992:'FLAMENGO',
    1993:'PALMEIRAS',
    1994:'PALMEIRAS',
    1995:'BOTAFOGO',
    1996:'GRÊMIO',
    1997:'VASCO',
    1998:'CORINTHIANS',
    1999:'CORINTHIANS',
    2000:'VASCO',
    2001:'ATLÉTICO-PR',
    2002:'SANTOS',
    2003:'CRUZEIRO',
    2004:'SANTOS',
    2005:'CORINTHIANS',
    2006:'SÃO PAULO',
    2007:'SÃO PAULO',
    2008:'SÃO PAULO',
    2009:'FLAMENGO',
    2010:'FLUMINENSE',
    2011:'CORINTHIANS',
    2012:'FLUMINENSE',
    2013:'CRUZEIRO',
    2014:'CRUZEIRO',
    2015:'CORINTHIANS'
};




//baixa os dados e chama a função de começar
d3.json ("data/dadosfull.json", comeca_tudo);

function conserta_dados(data) {

    var traducao_time = {};
    data[0]['time'].map(function (d,i) {
        traducao_time[i+1] = d;
    });

    var dados = data[1];

    //PARSEANDO AS DATAS PARA O FORMATO DE LEITURA DO GRAFICO
    dados["data_fake"].forEach(function(data, index) {
        dados["data_fake"][index] = parseData(data);
    });


    dados['time'] = dados['time'].map(function(d) {
        //coloca o nome do time em caixa alta na tradução se não estiver
        var time = traducao_time[d];
        if (!(time in traducao)) {
            traducao[time] = time.toUpperCase();
        }
        return traducao[time];
    });

    //ARMAZENANDO O TOTAL DE TIMES
    nomesDosTimes = data[0]['time'];
    nomesDosTimes = nomesDosTimes.map(function (d) { return traducao[d] });
    //INSERINDO O NOME DOS CLUBES NO DROPDOWN MENU
    nomesDosTimes.forEach(function(d) {
        $("ul.sub-menu").append("<li class='timeBrasileirao'><a href=\"javascript:void(0)\">" + d + "</a></li>");
    });

    //CRIANDO UM ARRAY DE OBJETOS COM OS TIMES E SEUS RESPECTIVOS VALORES
    var times = nomesDosTimes.map(function(nomeTime) {
        return {
            nome : nomeTime,
            valores : dados['time'].map(function(d,i) {
                if (d == nomeTime) {
                    return {
                        data: dados["data_fake"][i],
                        data_real: dados["data"][i],
                        indice: dados["rating"][i]
                    };
                }
            })
        };
    });

    var saida = [];

    times.forEach(function (d) {
        var item = {"nome": d["nome"]}
        item["valores"] = d['valores'].filter(function (el) {
            return el
        });
        saida.push(item)

    });

    /*var times_filtrado = [];
    saida.forEach(function (d) {
        if (escudos.indexOf(d.nome) >= 0) {
            times_filtrado.push(d)
        }
    });*/

    //faz um array contrário de campeoes
    campeoes_inverse = {};
    for (var ano in campeoes) {
        var time = campeoes[ano];
        if (!(time in campeoes_inverse)) {
            campeoes_inverse[time] = [];
        }
        campeoes_inverse[time].push(parseInt(ano))
    }

    return saida;
}

function comeca_tudo(data) {
    times = conserta_dados(data);


    //SELECIONA E MOSTRA A LINHA ESCUDO AO CARREGAR A PÁGINA
    selecionaLinha(traducao[$("#menuEscudos01").children()[0].id]);

    //gambiarra para não dar zoom além dos anos dos dados
    dominio_x = d3.extent(data[1]['data_fake'], function(d) { return d; })
    panExtent = {x: dominio_x, y: [-10000,400000] };

    bisectDate = d3.bisector(function(d) { return d.data; }).left;

    x = d3.time.scale()
        .domain(dominio_x)
        .range([0, width]);

    y = d3.scale.linear()
        .domain([
            d3.min(times, function(t) { return d3.min(t.valores, function(v) { return v.indice; }); }),
            d3.max(times, function(t) { return d3.max(t.valores, function(v) { return v.indice; }); })
        ])
        .range([height, 0]);

    x2 = d3.time.scale()
        .domain(x.domain())
        .range([0, width]);

    y2 = d3.scale.linear()
        .range([height2,0])
        .domain(y.domain());

    var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(d3.time.years, 4),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom").ticks(d3.time.years, 2),
        yAxis = d3.svg.axis().scale(y).orient("left");

    var brush = d3.svg.brush()
        .x(x2)
        .extent(x2.domain())
        .on("brush", brushed);

    var arc = d3.svg.arc()
        .outerRadius(height2 / 2)
        .startAngle(0)
        .endAngle(function(d, i) { return i ? -Math.PI : Math.PI; });

    line = d3.svg.line()
        .interpolate("cardinal")
        .defined(function(d) {  return d.indice != null; })
        .x(function(d) {
            return x(d.data);
        })
        .y(function(d) {
            return y(d.indice);
        });

    line2 = d3.svg.line()
        .interpolate("linear")
        .defined(function(d) { return d.indice != null; })
        .x(function(d) {
            return x2(d.data);
        })
        .y(function(d) {
            return y2(d.indice);
        });

    svg = d3.select("#grafico")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    focus.append("g")
        .selectAll('.times')
        .data(times)
        .enter().append("g")
        .attr("class", "times")
        .append('path')
        .attr("class", function (d,i) {
            return "line " + d.nome.replace(' ','-')
        })
        .attr("opacity", 0.7)
        .attr("d", function(d) { return line(d.valores); })
        /*.on("mouseover", mostra_tooltip)
        .on("mouseout", function(d, i) {
            tooltip.style("opacity", 0)
        })
        .on("click", function(d) {
            selecionaLinha(d.nome);
            mostraLinha(timeEscolhido, linhaSelecionada, false);
        });*/

    eixo_x = focus.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    context.append("path")
        .datum(times[timeEscolhido].valores)
        .attr("class", "line_aux")
        .attr("d", line2);

    context.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    brushg = context.append("g")
        .attr("class", "x brush")
        .call(brush);

    brushg.selectAll(".resize").append("path")
        .attr("transform", "translate(0," +  height2 / 2 + ")")
        .attr("d", arc);

    brushg.selectAll("rect")
        .attr("height", height2 );

    linha_tooltip = focus.append('line')
        .attr("class","linha_tooltip")
        .style("opacity",0)
        .style("stroke","black")
        .style("stroke-dasharray","5,5");

    //linha da média
    focus.append('line')
        .attr("class","linha_media")
        .style("opacity",1)
        .style("stroke","#505050")
        .style("stroke-dasharray","10,10")
        .attr("x1",x.range()[0])
        .attr("x2",x.range()[1])
        .attr("y1",y(946))
        .attr("y2",y(946));

    //mouseover
    focus.append('rect')
        .attr("class","overlay")
        .attr('opacity',0)
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", mousemove)
        .on("mouseout", function(d, i) {
            tooltip_jogo.style("opacity", 0);
            linha_tooltip.style("opacity",0);
        });

    //destaca a linha
    mostraLinha(timeEscolhido, linhaSelecionada, false);

    //importa o svg da tacinha
    var svg_name = "img/trophy.svg";
    d3.xml(svg_name, function(xml) {

        // Take xml as nodes.
        imported_node = document.importNode(xml.documentElement, true);
        coloca_tacinhas();

    });


    function brushed() {
        //arruma a data do grafico de cima
        x.domain(brush.empty() ? x2.domain() : brush.extent());

        //mostra os ticks de todos os anos se for menos que dez anos no grafico
        if (x.domain()[1].getFullYear() - x.domain()[0].getFullYear() < 11) {
            xAxis.ticks(d3.time.years, 1)
        } else {
            xAxis.ticks(d3.time.years, 4)
        }

        //redesenha
        focus.selectAll(".line").attr("d", function(d) { return line(d.valores); });
        focus.select(".x.axis").call(xAxis);

        //leva os ticks do eixo X pro meio dos anos
        var pixels = x(new Date('07/01/1990')) - x(new Date('01/01/1990'))
        eixo_x.selectAll('text').attr('transform','translate('+pixels+',0)')
        eixo_x.selectAll('line').attr('transform','translate('+pixels+',0)')

        //muda a tacinha de lugar
        focus.selectAll(".tacinha")
            .attr("transform", function(d,i){
                return "translate(" + (x(d.data))  + "," + (height-30)  + ") scale(0.05)";
            });

    }

    //esconde o loading
    $('#loading').hide();

}

function mostra_tooltip_taca (element, i) {
    tooltip_jogo.style("opacity", 0);
    linha_tooltip.style("opacity",0);

    tooltip.transition()
        .style("opacity", .9)
        .text("CAMPEÃO EM: "+element.data.getFullYear());
    tooltip
        .style("left", (d3.event.pageX+5) + "px")
        .style("top", (d3.event.pageY-30) + "px");

    tooltip_jogo.style("opacity", 0);
    linha_tooltip.style("opacity",0);

}

//FUNCAO PARA ADICIONAR OS ESCUDOS DOS TIMES
function adiciona_escudos() {
    var html_base = function (time) { return '<li id="'+time+'"><a class="escudo" title="'+time+'" id="escudo_'+time+'" href="javascript:void(0)"><img src="img/escudos/'+time+'.png"></a></li>' }
    var menu1 = $("#menuEscudos01")
    var menu2 = $("#menuEscudos02")
    escudos.forEach(function (d,i) {
        if (i < 10) {
            menu1.append(html_base(d))
        } else {
            menu2.append(html_base(d))
        }
    })
}

//FUNCAO CHAMADA QUANDO O DOCUMENTO ESTA PRONTO
$(document).ready(function(){
  adiciona_escudos();

  //CASO ALGUM ITEM DO MENU SEJA SELECIONADO
  $(".sub-menu").click(function(event) {

    //ARMAZENA O INDEX DO TIME ESCOLHIDO
    timeEscolhido = $(event.target).parent().index();

    //ARMAZENA A LINHA ESCOLHIDA
    linhaSelecionada = $(".line")[timeEscolhido];
    //linhaSelecionada = d3.selectAll(".linhaTime .linha")[0][timeEscolhido]; //MESMO EFEITO REALIZADO COM D3

    mostraLinha(timeEscolhido, linhaSelecionada, true);
    redesenha_linha();
    coloca_tacinhas();

  });

    //CASO ALGUM ESCUDO SEJA ESCOLHIDO
  $(".menuEscudos li").click(function(e) {
    //e.preventDefault();
    var nomeEscudoSelecionado = traducao[$(this).attr("id")];

    selecionaLinha(nomeEscudoSelecionado);
    mostraLinha(timeEscolhido, linhaSelecionada, true);
    redesenha_linha();
    coloca_tacinhas();

  });

    //CODIGO REFERENTE À BARRA DE PESQUISA DE TIMES
    $("#search-box").keyup(function(){

        //ARMAZENA A ENTRADA DE TEXTO E RESETA A CONTAGEM PARA ZERO
        var filter = $(this).val();
        var count = 0;

        //PERCORRE O ARRAY COM A LISTA DE TIMES
        $(".sub-menu li").each(function(){
          
          //SE O ITEM NÃO CONTÉM O TEXTO, ELE É APAGADO
          if ($(this).text().search(new RegExp(filter, "i")) < 0) {
            
            $(this).fadeOut();
          
          } 
          
          //MOSTRA O ITEM SE O TEXTO COINCIDE E ADICIONA MAIS UM AO CONTADOR
          else {

            $(this).show();
            count++;
          
          }

        });

        if (filter.length > 0) {
            $(".sub-menu").css("opacity", 1);
            $(".sub-menu").css("z-index", 1);
        }

        else {
            $(".sub-menu").css("z-index", 0);
            $(".sub-menu").css("opacity", 0);
        }

        if (count < 10) {
            console.log("menos de dez itens!");
        }

    });
    
    //ATIVA A BARRA DE PESQUISA COM O PASSAR DO MOUSE
    $(".search-icon").mouseover(function() {
        $(".search-box").focus();
    });

});

function redesenha_linha() {
    d3.selectAll(".line_aux").remove();
    context.append("path")
        .datum(times[timeEscolhido].valores)
        .attr("class", "line_aux")
        .attr("d", line2);
}

function selecionaLinha (nome) {
  //CHECA A LINHA SELECIONADA
    times.forEach(function(time, index){
      if (time.nome == nome) {
        timeEscolhido = index;
        //ARMAZENA A LINHA ESCOLHIDA
        linhaSelecionada = $(".line")[timeEscolhido];

      }

  });
}

function arruma_destaque_linhas() {
    //DIMINUI A OPACIDADE DE TODAS AS LINHAS DE ACORDO COM O NÍVEL DE ZOOM, ALEM DE MUDAR COR
    /*if (zoom.scale() <= 3) {
        $('.line').each(function (i,d) {
            var time = $(d).attr("class").split(" ")[1];
            if (escudos.indexOf(time) > 0) {
                $(d).attr("opacity", function(d) {return 0.6});
                $(d).css("stroke", function(d) { return "rgb(127, 127, 127)"});
                $(d).css("stroke-width", function(d) { return ".5px"});
            } else {
                $(d).attr("opacity", function(d) {return 0});
            }
        })
    } else if (zoom.scale() <= 10) {
        $('.line').each(function (i,d) {
            var time = $(d).attr("class").split(" ")[1];
            if (escudos.indexOf(time) > 0) {
                $(d).attr("opacity", function(d) {return 0.6});
                $(d).css("stroke", function(d) { return "rgb(127, 127, 127)"});
                $(d).css("stroke-width", function(d) { return ".5px"});
            } else {
                $(d).attr("opacity", function(d) {return 0.2});
            }
        })
    }
    else {*/
        $(".line").attr("opacity", function(d) {return 0.4});
        $(".line").css("stroke", function(d) { return "rgb(127, 127, 127)"});
        $(".line").css("stroke-width", function(d) { return ".5px"});
    //}
    //AUMENTA A OPACIDADE DA LINHA SELECIONADA
    //ALTERA A COR DA LINHA SELECIONADA
    //DESLOCA ELA PARA CIMA DAS OUTRAS
    var linha_destaque = $('.'+times[timeEscolhido].nome.replace(' ','-'))
    linha_destaque.attr("opacity", 1);
    linha_destaque.css("stroke", "rgb(255, 102, 0)");
    linha_destaque.css("stroke-width", function(d) { return "1.5px" });

}

function coloca_tacinhas() {
    focus.selectAll('.tacinha').remove();

    //faz um array com o primeiro jogo do time escolhido nos anos que ele foi campeão
    var time = times[timeEscolhido].nome;
    if (time in campeoes_inverse) {
        var ano_campeao = campeoes_inverse[time];
        var primeiros_jogos = [];
        ano_campeao.forEach(function (ano) {
            primeiros_jogos.push({'data':new Date('06/01/'+ano)})
        });

        //coloca os svg no node do primeiro jogo
        focus.selectAll(".svg_image")
            .data(primeiros_jogos)
            .enter()
            .append("g")
            .attr("class","tacinha")
            .each(function(d,i){
                var imported_svg = this.appendChild(imported_node.cloneNode(true));
            })
            .attr("transform", function(d,i){
                return "translate(" + (x(d.data)-45)  + "," + (height-30)  + ") scale(0.05)";
            })
            .append("rect")
            .attr("width",500)
            .attr("height",500)
            .attr("opacity",0)
            .on('mouseover',mostra_tooltip_taca)
            .on('click',mostra_tooltip_taca)
            .on("mouseout", function(d, i) {
                tooltip.style("opacity", 0)
            })
            .attr("transform", function(d,i){
                return "translate(" + (x(d.data)+600)  + "," + (height-350)  + ")";
            });
    }

    /*var time = times[timeEscolhido].nome;

    for (var ano in campeoes) {
        if (campeoes[ano] == time) {
            var infos = acha_ultimo_jogo(ano,time);
            console.log(infos);
            console.log(x(infos.data),y(infos.rating));

            tacinha = focus.append("use")
                .attr("xlink:href", "#taca")
                .attr('class','tacinha')
                .attr('x',x(infos.data))
                .attr('y',y(infos.rating));

            var box = tacinha.node().getBBox();
            var cx = box.x + box.width/2;
            var cy = box.y + box.height/2;

            tacinha.attr("transform", "translate(-" + cx + " -" + cy + ") scale(1) translate(" + (cx) + " " + (cy) + ")");
                //.attr("transform","matrix(0.1 0 0 0.1 "+cx+" "+cy+")")


        }
    }*/
}


function mostraLinha (timeEscolhido, linhaSelecionada, animaTela) {
  arruma_destaque_linhas();

  //ADICIONA OS CIRCULOS DE REFERENCIA DA LINHA SELECIONADA    
  //criaCirculos(timeEscolhido);

  //ADICIONANDO A LEGENDA ACIMA DO GRAFICO
  $("#nomeTimeSelecionado").text(times[timeEscolhido].nome + " | Campeão em: " + campeoes_inverse[times[timeEscolhido].nome].join(" - ") );


  //tira destaque de todos os escudos e destaca só o escolhido agora
  //$('.escudo').css('border-style','');
  //$("#escudo_"+times[timeEscolhido].nome).css('border-style','solid');

  if (animaTela) {
    $('html, body').delay(60).animate({
       scrollTop: $("#menuEscudos01").offset().top
    }, 500, 'easeInOutCubic');
  }

}

//APAGA OS VALORES DA BARRA DE PESQUISA
function resetSearchBar () {

    $(".search-box")
    .not(':button, :submit, :reset, :hidden')
    .val('')
    .removeAttr('checked')
    .removeAttr('selected');

}


function mousemove() {
    var dados = times[timeEscolhido].valores,
        coordenadas = d3.mouse(this),
        x0 = x.invert(coordenadas[0]),
        i = bisectDate(dados, x0, 1),
        d0 = dados[i - 1],
        d1 = dados[i]
    if (d1) {
        var d = x0 - d0.data > d1.data - x0 ? d1 : d0;
        if (d.indice) {
            var texto = "<p>"+times[timeEscolhido].nome + "</p><p>Data: "+ d.data.getDay()+"/"+ d.data.getMonth()+"/"+ d.data.getFullYear()+"</p><p>Ranking:"+ d.indice+"</p>"
            linha_tooltip.style("opacity",0.8)
                .attr("x1",coordenadas[0])
                .attr("y1",Math.min(coordenadas[1],250))
                .attr("x2",coordenadas[0])
                .attr("y2",y(d.indice));
            tooltip_jogo.transition()
                .style("opacity", .9)
            tooltip_jogo
                .html(texto)
                .style("left", Math.min(d3.event.pageX -30,width-50) + "px")
                .style("top", Math.min(d3.event.pageY -50,650) + "px");
        }



    }



}