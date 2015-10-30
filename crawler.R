library(rvest)


`%p%` <- function(e1,e2) {
  return(paste0(e1, e2))
}



banco <- data.frame(data=rep(NA, 50000),
                    time_casa=rep(NA, 50000),
                    gols_casa=rep(NA, 50000),
                    gols_fora=rep(NA, 50000),
                    time_fora=rep(NA, 50000),
                    ano=rep(NA,50000),
                    stringsAsFactors=FALSE
  )

  
control <- 1

setwd('~/elo_futebol/')

 page <- read_html("http://futpedia.globo.com/campeonato/campeonato-brasileiro/2013-2013")

for (ano in 2014) {
  print(ano)
  page <- read_html("http://futpedia.globo.com/campeonato/campeonato-brasileiro/" %p% ano %p% "#/fase=primeira-fase-brasileiro-serie-a-" %p% ano)
  
  
  nos <- html_nodes(page, 'a[href*="/campeonato/campeonato-brasileiro/"]')

  
  
  
  for (i in 1:length(nos))  {
    print(i)
    resultado <- html_attr(nos[i],"href")
    resultado <- gsub("/campeonato/campeonato-brasileiro/", "", resultado)
    resultado <- gsub("/", "#", resultado)
    separa <- strsplit(resultado, "#")
    banco[control,]$data <- paste(separa[[1]][1:3], collapse="-")
    resultado <- separa[[1]][4]
    separa_casa_fora <- strsplit(resultado, "-x-")
    banco[control,]$time_casa <- gsub("[-0-9]", "", separa_casa_fora[[1]][1])
    banco[control,]$gols_casa <- gsub("[-a-z]", "", separa_casa_fora[[1]][1])
    banco[control,]$time_fora <- gsub("[-0-9]", "", separa_casa_fora[[1]][2])
    banco[control,]$gols_fora <- gsub("[-a-z]", "", separa_casa_fora[[1]][2])
    banco[control,]$ano <- ano
    control <- control + 1
  }
  
  
  
  
}



banco <- banco[!duplicated(banco),]
banco <- na.omit(banco)
banco <- arrange(banco, data)




# Checando número de jogos 
checando <- banco %>%
  group_by(ano) %>%
  summarise(numero_por_ano=n()) %>%
  arrange(ano)

for(i in 1:nrow(checando)) {
  cat(checando$ano[i])
  cat("-")
  cat(checando$numero_por_ano[i])
  cat('\n')
}



banco <- filter(banco, ( ano!=1971 & ano !=1972 & ano!=1973 &
                           ano!=1975 & ano !=1984 & ano!=1985 &
                           ano!=1987 & ano !=1989 ))




banco2 <- data.frame(data=rep(NA, 50000),
                    time_casa=rep(NA, 50000),
                    gols_casa=rep(NA, 50000),
                    gols_fora=rep(NA, 50000),
                    time_fora=rep(NA, 50000),
                    ano=rep(NA,50000),
                    stringsAsFactors=FALSE
)



library(RJSONIO)
jsons <- list.files(pattern="json")
control <- 1

for (j in jsons) {
  print(j)
  arq <- readLines(j)
  lista <- fromJSON(paste(arq, collapse=""))[[1]]
  for (i in 1:length(lista)) {
    resultado <- lista[[i]]$url
    resultado <- gsub("/campeonato/campeonato-brasileiro/", "", resultado)
    resultado <- gsub("/", "#", resultado)
    separa <- strsplit(resultado, "#")
    banco2[control,]$data <- paste(separa[[1]][1:3], collapse="-")
    resultado <- separa[[1]][4]
    resultado <- gsub("mixto", "miXto", resultado)
    separa_casa_fora <- strsplit(resultado, "-x-")
    banco2[control,]$time_casa <- gsub("[-0-9]", "", separa_casa_fora[[1]][1])
    banco2[control,]$gols_casa <- gsub("[-a-z]", "", separa_casa_fora[[1]][1])
    banco2[control,]$time_fora <- gsub("[-0-9]", "", separa_casa_fora[[1]][2])
    banco2[control,]$gols_fora <- gsub("[-a-z]", "", separa_casa_fora[[1]][2])
    banco2[control,]$ano <- gsub(".json", "", j)
    control <- control + 1
  }
  
}

banco <- rbind(banco,banco2)

banco$time_fora[banco$time_fora=="mi"] <- "mixto"
banco$gols_casa <- as.numeric(banco$gols_casa)

banco$gols_fora <- as.numeric(banco$gols_fora)
banco$ano <- as.numeric(banco$ano)

banco <- banco[!duplicated(banco),]
banco <- na.omit(banco)
banco <- arrange(banco, data)





write.csv(banco, "banco-historia.csv", row.names=FALSE)



banco <- read.csv('banco-historia.csv', stringsAsFactors=FALSE)
i <- jsons[1]