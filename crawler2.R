library(rvest)



page <- read_html("http://futpedia.globo.com/campeonato/campeonato-brasileiro/1996#/fase=primeira-fase-brasileiro-serie-a-1996")


nos <- html_nodes(page, ".lista-classificacao-jogo")


banco <- data.frame(rep("1996", length(nos)), stringsAsFactors=FALSE)
banco$resultado <- NA
banco$data <- NA


for (i in 1:length(nos))  {
  print(i)
  resultado <- html_attr(html_nodes(nos[i], "meta")[1], "content")
  resultado <- gsub("\n", "", resultado)
  resultado <- gsub("União São João", "uniao-sao-joao", resultado)
  
  resultado <- gsub("São Paulo", "sao-paulo", resultado)
  resultado <- gsub("São Caetano", "sao-caetano", resultado)
  resultado <- gsub("Ponte Preta", "ponte-preta", resultado)
  
  resultado <- gsub("Santa Cruz", "santa-cruz", resultado)
  resultado <- gsub("x", "", resultado)
  resultado <- gsub(" +", " ", resultado)
  resultado <- gsub(" ", "#", resultado)  
  banco[i,]$resultado <- resultado
  banco[i,]$data <- html_text(html_node(nos[i], ".data-local"))


}


banco$data <- gsub("[a-zA-Z]", "", banco$data)
banco$data <- gsub("\t", "", banco$data)
banco$data <- gsub(" ", "", banco$data)
banco$data <- gsub("\n", "", banco$data)
banco$data <- gsub("-[^[:space:]]?", "", banco$data)
banco$data <- gsub("á", "", banco$data)
banco$data <- gsub("ã", "", banco$data)
banco$data <- gsub("é", "", banco$data)
banco$data <- gsub("430", "", banco$data)
banco$data <- gsub("é", "", banco$data)
banco$data <- gsub("é", "", banco$data)


banco <- separate(banco, resultado, c("A", "B","C","D"), sep="#")
write.csv(banco, "banco1996.csv", row.names=FALSE)