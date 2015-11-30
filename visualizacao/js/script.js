//DIMENSOES DO GRAFICO
var margin = {top: 10, right: 55, bottom: 30, left: 50},
    // width = 1040 - margin.left - margin.right,
    w = window.innerWidth - 20,
    width = window.innerWidth - margin.right - margin.left - 20,
    height = 500 - margin.top - margin.bottom;
    //para o gráfico menor
    height_2 = 100 - margin.top - margin.bottom;

var largura_barrinha = 5;

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
var zoom_atual = [0,0];
var alca_esquerda, alca_direita;
var circulos; //ADICIONADOS AO GRAFICO QUANDO O USUARIO SELECIONA UMA LINHA ESPECIFICA
//TOOLTIP COM INFORMACOES A SEREM APRESENTADAS AO USUARIO
var tooltip = d3.select("body").append("div")
      .attr("class", "infoTooltip")
      .style("position", "absolute")
      .style("padding", "4px 8px")
      .style("background", function(d) {return "rgb(239,239,239)"})
      .style("opacity", 0);

//times que têm os escudos à mostra
var escudos = ['atleticomg','atleticopr','avai','chapecoense','corinthians','coritiba','cruzeiro','figueirense','flamengo','fluminense','goias','gremio','internacional','joinville','palmeiras','pontepreta','santos','saopaulo','sport','vasco']

var traduz_zoom = d3.scale.linear().domain([0,width]).range([20,1]);

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

    var saida = [];
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


function comeca_tudo(data) {
    times = conserta_dados(data);

    //gambiarra para não dar zoom além dos anos dos dados
    dominio_x = d3.extent(data[1]['data_fake'], function(d) { return d; })
    panExtent = {x: dominio_x, y: [-10000,400000] };

    x = d3.time.scale()
        .domain(dominio_x)
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
        .interpolate("cardinal")
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

    chartBody = svg.append("g")
        .attr("clip-path", "url(#clip)")
        .selectAll('.times')
        .data(times)
        .enter().append("g")
        .attr("class","times");

    chartBody.append("path")
        .attr("class", function (d,i) {
            return "line " + nomesDosTimes[i]
        })
        .attr("opacity", 0.7)
        .attr("d", function(d) { return line(d.valores); })
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
        });

    //ELEMENTO PARA AGRUPAR OS CIRCULOS DE REFERENCIA
    //circulos = svg.append("g").attr("class", "circulos");

    //agora criamos o grafico menor
    x_2 = d3.time.scale()
        .domain(d3.extent(data[1]['data_fake'], function(d) { return d; }))
        .range([0, width]);

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
            return x_2(d.data);
        })
        .y(function(d) {
            return y_2(d.indice);
        });

    svg_2 = d3.select("#grafico2")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height_2 + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var dragregua = d3.behavior.drag()
        .on("drag", move_regua);

    regua = svg_2.append("rect")
        .attr("width", width)
        .attr("height", height_2)
        .style("opacity","0.3")
        .attr('class','regua')
        .style("pointer-events", "all")
        .call(dragregua);

    var dragesquerda = d3.behavior.drag()
        .on("drag", dragleft);

    alca_esquerda = svg_2.append("rect")
        .attr("class","alca esquerda")
        .attr("height", height_2)
        .attr("width", largura_barrinha)
        .attr("x",0)
        .call(dragesquerda);

    var dragdireita = d3.behavior.drag()
        .on("drag", dragright);

    alca_direita = svg_2.append("rect")
        .attr("class","alca direita")
        .attr("height", height_2)
        .attr("width", largura_barrinha)
        .attr("x",0)
        .attr("transform","translate("+(width-largura_barrinha)+",0)")
        .call(dragdireita);

    svg_2.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height_2 + ")")
        .call(xAxis);

    //SELECIONA E MOSTRA A LINHA ESCUDO AO CARREGAR A PÁGINA
    selecionaLinha($("#menuEscudos01").children()[0].id);
    mostraLinha(timeEscolhido, linhaSelecionada, false);

    svg_2.append("path")
        .datum(times[timeEscolhido].valores)
        .attr("class", "line_aux")
        .attr("d", line_2);

    //esconde o loading
    $('#loading').hide();
}


function redesenha() {
    //muda eixos e grids
    svg.select(".x.axis").call(xAxis);
    svg.select(".x.grid").call(xAxis)
        .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat(""));
    svg.select(".y.grid")
        .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat(""));

    //muda linhas
    svg.selectAll(".times").selectAll(".line")
        .attr("d", function(d) { return line(d.valores); });

    arruma_destaque_linhas();
    //zoom nos circulos
    /*circulos.selectAll('.circulo')
        .attr("cx", function (d) {
            return x(d.data);
        })
        .attr("cy", function (d) {
            return y(d.indice);
        })*/
}
function zoomed () {
    zoom.scale(parseInt(zoom.scale()));

    //gambiarra para não dar zoom além dos anos dos dados
    zoom.translate(panLimit());
    //checa se houve mudança de posição antes de redesenhar
    if (zoom.translate()[0] != zoom_atual[0] || zoom.translate()[1] != zoom_atual[1]) {
        //atualiza o grafico
        redesenha();

        //muda retangulo de baixo
        dragleft(x_2(x.domain()[0]));
        dragright(x_2(x.domain()[1]));

        zoom_atual = zoom.translate();
    }
}

