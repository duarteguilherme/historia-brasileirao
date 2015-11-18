
//DIMENSOES DO GRAFICO
var margin = {top: 10, right: 55, bottom: 30, left: 50},
    // width = 1040 - margin.left - margin.right,
    w = window.innerWidth - 20,
    width = window.innerWidth - margin.right - margin.left - 20,
    height = 500 - margin.top - margin.bottom;
    //para o gráfico menor
    height_2 = 200 - margin.top - margin.bottom;

//CODIGO REFERENTE AO DRAG
/*var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);*/

//FORMATO DE PARSEMENTO DOS DADOS DE DATA
var parseData = d3.time.format("%y%m%d").parse;

var timeEscolhido; //ARMAZENA O TIME ESCOLHIDO PELO USUARIO NO MENU
var linhaSelecionada; //ARMAZENA A LINHA ESCOLHIDA A PARTIR DO TIME ESCOLHIDO PELO USUARIO NO MENU
var nomesDosTimes; //ARMAZENA O NOME DOS TIMES; VARIAVEL DE APOIO PARA CHECAGEM E ITERACAO
var times; //ARMAZENA CADA OBJETO-TIME INTEIRO COM SEUS RESPECTIVOS VALORES (DATAS E INDICES)
var dados;
var circulos; //ADICIONADOS AO GRAFICO QUANDO O USUARIO SELECIONA UMA LINHA ESPECIFICA
//TOOLTIP COM INFORMACOES A SEREM APRESENTADAS AO USUARIO
var tooltip = d3.select("body").append("div")
      .attr("class", "infoTooltip")
      .style("position", "absolute")
      .style("padding", "4px 8px")
      .style("background", function(d) {return "rgb(239,239,239)"})
      .style("opacity", 0);

//funções e variáveis para eixos e linhas
var make_x_axis = function () {
    return d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(5);
};

var make_y_axis = function () {
    return d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);
};


//baixa os dados e chama a função de começar
d3.json ("data/dadosfull.json", comeca_tudo);

function conserta_dados(data) {
  console.log(data);
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
        $("ul.sub-menu").append("<li class=\"timeBrasileirao" + " " + d + "\"><a href=\"javascript:void(0)\">" + d + "</a></li>");
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

    var saida = []
    times.forEach(function (d) {
        var item = {"nome": d["nome"]}
        item["valores"] = d['valores'].filter(function (el) {
            //console.log(el)
            return el
        });
        saida.push(item)

    })
    return saida;
}


