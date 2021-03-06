//DIMENSOES DO GRAFICO
var margin = {top: 10, right: 25, bottom: 100, left: 40},
    width = Math.min(window.innerWidth - margin.right - margin.left - 20,1500),
    margin2 = {top: 430, right: 25, bottom: 20, left: 40},
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
    1987:['SPORT','FLAMENGO'],
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

//função para checar se array é unique
function uniq(a) {
    var seen = {};
    return a.filter(function(item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

//função para replace all
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function inicia() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    // If Internet Explorer, return version number
    if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)) {
        var ie_version = parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)));
        alert('Este gráfico não funciona no Internet Explorer. Favor tentar em outro browser, como Chrome ou Firefox');
    }
    //se não for IE, começa tudo
    else
        d3.json ("data/dadosfull.json", comeca_tudo);
}

function conserta_dados(data) {
    var traducao_time = {};
    data[0]['time'].map(function (d,i) {
        traducao_time[i+1] = d;
    });

    var dados = data[1];

    //PARSEANDO A DATA FAKE PARA O FORMATO DE DATA PARA ENTRAR NO EIXO X
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
    nomesDosTimes = uniq(data[0]['time']);
    nomesDosTimes = nomesDosTimes.map(function (d) { return traducao[d] });

    //INSERINDO O NOME DOS CLUBES NO DROPDOWN MENU
    var i = 0;
    nomesDosTimes.forEach(function(d) {
        $("#lista_times").append("<option id="+i+">" + d + "</option>");
        i++;
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
        //transforma todos os valores em array, e não faz nada com os q já são (1987, qnd houve 2 campeoes)
        var times_campeoes = [].concat(campeoes[ano]);
        times_campeoes.forEach(function (time) {
            if (!(time in campeoes_inverse)) {
                campeoes_inverse[time] = [];
            }
            campeoes_inverse[time].push(parseInt(ano))
        })
    }

    return saida;
}

function comeca_tudo(data) {
    times = conserta_dados(data);
    adiciona_escudos();

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
            return "line " + replaceAll(d.nome,' ','-');
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

    focus.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .style("font-weight","bold")
        .text("PONTUAÇÃO ELO");


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

    focus.append("text")
        .attr("class", "linha_media label")
        .attr("text-anchor", "start")
        .attr("fill","black")
        .attr("y", y(946)+12)
        .attr("dx", ".4em")
        .style("font-weight","bold")
        .text("MÉDIA GERAL HISTÓRICA");

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
            .transition()
            .attr("transform", function(d,i){
                return "translate(" + (x(d.data)-width/60)  + "," + (height-30)  + ") scale(0.05)";
            });

        //e o textinho também
        /*
        focus.selectAll(".titulo_tacinha")
            .attr("transform", function (d,i) {
                return "translate("+(x(d.data)) +",0)"
            });*/

        focus.selectAll(".titulo_tacinha")
            .selectAll('text')
            .transition()
            .attr("x",function (d) {
                return x(d.data)+2;
            })

    }

    //arruma o padding do título pra se alinhar ao do gráfico

    $(".imagem").css("padding-left",svg.node().getBoundingClientRect()['left']+margin.left)

    //esconde o loading
    $('#loading').hide();

}

//FUNCAO PARA ADICIONAR OS ESCUDOS DOS TIMES
function adiciona_escudos() {
    var html_base = function (time) { return '<li id="'+time+'"><a class="escudo" title="'+traducao[time]+'" id="escudo_'+time+'" href="javascript:void(0)"><img src="img/escudos/'+time+'.png"></a></li>' }
    var menu1 = $("#menuEscudos01")
    var menu2 = $("#menuEscudos02")
    escudos.forEach(function (d,i) {
        if (i < 10) {
            menu1.append(html_base(d))
        } else {
            menu2.append(html_base(d))
        }
    })

    //CASO ALGUM ESCUDO SEJA ESCOLHIDO
    $(".menuEscudos li").click(function(e) {
        //e.preventDefault();
        var nomeEscudoSelecionado = traducao[$(this).attr("id")];

        selecionaLinha(nomeEscudoSelecionado);
        mostraLinha(timeEscolhido, linhaSelecionada, true);
        redesenha_linha();
        coloca_tacinhas();

    });
}



