//DIMENSOES DO GRAFICO
var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 1024 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

//FORMATO DE PARSEMENTO DOS DADOS DE DATA
var parseDate = d3.time.format("%Y%m%d").parse;
var parseData = d3.time.format("%Y-%m-%d").parse;

//ESCALA DOS DADOS NOS RESPECTIVOS EIXOS
var x = d3.time.scale()
    .range([0, width]);

var y = d3.scale.linear()
    .range([height, 0]);

//CORES
var color = d3.scale.category10();

//DE QUE MANEIRA AS INFORMACOES DO EIXO X VAO APARECER 
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

//DE QUE MANEIRA AS INFORMACOES DO EIXO Y VAO APARECER 
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

var line = d3.svg.line()
    .interpolate("linear")
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.temperature); });

//INICIO DO DESENHO DO GRAFICO
var svg = d3.select("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var cities, city;
var timeEscolhido; //ARMAZENA O TIME ESCOLHIDO PELO USUARIO NO MENU
var linhaEscolhida; //ARMAZENA A LINHA ESCOLHIDA A PARTIR DO TIME ESCOLHIDO PELO USUARIO NO MENU
var nomesDosTimes; //ARMAZENA O NOME DOS TIMES; VARIAVEL DE APOIO PARA CHECAGEM E ITERACAO
var times; //ARMAZENA CADA OBJETO-TIME INTEIRO COM SEUS RESPECTIVOS VALORES (DATAS E INDICES)
var linhaTime; //ARMAZENA A LINHA ESPECIFICA DE CADA TIME

//TRABALHANDO COM OS DADOS DO ARQUIVO .TSV
d3.tsv("data/data.tsv", function(error, data) {
  
  if (error) throw error;

  //QUANTIDADE DE CORES UTILIZADAS
  color.domain(d3.keys(data[0]).filter(function(key) { return key !== "date"; }));

  //NAO ENTENDI OS EFEITOS DESTA FUNCAO
  //A VARIAVEL (d) SO EXISTE NO ESCOPO DO forEach
  //A NAO SE QUE A VARIAVEL SEJA POR REFERENCIA
  data.forEach(function(d) {
    d.date = parseDate(d.date);

  });
  console.log(data);
  console.log(data["date"]);

  //CRIANDO UM ARRAY DE OBJETOS A PARTIR DAS COREES ARMAZENADAS NA VARIAVEL COLOR
  //DENTRO DESSE ARRAY HAVERA UM DICIONARIO COM TITULO E VALORES
  //VALORES EM SI EH UM NOVO ARRAY DE OBJETOS COM DOIS VALORES
  cities = color.domain().map(function(name) {
    return {
      name: name,
      values: data.map(function(d) {
        return {date: d.date, temperature: +d[name]};
      })
    };
  });

  //ESTABELECENDO O DOMINIO DE VALORES DO EIXO X 
  //A PARTIR DAS DATAS (DO MAIOR AO MENOR)
  x.domain(d3.extent(data, function(d) { return d.date; }));

  //ESTABELECENDO O DOMINIO DE VALORES DO EIXO Y 
  //A PARTIR DAS DATAS (DO MAIOR AO MENOR)
  y.domain([
    d3.min(cities, function(c) { return d3.min(c.values, function(v) { return v.temperature; }); }),
    d3.max(cities, function(c) { return d3.max(c.values, function(v) { return v.temperature; }); })
  ]);

  //CONTINUANDO O DESENHO DO GRAFICO
  //ADICIONANDO O EIXO X
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  //ADICIONANDO O EIXO Y + TEXTO
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");
      //.text("Temperature (ºF)");

  //CRIANDO AS TAGS PARA DESENHAR AS LINHAS
  city = svg.selectAll(".city")
      .data(cities)
    .enter().append("g")
      .attr("class", "city");

  //DESENHANDO AS LINHAS
  city.append("path")
      .attr("class", "line")
      .attr("d", function(d) { console.log(d.values); return line(d.values); })
      .attr("opacity", 0.1)
      .style("stroke", function(d) { return color(d.name); });

  //CRIANDO OS TEXTOS AO FIM DE CADA LINHA DO GRAFICO
  city.append("text")
      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
      .attr("x", 3)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

      console.log(cities);
});