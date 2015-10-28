//FUNCAO AUXILIAR PARA DEBUGAR O CODIGO
function printa(string) {
  //CASO SEJA PASSADO PARAMETRO
  if(string) {
    console.log(string);
  }
  else {
  console.log("opa!");
  }
}

//DIMENSOES DO GRAFICO
var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 1024 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

//CODIGO REFERENTE AO ZOOM
var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

//CODIGO REFERENTE AO DRAG
/*var drag = d3.behavior.drag()
    .origin(function(d) { return d; })
    .on("dragstart", dragstarted)
    .on("drag", dragged)
    .on("dragend", dragended);*/

//FORMATO DE PARSEMENTO DOS DADOS DE DATA
var parseData = d3.time.format("%Y-%m-%d").parse;

//ESCALA DOS DADOS NOS RESPECTIVOS EIXOS
var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

//DE QUE MANEIRA AS INFORMACOES DO EIXO X VAO APARECER 
var xAxis = d3.svg.axis()
    .scale(x)
    //.tickSize(-height, 0)
    //.tickPadding(6)
    .orient("bottom");

//DE QUE MANEIRA AS INFORMACOES DO EIXO Y VAO APARECER 
var yAxis = d3.svg.axis()
    .scale(y)
    //.orient("right")
    //.tickSize(-width)
    //.tickPadding(6)
    .orient("left");

var line = d3.svg.line()
    .interpolate("linear")
    .defined(function(d) { return d.indice != null; })
    .x(function(d) {
      return x(d.data);
    })
    .y(function(d) {
      return y(d.indice); 
    });

//INICIO DO DESENHO DO GRAFICO
var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .on("mousedown", clickGrafico)
    .call(zoom);
    //.on("mousedown.zoom", null);

//CRIADO UM RETANGULO QUE PARA DEMARCAR O DRAG
var rect = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");

var cities, city;
var timeEscolhido; //ARMAZENA O TIME ESCOLHIDO PELO USUARIO NO MENU
var linhaSelecionada; //ARMAZENA A LINHA ESCOLHIDA A PARTIR DO TIME ESCOLHIDO PELO USUARIO NO MENU
var nomesDosTimes; //ARMAZENA O NOME DOS TIMES; VARIAVEL DE APOIO PARA CHECAGEM E ITERACAO
var times; //ARMAZENA CADA OBJETO-TIME INTEIRO COM SEUS RESPECTIVOS VALORES (DATAS E INDICES)
var linhaTime; //ARMAZENA A LINHA ESPECIFICA DE CADA TIME
var tooltip; //TOOLTIP COM INFORMACOES A SEREM APRESENTADAS AO USUARIO
var container; //CONTAINER PARA ENVOLVER OS ELEMENTOS INTERNOS DO SVG
var circulos; //ADICIONADOS AO GRAFICO QUANDO O USUARIO SELECIONA UMA LINHA ESPECIFICA

