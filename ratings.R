library(tidyr)
library(dplyr)
setwd('~/historia_brasileirao/')


clean_database_elo <- function(db) { # Clean database
  db <- select(db, ano, dia, time_casa, gols_casa, time_fora,gols_fora, r_timecasa, r_timefora)
  db$time_casa <- tolower(db$time_casa)
  db$time_fora <- tolower(db$time_fora)
  db$time_casa <- iconv(db$time_casa, to="ascii//translit")
  db$time_fora <- iconv(db$time_fora, to="ascii//translit")
  db$time_casa <- gsub(" ", "-", db$time_casa)
  db$time_fora <- gsub(" ", "-", db$time_fora)
  return(db)
}


return_rating <- function(gols_1, gols_2, rating_1=1200, rating_2=1200, casa_fora=0, k=20, ksi=1000) {
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
organize_ratings <- function(banco) { 
  # banco$r_timecasa <- NA # Create column filled in with Home Team rating
  # banco$r_timefora <- NA # Create column filled in with Guest Team rating
  banco <- arrange(banco, dia)
  banco$ano <- as.Date(banco$dia, format="%Y-%m-%d")
  banco$ano <- as.numeric(format(banco$ano, format="%Y"))
  for (i in 1:nrow(banco)) {
    print(i)
    # Find accurate time
    data <- banco$dia[i]
    if ( data =="0000-00-00" ) {
        next
    }
    print("passou")
    time_casa <- banco$time_casa[i]
    time_fora <- banco$time_fora[i]
    banco_ante <- banco[banco$dia<data,] # Select database for data_ante
    banco_ante <- rbind(select(banco_ante, time=time_casa, rating=r_timecasa, dia), select(banco_ante, time=time_fora, rating=r_timefora, dia))
    banco_ante <- arrange(banco_ante, desc(dia))
    rating_ante_casa <- banco_ante$rating[banco_ante$time == time_casa ][1] # Find rating
    rating_ante_fora <- banco_ante$rating[banco_ante$time == time_fora ][1] # Find rating
    gols_casa <- banco[i,]$gols_casa
    gols_fora <- banco[i,]$gols_fora
    
    # BLOCK - DEFINE K 
    k <- banco[i,]$k
    
    if ( k == 0 | is.na(k) ) {
      k <- 14
    }
    
    k <- 20
    
    print(k)
    
    ratings_game <- return_rating(gols_1=gols_casa,
                                  gols_2=gols_fora,
                                  rating_1=rating_ante_casa,
                                  rating_2=rating_ante_fora,
                                  k=k) 
    banco$r_timecasa[i] <- ratings_game[1]
    banco$r_timefora[i] <- ratings_game[2]
  }
  return(banco)
}



banco <- read.csv('brasileiros-unique.csv', stringsAsFactors=FALSE)


banco <- organize_ratings(banco)


### Create database with all ratings

ratings <- banco # Select database for data_ante
ratings <- rbind(select(ratings, time=time_casa, rating=r_timecasa, dia, ano), 
                    select(ratings, time=time_fora, rating=r_timefora, dia, ano))
ratings <- filter(ratings, dia!="0000-00-00")

# Teste




# Acrescenta NA para antes de o time entrar no banco
colunas <- unique(ratings$time)
ratings_json <- spread(ratings, time, rating)
for (j in 2:ncol(ratings_json)) {
  primeiro <- which(!is.na(ratings_json[,j]))[1]
  if ( length(primeiro)==0)
    next
  for (i in primeiro:nrow(ratings_json)) {
    if ( is.na(ratings_json[i,j]) )
      ratings_json[i,j] <- ratings_json[(i-1),j]
  }
}



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
last_days$dia <- as.character(as.Date(last_days$dia) + 45)
first_days$dia <- as.character(as.Date(first_days$dia) - 45)
ratings_json <- rbind(ratings_json, last_days)
ratings_json <- rbind(ratings_json, first_days)

ratings_json <- arrange(ratings_json, ano)


library(RJSONIO)
ratings_json <- select(ratings_json, -ano)
ratings_json <- toJSON(ratings_json)

write(ratings_json, file="historia_fut.json")



coringao <- filter(ratings, time=="corinthians")
coringao$dia <- as.Date(coringao$dia, format="%Y-%m-%d")
plot(coringao$dia, coringao$rating, type="l")