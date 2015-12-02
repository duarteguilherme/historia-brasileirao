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
      .style("background", function(d) {return "rgb(239,239,239)"})
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
        return traducao_time[d];
    });

    //ARMAZENANDO O TOTAL DE TIMES
    nomesDosTimes = data[0]['time'];

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

    var times_filtrado = [];
    saida.forEach(function (d) {
        if (escudos.indexOf(d.nome) >= 0) {
            times_filtrado.push(d)
        }
    });

    return times_filtrado;
}

function comeca_tudo(data) {
    times = conserta_dados(data);

    //SELECIONA E MOSTRA A LINHA ESCUDO AO CARREGAR A PÁGINA
    selecionaLinha($("#menuEscudos01").children()[0].id);

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

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
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


    svg.append('rect')
        .attr("class","overlay")
        .attr('opacity',0)
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", mousemove)
        .on("mouseout", function(d, i) {
            tooltip_jogo.style("opacity", 0);
            linha_tooltip.style("opacity",0);
        });


    var focus = svg.append("g")
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
            return "line " + d.nome
        })
        .attr("opacity", 0.7)
        .attr("d", function(d) { return line(d.valores); })
        .on("mouseover", mostra_tooltip)
        .on("mouseout", function(d, i) {
            tooltip.style("opacity", 0)
        })
        .on("click", function(d) {
            selecionaLinha(d.nome);
            mostraLinha(timeEscolhido, linhaSelecionada, false);
        });

    focus.append("g")
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

    mostraLinha(timeEscolhido, linhaSelecionada, false);

    function brushed() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.selectAll(".line").attr("d", function(d) { return line(d.valores); });
        focus.select(".x.axis").call(xAxis);
    }
    //esconde o loading
    $('#loading').hide();

}

function mostra_tooltip (element, i) {
    tooltip.transition()
        .style("opacity", .9)
        .text(element['nome'])
    tooltip
        .style("left", (d3.event.pageX+5) + "px")
        .style("top", (d3.event.pageY-30) + "px");
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

  });

    //CASO ALGUM ESCUDO SEJA ESCOLHIDO
  $(".menuEscudos li").click(function(e) {
    //e.preventDefault();
    var nomeEscudoSelecionado = $(this).attr("id");

    selecionaLinha(nomeEscudoSelecionado);
    mostraLinha(timeEscolhido, linhaSelecionada, true);
    redesenha_linha();

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
        $(".line").attr("opacity", function(d) {return 0.6});
        $(".line").css("stroke", function(d) { return "rgb(127, 127, 127)"});
        $(".line").css("stroke-width", function(d) { return ".5px"});
    //}
    //AUMENTA A OPACIDADE DA LINHA SELECIONADA
    //ALTERA A COR DA LINHA SELECIONADA
    //DESLOCA ELA PARA CIMA DAS OUTRAS
    var linha_destaque = $('.'+times[timeEscolhido].nome)
    linha_destaque.attr("opacity", 1);
    linha_destaque.css("stroke", "rgb(255, 102, 0)");
    linha_destaque.css("stroke-width", function(d) { return "1.5px" });

}

function mostraLinha (timeEscolhido, linhaSelecionada, animaTela) {
  arruma_destaque_linhas();

  //ADICIONA OS CIRCULOS DE REFERENCIA DA LINHA SELECIONADA    
  //criaCirculos(timeEscolhido);

  //ADICIONANDO A LEGENDA ACIMA DO GRAFICO
  $("#nomeTimeSelecionado").text(times[timeEscolhido].nome /*+ " | Fundado em: | Vencedor de x Campeonatos Brasileiros"*/);

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
        d1 = dados[i],
        d = x0 - d0.data > d1.data - x0 ? d1 : d0;

    if (d.indice) {
        var texto = "<p>"+times[timeEscolhido].nome + "</p><p>Data: "+ d.data.getDay()+"/"+ d.data.getMonth()+"/"+ d.data.getYear()+"</p><p>Ranking:"+ d.indice+"</p>"
        linha_tooltip.style("opacity",0.8)
            .attr("x1",coordenadas[0])
            .attr("y1",coordenadas[1])
            .attr("x2",coordenadas[0])
            .attr("y2",y(d.indice));
        tooltip_jogo.transition()
            .style("opacity", .9)
        tooltip_jogo
            .html(texto)
            .style("left", (d3.event.pageX+15) + "px")
            .style("top", (d3.event.pageY) + "px");
    }

}