//limite no eixo X para o gráfico (parte da gambiarra)
function panLimit() {
    var divisor = {h: height / ((y.domain()[1]-y.domain()[0])*zoom.scale()), w: width / ((x.domain()[1]-x.domain()[0])*zoom.scale())},
        minX = -(((x.domain()[0]-x.domain()[1])*zoom.scale())+(panExtent.x[1]-(panExtent.x[1]-(width/divisor.w)))),
        minY = -(((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-(panExtent.y[1]-(height*(zoom.scale())/divisor.h))))*divisor.h,
        maxX = -(((x.domain()[0]-x.domain()[1]))+(panExtent.x[1]-panExtent.x[0]))*divisor.w*zoom.scale(),
        maxY = (((y.domain()[0]-y.domain()[1])*zoom.scale())+(panExtent.y[1]-panExtent.y[0]))*divisor.h*zoom.scale(),

        tx = x.domain()[0] < panExtent.x[0] ?
            minX :
                x.domain()[1] > panExtent.x[1] ?
            maxX :
            zoom.translate()[0],
        ty = y.domain()[0]  < panExtent.y[0]?
            minY :
                y.domain()[1] > panExtent.y[1] ?
            maxY :
            zoom.translate()[1];
    return [tx,ty];
}

//função para mover a regua de baixo
function move_regua(d) {

    var variacao =  d3.event.dx;

    var pos_left = d3.transform(alca_esquerda.attr("transform")).translate[0];
    var pos_right = d3.transform(alca_direita.attr("transform")).translate[0];
    var mudar = true;

    //veja se não passou do limite (se passou, não faz nada)
    if (pos_left == 0) {
        if (variacao < 0) {
            mudar = false;
        }
    }

    if (pos_right == (width-largura_barrinha)) {
        if (variacao > 0) {
            mudar = false;
        }
    }


    if (mudar) {
        dragleft(pos_left+variacao,false);
        dragright(pos_right+variacao,true);
    }
}


//função[s] para o drag das alças
function dragleft(d,mudar_grafico) {
    if (mudar_grafico == 0) {
        mudar_grafico = true;
    }
    var posicao = d3.event.x;
    var mudar_graficao = true;
    if (d) {
        posicao = d;
        if (!(mudar_graficao)) {
            mudar_graficao = false;
        }
    }
    var x_orig = d3.transform(alca_esquerda.attr("transform")).translate[0];

    //x novo não pode ser menor que zero
    var new_x = posicao > 0 ? posicao : 0;

    //tbm não pode ser maior que a posição da alça da direita
    var x_direita = d3.transform(alca_direita.attr("transform")).translate[0];
    new_x = new_x < (x_direita - largura_barrinha) ? new_x : (x_direita - largura_barrinha);

    //move barrinha
    alca_esquerda.attr("transform", "translate(" + new_x + ",0)");

    //move e resize retangulo
    var delta_x = x_orig - new_x;
    var width_agora = parseInt(regua.attr("width"));

    regua.attr("width",function () { return width_agora + delta_x });
    regua.attr("transform", "translate(" + new_x + ",0)");

    //muda a escala do grafico maior
    if (mudar_graficao) {
        var novo_dominio = x_2.invert(new_x);
        x.domain([novo_dominio, x.domain()[1]]);
        if (mudar_grafico) {
            redesenha();
        }
    }
}

function dragright(d,mudar_grafico) {
    if (mudar_grafico == 0) {
        mudar_grafico = true;
    }

    var posicao = d3.event.x;
    var mudar_graficao = true;
    if (d) {
        posicao = d;
        if (!(mudar_graficao)) {
            mudar_graficao = false;
        }
    }

    //x não pode ser maior que o tamanho do grafico
    var new_x = posicao > (width-largura_barrinha) ? (width-largura_barrinha) : posicao;

    //tbm não pode ser menor que a posição da alça da esquerda
    var x_esquerda = d3.transform(alca_esquerda.attr("transform")).translate[0];
    new_x = new_x > (x_esquerda + largura_barrinha) ? new_x : (x_esquerda + largura_barrinha);

    //move barrinha
    alca_direita.attr("transform", "translate(" + new_x + ",0)");

    //move e resize retangulo
    regua.attr("width",function () { return new_x + largura_barrinha - d3.transform(alca_esquerda.attr("transform")).translate[0] });

    //muda a escala do grafico maior só se tiver sido chamado mexendo no retangulo de baixo, e nao dando zoom em cima
    if (mudar_graficao) {
        var novo_dominio = x_2.invert(new_x);
        x.domain([x.domain()[0],novo_dominio]);
        if (mudar_grafico) {
            redesenha();
        }
    }
}

//FUNCAO PARA ADICIONAR OS ESCUDOS DOS TIMES
function adiciona_escudos() {
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

function arruma_destaque_linhas() {
    //DIMINUI A OPACIDADE DE TODAS AS LINHAS DE ACORDO COM O NÍVEL DE ZOOM, ALEM DE MUDAR COR
    if (zoom.scale() <= 3) {
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
    else {
        $(".line").attr("opacity", function(d) {return 0.6});
        $(".line").css("stroke", function(d) { return "rgb(127, 127, 127)"});
        $(".line").css("stroke-width", function(d) { return ".5px"});
    }
    //AUMENTA A OPACIDADE DA LINHA SELECIONADA
    //ALTERA A COR DA LINHA SELECIONADA
    //DESLOCA ELA PARA CIMA DAS OUTRAS
    $(linhaSelecionada).attr("opacity", 1);
    $(linhaSelecionada).css("stroke", "rgb(255, 102, 0)");
    $(linhaSelecionada).css("stroke-width", function(d) { return "1.5px" });

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
  chartBody.append("g")
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
