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


return_rating <- function(gols_1, gols_2, rating_1=1200, rating_2=1200, casa_fora=0, k=20) {
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
    W_e <- 1/(1 + 10^(-d_r/400))
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
    
    rating_1_r <- rating_1 + ( k * G(gols_1,gols_2) * ( W(gols_1, gols_2) - W_e(rating_1, rating_2) ) ) # Number 1 rating 
    rating_2_r <- rating_2 + ( k * G(gols_2,gols_1) * ( W(gols_2, gols_1) - W_e(rating_2, rating_1) ) ) # Number 2 rating
    return(c(rating_1_r, rating_2_r))
}

# How to draw the function
# Creates a table with all data and all times

# Check if changes or not in table
organize_ratings <- function(banco) { 
  # banco$r_timecasa <- NA # Create column filled in with Home Team rating
  # banco$r_timefora <- NA # Create column filled in with Guest Team rating
  banco <- arrange(banco, dia)
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
    ratings_game <- return_rating(gols_1=gols_casa,
                                  gols_2=gols_fora,
                                  rating_1=rating_ante_casa,
                                  rating_2=rating_ante_fora) 
    banco$r_timecasa[i] <- ratings_game[1]
    banco$r_timefora[i] <- ratings_game[2]
  }
  return(banco)
}



banco <- read.csv('brasileiros-unique.csv', stringsAsFactors=FALSE)


banco <- organize_ratings(banco)


### Create database with all ratings

ratings <- banco # Select database for data_ante
ratings <- rbind(select(ratings, time=time_casa, rating=r_timecasa, dia), 
                    select(ratings, time=time_fora, rating=r_timefora, dia))
ratings <- filter(ratings, dia!="0000-00-00")



coringao <- filter(ratings, time=="corinthians")
coringao$dia <- as.Date(coringao$dia, format="%Y-%m-%d")
plot(coringao$dia, coringao$rating, type="l")