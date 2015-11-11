library(tidyr)
library(dplyr)
setwd('/var/www/html/historia_brasileirao/')




lista_rodadas <- function(prov_ante, prov) {
  rodadas_ante <- rbind( select(prov_ante, time=time_casa, rating=r_timecasa, dia),
                    select(prov_ante, time=time_fora, rating=r_timefora, dia))
  ano <- prov$ano[1]
  times_atual <- data.frame(time=unique( c(prov$time_casa, prov$time_fora)), stringsAsFactors=FALSE)
  
  lista_ante <- rodadas_ante %>%
    group_by(time) %>%
    summarise(dia=max(dia))
  lista_ante <- left_join(lista_ante, rodadas_ante)
  
  rodadas <- left_join(times_atual,lista_ante)
  if ( (nrow(rodadas) %% 2) == 1 ) {
    a_unir <-  data.frame(time="quebra-galho", 
               dia=paste0(ano, "-01-01"),
               rating=1000,stringsAsFactors=FALSE)
    a_unir$dia <- as.Date(a_unir$dia, format="%Y-%m-%d")
    rodadas <- rbind(rodadas, a_unir)
  }
  print(length(is.na(rodadas$rating)))
  print(rodadas$rating[is.na(rodadas$rating)])
  rodadas$rating[is.na(rodadas$rating)] <- 950 # Define a media
  rodadas$rating <- ((3/4) * rodadas$rating + (1/4)*950)
  rodadas$dia <- paste0(ano, "-01-01")  
  start_db <- data.frame(dia=rodadas$dia,
                          time_casa=rodadas$time[1:(nrow(rodadas)/2)],
                         r_timecasa=rodadas$rating[1:(nrow(rodadas)/2)],
                         gols_casa=NA,
                         gols_fora=NA,
                         time_fora=rodadas$time[((nrow(rodadas)/2)+1):nrow(rodadas)],
                         ano=ano,
                         r_timefora=rodadas$rating[((nrow(rodadas)/2)+1):nrow(rodadas)]
                         ,stringsAsFactors=FALSE)
  
  return(start_db)
}


start_initial_ratings <- function(banco, lista_inicial) {
  ano <- banco$ano[1]
  n_initial_teams <- 950
  
  times <- unique(c(banco$time_casa, banco$time_fora))
  if ( (length(times) %% 2) == 1 )
    times <- c(times, "quebra-galho")
  lista_inicial$pontos <- (lista_inicial$pontos - mean(lista_inicial$pontos))/sd(lista_inicial$pontos)
  lista_inicial$pontos <- lista_inicial$pontos*.1 + 1000
  start_db <- data.frame(times, stringsAsFactors=FALSE)
  start_db <- left_join(start_db, lista_inicial)
  start_db[is.na(start_db$pontos),]$pontos <- n_initial_teams
  start_db <- data.frame(time_casa=start_db$times[1:(nrow(start_db)/2)],
                    r_timecasa=start_db$pontos[1:(nrow(start_db)/2)],
                    time_fora=start_db$times[((nrow(start_db)/2)+1):nrow(start_db)],
                    r_timefora=start_db$pontos[((nrow(start_db)/2)+1):nrow(start_db)]
                    ,stringsAsFactors=FALSE)
  start_db$dia <- paste0(ano,"-01-01")
  start_db$ano <- 0
  start_db$gols_casa <- NA
  start_db$gols_fora <- NA
    
  return(start_db)
}






return_rating <- function(gols_1, gols_2, rating_1, rating_2, casa_fora=0, k=20, ksi=1000) {
  W <- function(gols_a, gols_b) { # returns the real result
    if ( gols_a == gols_b ) {
      return(.5)
    }
    else if ( gols_a > gols_b ) {
      return(1)
    }
    else if ( gols_a < gols_b ) {
      return(0)
    }
    else {
      return(NA)
    }
  }
  
  W_e <- function(rating_1, rating_2) { # returns expected result
    d_r = rating_1 - rating_2
    W_e <- 1/(1 + 10^(-d_r/ksi))
    return(W_e)
  }
  G <- function(gols_1, gols_2) { # returns the goal difference index
    difference <- abs(gols_1 - gols_2)
    if ( difference <= 1 ) {
      return(1)
    }
    else if ( difference == 2 ) {
      return(1.5)
    }
    else {
      return( (11+difference)/8 )
    }
  }  
    
    rating_1_r <-   rating_1 + ( k * G(gols_1,gols_2) * ( W(gols_1, gols_2) - W_e(rating_1, rating_2) ) ) # Number 1 rating 
    rating_2_r <-  rating_2 + ( k * G(gols_2,gols_1) * ( W(gols_2, gols_1) - W_e(rating_2, rating_1) ) ) # Number 2 rating
    return(c(rating_1_r, rating_2_r))
}

