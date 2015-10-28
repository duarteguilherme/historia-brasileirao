library(PlayerRatings)
library(tidyr)
library(dplyr)



# Setando pasta

setwd('~/historia_brasileirao/')


banco <- read.csv('brasileiros.csv', stringsAsFactors=FALSE)

b2015 <- read.csv('banco2015.csv', stringsAsFactors=FALSE)
b2015$ano <- 2015
b2015 <- select(b2015, ano, dia, time_casa, gols_casa, time_fora, gols_fora)

transforma_banco <- function(db) { #Função para juntar banco de 2015
  
  db <- select(db, ano, dia, time_casa, gols_casa, time_fora,gols_fora, r_timecasa, r_timefora)
  db$time_casa <- tolower(db$time_casa)
  db$time_fora <- tolower(db$time_fora)
  db$time_casa <- iconv(db$time_casa, to="ascii//translit")
  db$time_fora <- iconv(db$time_fora, to="ascii//translit")
  
  db$time_casa <- gsub(" ", "-", db$time_casa)
  db$time_fora <- gsub(" ", "-", db$time_fora)
  return(db)
}

banco <- transforma_banco(rbind(banco, b2015)) # Junta os dados para 2015

banco$dia <- as.Date(banco$dia, format="%Y-%m-%d")

# Cria coluna 'ponto' correspondente a 1 se o time da casa ganhou, 0 se perdeu, e 0.5 , se empate.
banco <- mutate(banco, ponto=ifelse(gols_casa > gols_fora, 1, ifelse(gols_casa < gols_fora, 0, .5)))

banco <- na.omit(banco)

# Ajusta rodadas
banco <- arrange(banco,dia  )
banco <- mutate(banco, ano=format(dia, "%Y"))
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
    banco[j,]$rodada <- rodada
    if ( control >= jogos_por_rodada ) {
      control <-  1
      rodada <- rodada + 1
    }
    else { 
      control <- control + 1
    }
    
  }
}

# Cria winner, loser and draw, Mas esse bloco é inútil
# banco <- banco %>%
#  mutate(Date=dia) %>%
#  mutate(winner=ifelse(gols_casa>=gols_fora, time_casa, time_fora)) %>%
#  mutate(loser=ifelse(gols_casa<gols_fora, time_casa, time_fora)) %>%
#  mutate(draw=ifelse(gols_casa==gols_fora, TRUE, FALSE))



# Hora de Usar PlayerRatings

# It's easy. We just want to define ratings for every date in a table.
# So It's okay to define a ratings Table and then fill in it.

ratings <- expand.grid(unique(banco$time_casa), banco$dia )
ratings <- data.frame(team=ratings$Var1, Date=ratings$Var2)
ratings$team <- as.character(ratings$team)
ratings$valor <- NA
ratings <- ratings[!duplicated(ratings), ]







## Criando a rodada certa para o PlayerRatings
banco$ano <- as.numeric(banco$ano)
banco <- mutate(banco, rodada=ano*100+rodada)


# Cria parte inicial de banco com times e rodada 0.
times <- unique(banco$time_casa)
init_banco <- data.frame(time_casa=times[1:(length(times)/2)], 
                         time_fora=times[(1+length(times)/2):length(times)],
                         stringsAsFactors=FALSE)
init_banco$ano <- 2003
init_banco$dia <- "03-03-2003"
init_banco$dia <- as.Date(init_banco$dia, format="%d-%m-%Y")
init_banco$gols_casa <- NA
init_banco$gols_fora <- NA
init_banco$ponto <- .5
init_banco$rodada <- 0

banco <- rbind(init_banco, banco)


# Carregando as rodadas em ratings
rod <- select(banco, Date=dia, rodada) %>%
  arrange(rodada)
ratings <- left_join(ratings, rod)


ratings <- ratings[!duplicated(ratings),]

# Cria parte de ratings com times e rodada 0
initial_part <- data.frame(team=unique(banco$time_casa), stringsAsFactors=FALSE)
initial_part$Date <- "03-03-2003"
initial_part$Date <- as.Date(initial_part$Date, format="%d-%m-%Y")
initial_part$valor <- 0
initial_part$rodada <- 0
ratings <- rbind(initial_part, ratings)


# Poe os primeiros ELOs
ratings$elo <- NA

rodadas_iter <- sort(unique(rod$rodada))# Definindo rodadas unicas e ordenadas para iterar
  
  for (i in rodadas_iter) { 
    print(i)
      provisorio <- filter(banco, rodada <= i)
    x <- data.frame(provisorio$rodada, provisorio$time_casa, provisorio$time_fora, provisorio$ponto,  stringsAsFactors=FALSE)
    ranking <- elo(x,init=1800, gamma=20, kfac=16)
    for (j in ranking$ratings$Player) {
      ratings[ratings$team==j & ratings$rodada==i,]$elo <- ranking$ratings$Rating[ranking$ratings$Player==j]
    }
  }
  
    
  
  # MUdou o ano, perde a pontuação
  
  
coringao <- filter(ratings, team=="corinthians")
 plot(coringao$Date, coringao$elo, type="l")
palmeiras <- filter(ratings, team=="palmeiras")
plot(palmeiras$Date, palmeiras$elo, type="l")


palmeiras <- filter(ratings, team=="sao-paulo")
plot(palmeiras$Date, palmeiras$elo, type="l")