function comeca_tudo(data) {
    times = conserta_dados(data);

    x = d3.time.scale()
        .domain(d3.extent(data[1]['data_fake'], function(d) { return d; }))
        .range([0, width]);

    y = d3.scale.linear()
        .domain([
            d3.min(times, function(t) { return d3.min(t.valores, function(v) { return v.indice; }); }),
            d3.max(times, function(t) { return d3.max(t.valores, function(v) { return v.indice; }); })
        ])
        .range([height, 0]);

    xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(d3.time.years, 1);

    yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    line = d3.svg.line()
        .interpolate("linear")
        .defined(function(d) {  return d.indice != null; })
        .x(function(d) {
            return x(d.data);
        })
        .y(function(d) {
            return y(d.indice);
        });

    zoom = d3.behavior.zoom()
        .x(x)
        .scaleExtent([1, 20])
        .on("zoom", zoomed);

    //primeiro grafico
    svg = d3.select("#grafico1")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .on("mousedown", clickGrafico)
        .call(zoom);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .attr('class','plot')
        .style("pointer-events", "all");

    svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat(""));

    svg.append("g")
        .attr("class", "y grid")
        .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat(""));

    var clip = svg.append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

    var chartBody = svg.selectAll('.times')
        .data(times)
        .enter().append("g")
        .attr("class","times")

    chartBody.append("path")
        .attr("class", "line")
        .attr("opacity", 0.7)
        .attr("d", function(d) { return line(d.valores); })
        .style("stroke-width", function() { return ".5px"; })
        .style("stroke", function() { return "rgb(127, 127, 127)"; })
        //tooltip on
        .on("mouseover", function(element, i) {
            if(zoom.scale() > 4 && $(".circulo").length > 0) {  }
            else {
                tooltip.transition()
                    .style("opacity", .9)
                    .text(nomesDosTimes[i])
                tooltip
                    .style("left", (d3.event.pageX+5) + "px")
                    .style("top", (d3.event.pageY-30) + "px");
            }
        })
        .on("mouseout", function(d, i) {
            tooltip.style("opacity", 0)
        })
        .on("click", function(d) {
          console.log("uma linha selecionada com o click do mouse.");
          selecionaLinha(d.nome);
          mostraLinha(timeEscolhido, linhaSelecionada, false);
        })

    //ELEMENTO PARA AGRUPAR OS CIRCULOS DE REFERENCIA
    circulos = svg.append("g")
        .attr("class", "circulos");

    //agora criamos o grafico menor
    y_2 = d3.scale.linear()
        .range([height_2,0])
        .domain([
            d3.min(times, function(t) { return d3.min(t.valores, function(v) { return v.indice; }); }),
            d3.max(times, function(t) { return d3.max(t.valores, function(v) { return v.indice; }); })
        ]);

    yAxis_2 = d3.svg.axis()
        .scale(y_2)
        .orient("left");

    line_2 = d3.svg.line()
        .interpolate("linear")
        .defined(function(d) { return d.indice != null; })
        .x(function(d) {
            return x(d.data);
        })
        .y(function(d) {
            return y_2(d.indice);
        });

    svg_2 = d3.select("#grafico2")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height_2 + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg_2.append("rect")
        .attr("width", width)
        .attr("height", height_2)
        .style("fill", "none")
        .attr('class','plot')
        .style("pointer-events", "all");

    svg_2.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height_2 + ")")
        .call(xAxis);

    svg_2.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0," + height_2 + ")")
        .call(make_x_axis()
            .tickSize(-height_2, 0, 0)
            .tickFormat(""));

    svg_2.append("g")
        .attr("class", "y grid")
        .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat(""));

    //SELECIONA E MOSTRA A LINHA ESCUDO AO CARREGAR A PÁGINA
    selecionaLinha($("#menuEscudos01").children()[0].id);
    mostraLinha(timeEscolhido, linhaSelecionada, false);

    svg_2.append("path")
        .datum(times[timeEscolhido].valores)
        .attr("class", "line_aux")
        .attr("d", line_2);

}

function zoomed () {
    svg.select(".x.axis").call(xAxis);
    svg.select(".y.axis").call(yAxis);
    svg.select(".x.grid")
        .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat(""));
    svg.select(".y.grid")
        .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat(""));
    svg.selectAll(".times").selectAll(".line")
        .attr("class", "line")
        .attr("d", function(d) { return line(d.valores); });
    svg.selectAll(".circulos").selectAll('.circulo')
        .attr("class", "circulo " + times[timeEscolhido].nome)
        .attr("cx", function (d) {
            return x(d.data);
        })
        .attr("cy", function (d) {
            return y(d.indice);
        })
        .attr("r", 1)
        .style("opacity" , 1);
}

//FUNCAO PARA ADICIONAR OS ESCUDOS DOS TIMES
function adiciona_escudos() {
    var escudos = ['atleticomg','atleticopr','avai','chapecoense','corinthians','coritiba','cruzeiro','figueirense','flamengo','fluminense','goias','gremio','internacional','joinville','palmeiras','pontepreta','santos','saopaulo','sport','vasco']
    var html_base = function (time) { return '<li id="'+time+'"><a class="escudo" id="escudo_'+time+'" href="javascript:void(0)"><img src="img/escudos/'+time+'.png"></a></li>' }
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

    //ATUALIZA O CONTADOR
    var numberItems = count;
    $("#filter-count").text("Times = "+count);
  
  });

});