# How to draw the function
# Creates a table with all data and all times

# Check if changes or not in table
organize_ratings <- function(banco,k=10) { 
  # banco$r_timecasa <- NA # Create column filled in with Home Team rating
  # banco$r_timefora <- NA # Create column filled in with Guest Team rating
  banco <- arrange(banco, dia)
  newbank <- data.frame(dia=as.Date("1929-01-01", "%Y-%m-%d")
,
                        time_casa=NA,
                        gols_casa=NA,
                        gols_fora=NA,
                        time_fora=NA,
                        ano=NA,
                        r_timecasa=NA,
                        r_timefora=NA
                        ,stringsAsFactors=FALSE)
  for (j in 1:length(unique(banco$ano))) {
    ano_k <- unique(banco$ano)[j]
    prov <- filter(banco, ano==unique(banco$ano)[j]) %>%
      arrange(dia)
    print(unique(banco$ano)[j])
    if ( j == 1 ) {
      lista_inicial <- read.csv('inicial-pedrosa.csv', stringsAsFactors=FALSE)
      prov <- rbind(prov, start_initial_ratings(prov, lista_inicial))      
    }
    else {
#      prov_ante <- filter(banco, ano==unique(banco$ano)[j-1]) %>%
#        arrange(dia)
      lista_ano <- lista_rodadas(prov_ante, prov)
      prov <- rbind(lista_ano ,prov) %>%
        arrange(dia)
    }
    prov$dia <- as.Date(prov$dia, format="%Y-%m-%d")
    prov <- arrange(prov,dia)
    for (i in 1:nrow(prov)) {
      # Find accurate time
      day <- format(prov$dia[i], "%m-%d")
      if ( day =="01-01" ) {
          next
      }
      data <-format(prov$dia[i], "%Y-%m-%d")
      time_casa <- prov$time_casa[i]
      time_fora <- prov$time_fora[i]
      banco_ante <- prov[prov$dia<data,] # Select database for data_ante
      banco_ante <- rbind(select(banco_ante, time=time_casa, rating=r_timecasa, dia), select(banco_ante, time=time_fora, rating=r_timefora, dia))
      banco_ante <- arrange(banco_ante, desc(dia))
      rating_ante_casa <- banco_ante$rating[banco_ante$time == time_casa ][1] # Find rating
      rating_ante_fora <- banco_ante$rating[banco_ante$time == time_fora ][1] # Find rating
      gols_casa <- prov[i,]$gols_casa
      gols_fora <- prov[i,]$gols_fora
      
      #Define k
      k <- n_jogos$media[n_jogos$ano==ano_k]
      print(ano_k)
      print(k)
      ratings_game <- return_rating(gols_1=gols_casa,
                                    gols_2=gols_fora,
                                    rating_1=rating_ante_casa,
                                    rating_2=rating_ante_fora,
                                    k=k) 
      prov$r_timecasa[i] <- ratings_game[1]
      prov$r_timefora[i] <- ratings_game[2]
    }
    newbank <- rbind(newbank, prov)
    prov_ante <- prov
    print("passou")
  }
  return(newbank)
}







banco <- read.csv('banco.csv', stringsAsFactors=FALSE)


##### Numero de jogos por ano
a <- 3 ## a ajustará o K

n_jogos <- banco %>%
  group_by(ano) %>%
  summarise(jogos=n()) %>%
  mutate(media=-1*(jogos-mean(jogos))/sd(jogos)) %>%
  mutate(media=media*a+15)
  




banco <- organize_ratings(banco)
  

banco <- na.omit(banco)


### Create database with all ratings
banco <- arrange(banco, dia)
ratings <- banco # Select database for data_ante
ratings <- rbind(select(ratings, time=time_casa, rating=r_timecasa, dia, ano), 
                    select(ratings, time=time_fora, rating=r_timefora, dia, ano))