function formata_numero(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

//FUNCAO CHAMADA QUANDO O DOCUMENTO ESTA PRONTO
$(document).ready(function(){
    //abre metodologia no clique em AQUI
    $("#clique_calculo").click(function () {
        //mostra o div
        $("#calculo").css('display','block')
        //scroll pro div
        $('html, body').delay(60).animate({
            scrollTop: $("#calculo").offset().top - 50
        }, 500, 'easeInOutCubic');
        //todo o fundo cinza
        $('#overlay').fadeIn(300);
        $('#calculo').css('z-index', '99999');
    });

    $("#fecha_calculo").click(function () {
        $("#calculo").css('display','none')
        $('#overlay').fadeOut(300);
        $('#calculo').css('z-index', '1');
    })


  //CASO ALGUM ITEM DO MENU SEJA SELECIONADO
    $('#lista_times').change(function() {
        timeEscolhido =  $(this).children(":selected").attr("id");
        linhaSelecionada = $(".line")[timeEscolhido];
        mostraLinha(timeEscolhido, linhaSelecionada, true);
        redesenha_linha();
        coloca_tacinhas();
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
        $(".line").attr("opacity", function(d) {return 0.3});
        $(".line").css("stroke", function(d) { return "rgb(127, 127, 127)"});
        $(".line").css("stroke-width", function(d) { return ".5px"});
    //}
    //AUMENTA A OPACIDADE DA LINHA SELECIONADA
    //ALTERA A COR DA LINHA SELECIONADA
    //DESLOCA ELA PARA CIMA DAS OUTRAS
    var linha_destaque = $('.'+ replaceAll(times[timeEscolhido].nome,' ','-'))
    linha_destaque.attr("opacity", 1);
    linha_destaque.css("stroke", "rgb(255, 102, 0)");
    linha_destaque.css("stroke-width", function(d) { return "1.5px" });

}

function coloca_tacinhas() {
    //retira as tacinhas e a legenda se tiver
    tooltip.style("opacity", 0);
    focus.selectAll('.tacinha').remove();
    focus.selectAll('.titulo_tacinha').remove();

    //faz um array com o primeiro jogo do time escolhido nos anos que ele foi campeão
    var time = times[timeEscolhido].nome;
    if (time in campeoes_inverse) {
        var ano_campeao = campeoes_inverse[time];
        var primeiros_jogos = [];
        ano_campeao.forEach(function (ano) {
            primeiros_jogos.push({'data':new Date('06/01/'+ano)})
        });

        //coloca os svg no node do primeiro jogo
        tacinhas = focus.selectAll(".svg_image")
            .data(primeiros_jogos)
            .enter()
            .append("g")
            .attr("class","tacinha")
            .attr("transform", function(d,i){
                return "translate(" + (x(d.data)-width/60)  + "," + (height-30)  + ") scale(0.05)";
            })
            .each(function(d,i){
                var imported_svg = this.appendChild(imported_node.cloneNode(true));
            });

        focus.selectAll(".titulo_tacinha")
            .data(primeiros_jogos)
            .enter()
            .append("g")
            .attr("class","titulo_tacinha")
            .append("text").text(function (d) {
                return d.data.getFullYear();
            })
            .attr("x", function(d,i){
                return x(d.data)+2;
            })
            .attr("y", function (d) {
                return height-32;
            })

    }
}


function mostraLinha (timeEscolhido, linhaSelecionada, animaTela) {
  arruma_destaque_linhas();

  //ADICIONA OS CIRCULOS DE REFERENCIA DA LINHA SELECIONADA    
  //criaCirculos(timeEscolhido);

  //ADICIONANDO A LEGENDA ACIMA DO GRAFICO
    var time = times[timeEscolhido].nome;
    var campeao_em = time in campeoes_inverse ? " || Campeão em: "+ campeoes_inverse[time].join(" - ") : "";
    $("#nomeTimeSelecionado").html(times[timeEscolhido].nome + campeao_em );

  //tira destaque de todos os escudos e destaca só o escolhido agora
  //$('.escudo').css('border-style','');
  //$("#escudo_"+times[timeEscolhido].nome).css('border-style','solid');

  if (animaTela) {
    $('html, body').delay(60).animate({
       scrollTop: $("#menuEscudos01").offset().top
    }, 500, 'easeInOutCubic');
  }

}

function mousemove() {
    var distancia_svg = svg.node().getBoundingClientRect();
    var dados = times[timeEscolhido].valores,
        coordenadas = d3.mouse(this),
        x0 = x.invert(coordenadas[0]),
        i = bisectDate(dados, x0, 1),
        d0 = dados[i - 1],
        d1 = dados[i];
    if (d1) {
        var d = x0 - d0.data > d1.data - x0 ? d1 : d0;
        if (d.indice) {
            var data = [d.data_real.substring(4,6), d.data_real.substring(2,4), d.data_real.substring(0,2)];
            var texto = "<p>"+times[timeEscolhido].nome + "</p><p>Data: "+ data[0] +"/"+ data[1] +"/"+ data[2]+"</p><p>Pontos: "+ formata_numero(d.indice)+"</p>"
            linha_tooltip.style("opacity",0.8)
                .attr("x1",coordenadas[0])
                .attr("y1",340)
                .attr("x2",coordenadas[0])
                .attr("y2",y(d.indice));
            tooltip_jogo.transition().duration(100)
                .style("opacity", .9)
            tooltip_jogo
                .html(texto)
                .style("left", Math.min(d3.event.pageX -30,width+distancia_svg['left']-20) + "px")
                .style("top", 620 + "px");


        }
    }
}


inicia();