//TRABALHANDO COM OS DADOS DO ARQUIVO .JSON
d3.json ("data/novodadosfull.json", function(error, dados) {
  
  if (error) throw error;

  //ARMAZENANDO O TOTAL DE TIMES
  nomesDosTimes = d3.keys(dados).filter(function(index, element) { return index !== "data"; });
  
  //INSERINDO O NOME DOS CLUBES NO DROPDOWN MENU
  nomesDosTimes.forEach(function(d) {

    $("ul.sub-menu").append("<li class=\"timeBrasileirao\"><a href=\"#\">" + d + "</a></li>");

  });

  //PARSEANDO AS DATAS PARA O FORMATO DE LEITURA DO GRAFICO
  dados["data"].forEach(function(data, index) {

    dados["data"][index] = parseData(data);

  });

  //CRIANDO UM ARRAY DE OBJETOS COM OS TIMES E SEUS RESPECTIVOS VALORES
  times = nomesDosTimes.map(function(nomeTime) {

    return {

      nome : nomeTime,
      valores : dados["data"].map (function(d, index) {

        return {

          data: dados["data"][index],
          indice: dados[nomeTime][index]

        };
      })
    }; 
  });
  
  //PARA LEMBRAR: COMO ACESSAR OS ITENS NA VARIAVEL TIMES
  //console.log(times[0].valores[0].indice);
  
  //ESTABELECENDO O DOMINIO DE VALORES DO EIXO X A PARTIR DAS DATAS
  x.domain(d3.extent(dados["data"], function(d) { return d; }));

  //ESTABELECENDO O DOMINIO DE VALORES DO EIXO Y 
  //A PARTIR DOS INDICES
  y.domain([
    d3.min(times, function(t) { return d3.min(t.valores, function(v) { return v.indice; }); }),
    d3.max(times, function(t) { return d3.max(t.valores, function(v) { return v.indice; }); })
  ]);

  //AUMENTANDO O DOMINIO AS LINHAS NAO COINCIDIREM
  //COM O TOPO E COM A BASE DO GRAFICO
  var yDomainMin = y.domain()[0];
  var yDomainMax = y.domain()[1];
  yDomainMin -= 120;
  yDomainMax += 120;

  y.domain([yDomainMin, yDomainMax]);

  //CRIACAO DO CONTAINER PARA INCLUIR OS ELEMENTOS SEGUINTES
  container = svg.append("g")
               .attr("class", "container");

  //CONTINUANDO O DESENHO DO GRAFICO
  //ADICIONANDO O EIXO X
  container.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  //ADICIONANDO O EIXO Y
  container.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");
      //.text("Índice");

  //INICIANDO O DESENHO DAS LINHAS INDIVIDUAIS
  linhaTime = container.append("g")
    .attr("class", "linhas")
    .selectAll(".linhaTime")
    .data(times)
    .enter().append("g")
    .attr("class", "linhaTime");

  //CRIANDO A VARIAVEL DE TOOLTIP COM AS INFORMACOES DAS LINHAS
  var tooltip = d3.select("body").append("div")
        .attr("class", "infoTooltip")
        .style("position", "absolute")
        .style("padding", "4px 8px")
        .style("background", function(d) {return "rgb(239,239,239)"})
        .style("opacity", 0);

  //DESENHANDO AS LINHAS
  linhaTime.append("path")
      .attr("class", "linha")
      .attr("d", function(d) {
        
        return line(d.valores); 

      })
      .attr("opacity", 0.7)
      .style("stroke-width", function(d) { return ".5px"; })
      //.style("position", "relative")
      .style("stroke", function(d) { return "rgb(127, 127, 127)"; })

  //CRIANDO O EVENTO PARA MOSTRAR A INFORMACAO DA LINHA
  //AO PASSAR O MOUSE PELA LINHA
  .on("mouseover", function(d, i) {

    if(zoom.scale() > 4 && $(".circulo").length > 0) {
      var distanciaX = d3.mouse(this)[0];
      var circuloMaisProximo = achaCirculoMaisProximo(nomesDosTimes[i], distanciaX);

      tooltip.transition()
      .style("opacity", .9)
      .text(nomesDosTimes[i] + " " + circuloMaisProximo.indice)
      tooltip.html(d)
      .style("left", (d3.event.pageX+5) + "px")
      .style("top", (d3.event.pageY-30) + "px")
    }

    else {
      tooltip.transition()
      .style("opacity", .9)
      .text(nomesDosTimes[i])
      tooltip.html(d)
      .style("left", (d3.event.pageX+5) + "px")
      .style("top", (d3.event.pageY-30) + "px")
    }

  })

  //CRIANDO O EVENTO RETIRAR A INFORMACAO
  //NO MOUSEOUT DA LINHA
  .on("mouseout", function(d, i) {
    tooltip.style("opacity", 0)
  })
  
  //ELEMENTO PARA AGRUPAR OS CIRCULOS DE REFERENCIA
    circulos = container.append("g")
    .attr("class", "circulos");

});

//FUNCAO CHAMADA QUANDO O DOCUMENTO ESTA PRONTO
$(document).ready(function(){

  //CASO ALGUM ITEM O MENU SEJA SELECIONADO
  $(".sub-menu li").click(function(event) {

    //ARMAZENA O INDEX DO TIME ESCOLHIDO
    timeEscolhido = $(this).index();

    //ARMAZENA A LINHA ESCOLHIDA
    linhaSelecionada = $(".linhaTime .linha")[timeEscolhido];
    //linhaSelecionada = d3.selectAll(".linhaTime .linha")[0][timeEscolhido]; //MESMO EFEITO REALIZADO COM D3

    //DIMINUI A OPACIDADE DE TODAS AS LINHAS
    //RETORNA A COR DE TODAS AS LINHAS PARA O CINZA
    $(".linhaTime .linha").attr("opacity", function(d) {return 0.4});
    $(".linhaTime .linha").css("stroke", function(d) { return "rgb(127, 127, 127)"});
    $(".linhaTime .linha").css("stroke-width", function(d) { return ".5px"});
    //d3.selectAll(".linhaTime .linha").attr("opacity", function(d) {return 0.1}); //MESMO EFEITO REALIZADO COM D3

    //AUMENTA A OPACIDADE DA LINHA SELECIONADA
    //ALTERA A COR DA LINHA SELECIONADA
    //DESLOCA ELA PARA CIMA DAS OUTRAS
    //var ultimaLinha = $(".linhaTime .linha")[$(".linhaTime .linha").length - 1];
    //$(linhaSelecionada).insertAfter(ultimaLinha);
    $(linhaSelecionada).parent().addClass("linhaSelecionada");
    $(linhaSelecionada).attr("opacity", 1);
    $(linhaSelecionada).css("stroke", function(d) { return "rgb(255, 102, 0)" });
    $(linhaSelecionada).css("stroke-width", function(d) { return ".5px" });
    
    //ADICIONA OS CIRCULOS DE REFERENCIA DA LINHA SELECIONADA    
    criaCirculos(timeEscolhido);
  });

});

//FUNCOES REFERENTES AO ZOOM/DRAG
function zoomed() {

  var t = d3.event.translate,
      s = d3.event.scale;

  container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
 
  /*
  if (s == 1) {
    t[0] = Math.min(width / 2 * (s - 1), Math.max(width / 2  * (1 - s), t[0]));
    t[1] = Math.min(height / 2 * (s - 1), Math.max(height / 2 * (1 - s), t[1]));
    zoom.translate(t);
    container.style("stroke-width", 1 / s).attr("transform", "translate(" + t + ")scale(" + s + ")");      
  }
  else {
    container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");  
  }*/

}

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