ratings$day <- as.Date(ratings$dia, format="%Y-%m-%d")
ratings$day <- format(ratings$day, "%d-%m")
ratings <- filter(ratings, day!="01-01")

ratings <- select(ratings, -day)



 coringao <- filter(ratings, time=="corinthians" )
coringao$dia <- as.Date(coringao$dia, format="%Y-%m-%d")
# coringao$dia <- format(coringao$dia, "%d/%m/%Y")




qplot(dia, rating, data=coringao, geom="line")

ratings <- ratings[!duplicated(select(ratings, -rating )),]

ratings$dia <- as.character(ratings$dia)

# Acrescenta NA para antes de o time entrar no banco
# Nem sempre o primeiro rating de um time começa no mesmo dia
# Temos que preencher os dias que o time joga e nao está preenchido com rating
# colunas <- unique(ratings$time)
ratings_json <- spread(ratings, time, rating)
for (j in 2:ncol(ratings_json)) {
  print(paste0("Foi-", j))
  primeiro <- which(!is.na(ratings_json[,j]))[1]
  if ( length(primeiro)==0)
    next
  if ( primeiro == 1 )
    primeiro <- 2
  for (i in primeiro:nrow(ratings_json)) {
    if ( is.na(ratings_json[i,j]) & ( ratings_json[i,]$ano==ratings_json[(i-1),]$ano ) ) { # Dar if no ano
      ratings_json[i,j] <- ratings_json[(i-1),j]
    } 
  }  
}
# Este bloco está demorando demais, talvez valesse a pena corrigir



# Cria funcao que coloca NA para os times que não participaram de certo ano

banco_ante <- banco
banco_ante <- rbind(select(banco_ante, time=time_casa, ano), select(banco_ante, time=time_fora, ano))
banco_ante <- na.omit(banco_ante)
banco_ante <- banco_ante[!duplicated(banco_ante),]
for (i in unique(ratings_json$ano)) {
  for (j in colnames(ratings_json[3:ncol(ratings_json)])) {
    print(i)
    ano <- i
    time <- j
    if ( nrow(banco_ante[(banco_ante$ano == ano & banco_ante$time == time),])==0 ) {
      ratings_json[ratings_json$ano==ano,][[time]] <- NA
    }
  }
}


# Encontra últimos dias de cada campeonato e os coleta. Depois acrescenta NA e empurra no banco
last_days <- ratings_json %>%
  arrange(dia) %>%
  group_by(ano) %>%
  summarise(dia=tail(dia, 1))
first_days <- ratings_json %>%
  arrange(dia) %>%
  group_by(ano) %>%
  summarise(dia=head(dia, 1))
for (i in colnames(ratings_json[3:ncol(ratings_json)])) {
  last_days[[i]] <- NA
  first_days[[i]] <- NA
}
last_days$dia <- as.character(as.Date(last_days$dia) + 1)
first_days$dia <- as.character(as.Date(first_days$dia) - 1)
ratings_json <- rbind(ratings_json, last_days)
ratings_json <- rbind(ratings_json, first_days)

ratings_json <- arrange(ratings_json, ano)
ratings_json$data <- ratings_json$dia
ratings_json <- select(ratings_json, -dia)

library(RJSONIO)
ratings_json_j <- select(ratings_json, -ano)
ratings_json_j <- toJSON(ratings_json_j)



# Retirando espaços inúteis
ratings_json_j <- gsub(" ", "", ratings_json_j)

write(ratings_json_j, file="historia_fut.json")
system("python3 data_fake.py")



# VERIFICANDO MEDIAS

meanrn <- function(vetor) {
  return(mean(vetor, na.rm=TRUE))
}

medias <- ratings_json  %>%
  select(-data) %>%
  select(-ano)

medias <- apply(medias, 1, meanrn)

medias <- cbind(ratings_json$ano,medias )

medias_db <- data.frame(medias)


group_by(dia) %>%
  summarise(media=mean(rating, na.rm=TRUE)) %>%
  mutate(dia=as.Date(dia, format="%Y-%m-%d"))


qplot(V1,medias,data=medias_db)




### Acha primeira rodada pra cada campeonato

classificacao <- read.csv('CLASSIFICACAO-TIMES.csv', stringsAsFactors=FALSE)
classificacao <- classificacao %>%
  group_by(ano) %>%
  mutate(classificacao=(class-mean(class))/sd(class))