function redesenha_linha() {
    d3.selectAll(".line_aux").remove();
    svg_2.append("path")
        .datum(times[timeEscolhido].valores)
        .attr("class", "line_aux")
        .attr("d", line_2);

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

function mostraLinha (timeEscolhido, linhaSelecionada, animaTela) {

  //DIMINUI A OPACIDADE DE TODAS AS LINHAS
  //RETORNA A COR DE TODAS AS LINHAS PARA O CINZA
  $(".line").attr("opacity", function(d) {return 0.7});
  $(".line").css("stroke", function(d) { return "rgb(127, 127, 127)"});
  $(".line").css("stroke-width", function(d) { return ".5px"});

  //AUMENTA A OPACIDADE DA LINHA SELECIONADA
  //ALTERA A COR DA LINHA SELECIONADA
  //DESLOCA ELA PARA CIMA DAS OUTRAS
  $(linhaSelecionada).attr("opacity", 1);
  $(linhaSelecionada).css("stroke", "rgb(255, 102, 0)");
  $(linhaSelecionada).css("stroke-width", function(d) { return ".5px" });

  //ADICIONA OS CIRCULOS DE REFERENCIA DA LINHA SELECIONADA    
  criaCirculos(timeEscolhido);

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

//FUNCOES REFERENTES AO ZOOM/DRAG

/*
function dragstarted(d) {
  d3.event.sourceEvent.stopPropagation();
  d3.select(this).classed("dragging", true);
}

function dragged(d) {
  d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
}

function dragended(d) {
  d3.select(this).classed("dragging", false);
}
*/

//FEEDBACK VISUAL DO CLICK FEITO PELO USUARIO
function clickGrafico() {
    var stop = d3.event.button || d3.event.ctrlKey;
    if (stop) d3.event.stopImmediatePropagation(); // stop zoom

    svg.append("circle")
        .attr("transform", "translate(" + d3.mouse(this) + ")")
        .attr("r", 1e-6)
        .style("fill", "none")
        .style("stroke", stop ? "green" : "rgb(255, 102, 0)")
        .style("stroke-width", "3px")
        .style("stroke-opacity", 1)
      .transition()
        .ease(Math.sqrt)
        .duration(500)
        .attr("r", 12)
        .style("stroke-opacity", 0);
}

//ADICIONA OS CIRCULOS DE REFERENCIA DA LINHA SELECIONADA    
function criaCirculos (timeEscolhido) {
  removeCirculos();
  circulos.append("g")
    .selectAll(".circulo")
    .data(times[timeEscolhido].valores)
    .enter()
    .append("circle")
    .attr("class", "circulo " + times[timeEscolhido].nome)
    .attr("cx", function (d) {
      return x(d.data);
    })
    .attr("cy", function (d) {
      return y(d.indice);
    })
    .attr("r", 1)
    .style("opacity" , 1);
}

//REMOVE OS CIRCULOS DE REFERENCIA ADICIONADOS ANTERIORMENTE
function removeCirculos () {
  $(".circulo").remove();
}

function mousemove() {

  if(zoom.scale() > 4 && $(".circulo").length > 0) {

    var distanciaMouseX = d3.mouse(this)[0];
    var circuloMaisProximo = achaCirculoMaisProximo(nomesDosTimes[timeEscolhido], distanciaMouseX);

    if (circuloMaisProximo.indice != null) {

      /* PAREI AQUI
      var nomeDaLinhaParaMostrar = element.nome;
      var indexDaLinhaParaMostrar;
      
      nomesDosTimes.forEach(function (element, index) {
        if (nomeDaLinhaParaMostrar == element) {
          indexDaLinhaParaMostrar = index;
        }
      });

      console.log(linhaTime[0][indexDaLinhaParaMostrar].firstChild);

      //d.style("stroke", function(d) { return "rgb(127, 1, 234)"; });
      */

      tooltip.transition()
      .style("opacity", .9)
      .text(nomesDosTimes[timeEscolhido] + " : " + circuloMaisProximo.indice)
      tooltip
      .style("left", (d3.event.pageX+5) + "px")
      .style("top", (d3.event.pageY-30) + "px")

    }

  }

}

//FUNCAO PARA ACHAR O CIRCULO DE REFERENCIA
//MAIS PROXIMO DO MOUSE DO USUARIO
function achaCirculoMaisProximo (nomeDoTime, distanciaX) {

  var maximo = width;
  var objeto;
  d3.selectAll("circle." + nomeDoTime).each(function (d) {
      var distancia = Math.abs(d3.select(this).attr("cx") - distanciaX);
      if (distancia < maximo) {
          maximo = distancia;
          objeto = d;
      }
  })

  return objeto;

}

//FUNÇÃO PARA QUANDO A JANELA CARREGAR
$(window).load(function() {
  
  //APAGA O LOADING
  $('#loading').hide();

});