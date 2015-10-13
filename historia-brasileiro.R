library(PlayerRatings)
library(tidyr)
library(dplyr)



# Setando pasta

setwd('~/historia_brasileirao/')


banco <- read.csv('brasileiros.csv', stringsAsFactors=FALSE)

b2015 <- read.csv('banco2015.csv', stringsAsFactors=FALSE)
b2015$ano <- 2015
b2015 <- select(b2015, ano, data, time_casa, gols_casa, time_fora, gols_fora)

transforma_banco <- function(db) { #Função para juntar banco de 2015
  
  db <- select(db, ano, data, time_casa, gols_casa, time_fora,gols_fora)
  db$time_casa <- tolower(db$time_casa)
  db$time_fora <- tolower(db$time_fora)
  db$time_casa <- iconv(db$time_casa, to="ascii//translit")
  db$time_fora <- iconv(db$time_fora, to="ascii//translit")
  
  db$time_casa <- gsub(" ", "-", db$time_casa)
  db$time_fora <- gsub(" ", "-", db$time_fora)
  return(db)
}

banco <- transforma_banco(rbind(banco, b2015)) # Junta os dados para 2015
banco <- banco[1:6352,]

# Transforma data e dano para data( formato padrão)
banco <- unite(banco, dia, data,ano, sep="/")
banco$dia <- as.Date(banco$dia, format="%d/%m/%Y") 


# Cria coluna 'ponto' correspondente a 1 se o time da casa ganhou, 0 se perdeu, e 0.5 , se empate.
banco <- mutate(banco, ponto=ifelse(gols_casa > gols_fora, 1, ifelse(gols_casa < gols_fora, 0, .5)))


# Ajusta rodadas
banco <- arrange(banco,Date )
banco <- mutate(banco, ano=format(Date, "%Y"))
banco$rodada <- NA
for (i in 2003:2014) { # Código mal escrito, mas é o que temos
  print(i)
  jogos_no_ano <- banco[banco$ano==i,]
  times <- unique(banco[banco$ano==i,]$time_casa)
  n_times <- length(times)
  n_jogos <- nrow(jogos_no_ano)
  jogos_por_rodada <- n_times/2
  control <- 1
  rodada <- 1
  for (j in which(banco$ano==i)) {
    if ( control > jogos_por_rodada ) {
      control <-  1
      rodada <- rodada + 1
    }
    else { 
      control <- control + 1
    }
      banco[j,]$rodada <- rodada
    
  }
}

# Cria winner, loser and draw
banco <- banco %>%
  mutate(Date=dia) %>%
  mutate(winner=ifelse(gols_casa>=gols_fora, time_casa, time_fora)) %>%
  mutate(loser=ifelse(gols_casa<gols_fora, time_casa, time_fora)) %>%
  mutate(draw=ifelse(gols_casa==gols_fora, TRUE, FALSE))


# Cria presence para banco
presenca <- expand.grid(unique(banco$time_casa), banco$dia )
presenca <- data.frame(team=presenca$Var1, Date=presenca$Var2)
presenca$team <- as.character(presenca$team)
presenca$valor <- 0
presenca <- presenca[!duplicated(presenca), ]
presenca <- spread(presenca, team, valor )

presenca <- mutate(presenca, ano=format(Date, "%Y"))
# ADiciona 1 se o time está presente e 0 se não

for (i in 1:nrow(banco)) {
  time_casa <- banco[i,]$time_casa
  time_fora <- banco[i,]$time_fora
  ano <- format(banco[i,]$Date, "%Y")
  presenca[presenca$ano==ano,][[time_casa]] <- 1 
}


presenca <- select(presenca, -ano)

presenca$Date <- as.Date(presenca$Date, format="%Y-%m-%d")

banco$Date <- as.Date(banco$Date, format="%Y-%m-%d")

# Hora de Usar PlayerRatings

# It's easy. We just want to define ratings for every date in a table.
# So It's okay to define a ratings Table and then fill in it.

ratings <- expand.grid(unique(banco$time_casa), banco$dia )
ratings <- data.frame(team=ratings$Var1, Date=ratings$Var2)
ratings$team <- as.character(presenca$team)
ratings$valor <- NA
ratings <- ratings[!duplicated(ratings), ]

