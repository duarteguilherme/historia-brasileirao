library(tidyr)
library(dplyr)
library(ggplot2)
library(lubridate)
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
  rodadas$rating <- ((2/3) * rodadas$rating + (1/3)*950)
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
  newbank <- data.frame(dia=as.Date("1929-01-01", "%Y-%m-%d"),
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

source('Adicionando-2015.R')

banco$time_casa <- gsub(" ", "",banco$time_casa)
banco$time_fora <- gsub(" ", "",banco$time_fora)


##### Numero de jogos por ano
a <- 4 ## a ajustará o K
b <- 25 ## media

# bancob <- rbind(select(banco, time=time_casa, ano, dia),select(banco, time=time_fora, ano, dia))
#n_jogos <- bancob %>%
#  group_by(ano, time) %>%
#  summarise(jogos=n()) %>%
#  group_by(ano) %>%
#  summarise(media=max(jogos)) %>%
#  mutate(media=(media-65)*(-1))


n_jogos <- banco %>%
  group_by(ano) %>%
  summarise(jogos=n()) %>%
  mutate(media=-1*(jogos-mean(jogos))/sd(jogos)) %>%
  mutate(media=media*a+b)
  



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


ratings$dia <- as.Date(ratings$dia, format="%Y-%m-%d")


# Dicionario para times
dict_times <- data.frame(time=unique(c(ratings$time)), stringsAsFactors=FALSE)
dict_times$id_times <- 1:nrow(dict_times)



# Criando dados para jogos
jogos <- select(banco, time_casa, time_fora, gols_casa, gols_fora, dia, ano)
jogos$id_jogos <- 1:nrow(jogos)


# Adicionando valores de indice para time_casa e time_fora
prov_times <- select(dict_times, time_casa=time, id_timecasa=id_times)
jogos <- inner_join(jogos, prov_times)
prov_times <- select(dict_times, time_fora=time, id_timefora=id_times)
jogos <- inner_join(jogos, prov_times)






# Acrescenta NA para antes de o time entrar no banco
# Nem sempre o primeiro rating de um time começa no mesmo dia
# Temos que preencher os dias que o time joga e nao está preenchido com rating
# colunas <- unique(ratings$time)
# ratings_json <- spread(ratings, time, rating)
#for (j in 2:ncol(ratings_json)) {
#  print(paste0("Foi-", j))
#  primeiro <- which(!is.na(ratings_json[,j]))[1]
#  if ( length(primeiro)==0)
#    next
#  if ( primeiro == 1 )
#    primeiro <- 2
#  for (i in primeiro:nrow(ratings_json)) {
#    if ( is.na(ratings_json[i,j]) & ( ratings_json[i,]$ano==ratings_json[(i-1),]$ano ) ) { # Dar if no ano
#      ratings_json[i,j] <- ratings_json[(i-1),j]
#    } 
#  }  
# }
# Este bloco está demorando demais, talvez valesse a pena corrigir



# Encontra últimos dias de cada campeonato e os coleta. Depois acrescenta NA e empurra no banco
last_days <- ratings %>%
  arrange(dia) %>%
  group_by(ano, time) %>%
  summarise(dia=tail(dia, 1))
first_days <- ratings %>%
  arrange(dia) %>%
  group_by(ano, time) %>%
  summarise(dia=head(dia, 1))
last_days$rating <- NA
first_days$rating <- NA


last_days$dia <- as.character(as.Date(last_days$dia) + 1)
first_days$dia <- as.character(as.Date(first_days$dia) - 1)
ratings$dia <- as.character(ratings$dia)


ratings <- rbind(ratings, last_days)
ratings <- rbind(ratings, first_days)

ratings <- ratings[!duplicated(select(ratings, time, dia)),]

# ratings_json <- spread(ratings, time, rating)


# Cria funcao que coloca NA para os times que não participaram de certo ano


# removendo caracteres na data
# 

ratings$dia <- as.Date(ratings$dia, format="%Y-%m-%d")

ratings <- arrange(ratings, dia)


# Arredonda rating
ratings$rating <- floor(ratings$rating)




# Define times  imporatntes
importantes <- ratings %>%
  filter(!is.na(rating)) %>%
  group_by(ano, time) %>%
  summarise(inutil=n()) %>%
  select(-inutil) %>%
  group_by(time) %>%
  summarise(quantos=n()) %>%
  filter(quantos > 3) # Mudar para três quando fores os importantes. Lembrar disso.

times_pontos_corrigos <- ratings %>%
  filter(ano>=2003) %>%
  select(time) %>%
  unique()
  

# RETIRA TIMES NAO IMPORTANTES

jogos <- jogos %>% 
  filter( (time_casa %in% importantes$time) | (time_casa %in% times_pontos_corrigos$time) ) %>%
  filter( (time_fora %in% importantes$time) | (time_fora %in% times_pontos_corrigos$time) )
  
ratings <- ratings %>%
  filter( (time %in% importantes$time) | (time %in% times_pontos_corrigos$time) )

dict_times <- dict_times %>%
  filter( (time %in% importantes$time) | (time %in% times_pontos_corrigos$time) )

str(ratings)


# Criando dicionario para ranking ( sem NULL ), mudar aqui qualquer coisa
ratings <- na.omit(ratings) # Retira NULL

dict_datas <- data.frame(dia=unique(c(ratings$dia)), stringsAsFactors=FALSE)
dict_datas$id_datas <- 1:nrow(dict_datas)


ratings <- inner_join(ratings, dict_times)
ratings <- inner_join(ratings, dict_datas)
ratings <- select(ratings, id_times, id_datas, rating)

dados <- list()
for (i in unique(ratings$id_times)) {
  print(i)
  pr <- filter(ratings, id_times==i)
  dados[[i]] <- select(pr, -id_times)    
}


# Arruma jogos
jogos <- inner_join(jogos, dict_datas)

jogos <- select(jogos, time_casa=id_timecasa, time_fora=id_timefora,
                gols_casa, gols_fora, id_datas, ano )

# Salva ratings


lista <- list(dados=dados, dict_times=dict_times, dict_datas=dict_datas, jogos=jogos)

library(RJSONIO)

lista_json <- toJSON(lista)

write(lista_json, "dadosfull.json")

ratings <- inner_join(ratings, dict_times)
ratings <- inner_join(ratings, dict_datas)
ratings <- inner_join(ratings, jogos)


medias_times <- ratings %>%
  group_by(time, ano) %>%
  summarise(rating=mean(rating, na.rm=TRUE)) %>%
  group_by(time) %>%
  summarise(medias=sum(rating, na.rm=TRUE)/45)



length(unique(ratings[ratings$time=="atleticomg",]$ano))


minimos <- ratings %>%
  group_by(time, ano) %>%
  summarise(rating=mean(rating, na.rm=TRUE)) %>%
  group_by(ano) %>%
  summarise(minimo=min(rating))


medias_times_pv <- data.frame(expand.grid(unique(ratings$time), unique(ratings$ano)), stringsAsFactors=FALSE)
colnames(medias_times_pv) <- c("time","ano")
medias_times_pv$time <- as.character(medias_times_pv$time)
medias_times_pv <- left_join(medias_times_pv, ratings)

for(i in 1971:2015) {
  print(i)
  medias_times_pv[medias_times_pv$ano==i & is.na(medias_times_pv$rating),]$rating <- minimos[minimos$ano==i,]$minimo
}
medias_times_pv <- medias_times_pv %>%
  group_by(time, ano) %>%
  summarise(rating=mean(rating, na.rm=TRUE)) %>%
  group_by(time) %>%
  summarise(medias=sum(rating, na.rm=TRUE)/45)
medias_times_pv <- arrange(medias_times_pv, desc(medias))
new <- medias_times_pv
medias_times_pv <- data.frame(expand.grid(unique(filter(ratings, ano >= 2003)$time), unique(filter(ratings, ano >= 2003)$ano)), stringsAsFactors=FALSE)
colnames(medias_times_pv) <- c("time","ano")
medias_times_pv$time <- as.character(medias_times_pv$time)
medias_times_pv <- left_join(medias_times_pv, ratings)

for(i in 2003:2015) {
  print(i)
  medias_times_pv[medias_times_pv$ano==i & is.na(medias_times_pv$rating),]$rating <- minimos[minimos$ano==i,]$minimo
}
medias_times_pv <- medias_times_pv %>%
  group_by(time, ano) %>%
  summarise(rating=mean(rating, na.rm=TRUE)) %>%
  group_by(time) %>%
  summarise(medias=sum(rating, na.rm=TRUE)/13)
medias_times_pv <- arrange(medias_times_pv, desc(medias))
colnames(medias_times_pv) <- c("time","pc_medias")
new <- left_join(new, medias_times_pv)


medias_times_pv <- data.frame(expand.grid(unique(filter(ratings, ano >= 2003)$time), unique(filter(ratings, ano < 2003)$ano)), stringsAsFactors=FALSE)
colnames(medias_times_pv) <- c("time","ano")
medias_times_pv$time <- as.character(medias_times_pv$time)
medias_times_pv <- left_join(medias_times_pv, ratings)

for(i in 1971:2002) {
  print(i)
  medias_times_pv[medias_times_pv$ano==i & is.na(medias_times_pv$rating),]$rating <- minimos[minimos$ano==i,]$minimo
}
medias_times_pv <- medias_times_pv %>%
  group_by(time, ano) %>%
  summarise(rating=mean(rating, na.rm=TRUE)) %>%
  group_by(time) %>%
  summarise(medias=sum(rating, na.rm=TRUE)/32)
medias_times_pv <- arrange(medias_times_pv, desc(medias))
colnames(medias_times_pv) <- c("time","n_pc_medias")
new <- left_join(new, medias_times_pv)


quantos <- ratings %>%
  group_by(time,ano) %>%
  summarise(neme=n()) %>%
  group_by(time) %>%
  summarise(numero_campeonatos=n())
quantospc <- filter(ratings, ano>=2003) %>%
  group_by(time,ano) %>%
  summarise(neme=n()) %>%
  group_by(time) %>%
  summarise(pc_numero_campeonatos=n())
quantosnpc <- filter(ratings, ano<2003) %>%
  group_by(time,ano) %>%
  summarise(neme=n()) %>%
  group_by(time) %>%
  summarise(n_pc_numero_campeonatos=n())

new <- left_join(left_join(left_join(new, quantos),quantospc),quantosnpc)

campeoes <- read.csv('campeoes.csv', stringsAsFactors=FALSE)
campeoes$time <- iconv(campeoes$time, from="utf8",to="ascii//translit")
campeoes$time <- gsub("-","",campeoes$time)
campeoes$time <- gsub(" ","",campeoes$time)
campeoes$time <- tolower(campeoes$time)

camp <- campeoes %>%
  group_by(time) %>%
  summarise(titulos_total=n())
campc <- filter(campeoes, ano>=2003) %>%
  group_by(time) %>%
  summarise(pc_titulos_total=n())
camnpc <- filter(campeoes, ano<2003) %>%
  group_by(time) %>%
  summarise(n_pc_titulos_total=n())

new <- left_join(left_join(left_join(new, camp), campc), camnpc)


new <- select(new,
              time,
              numero_campeonatos,
              titulos_total,
              media_total=medias,
              pc_numero_campeonatos,
              pc_titulos_total,
              pc_medias,
              n_pc_numero_campeonatos,
              n_pc_titulos_total,
              n_pc_medias)


WriteXLS("new","medias.xls", row.names=FALSE)

medias_times_av <- ratings %>%
  group_by(time, ano) %>%
  summarise(rating=mean(rating, na.rm=TRUE)) %>%
  inner_join(minimos) %>%
  group_by(time) %>%
  summarise(medias=sum(rating, na.rm=TRUE), n=(45-n()),minimo=mean(minimo)) %>%
  mutate(new_average=(medias+n*minimo)/45) %>%
  arrange(desc(new_average))

min <- 800
medias_times_av <- medias_times_av %>%
  

library(WriteXLS)
WriteXLS("medias_times", "medias_times.xls", row.names=FALSE)
WriteXLS("medias_times_av", "medias_times_av.xls", row.names=FALSE)
  WriteXLS("medias_times_pv", "media_times_min_ano.xls", row.names=FALSE)


write.csv(ratings, "ratings.csv", row.names=FALSE)

# Deleta ano
ratings <- select(ratings, -ano)


# Cria índice para times
ratings$time <- as.factor(ratings$time)

levels_time <- levels(ratings$time)
dicio <- data.frame(ind=1:length(levels_time), time=levels_time, stringsAsFactors=FALSE)


ratings$time <- as.numeric(ratings$time)




arquivo <- list(dicio, ratings)



library(RJSONIO)
ratings_json_j <- toJSON(arquivo)



# Retirando espaços inúteis
ratings_json_j <- gsub(" ", "", ratings_json_j)

write(ratings_json_j, file="visualizacao/data/dadosfull.json")


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




#### Tabela_ratings
ratings$dia <- as.Date(ratings$dia, format="%Y-%m-%d")
tabela_ratings <- ratings %>%
  group_by(ano, time) %>%
  summarise(dia=max(dia))
tabela_ratings <- inner_join(tabela_ratings, ratings)
write.csv(tabela_ratings, "resultados-ratings.csv", row.names=FALSE)


campeoes <- inner_join(campeoes, tabela_ratings)

resultados <- read.csv('resultados.csv', stringsAsFactors=FALSE)
resultados <- inner_join(resultados,tabela_ratings)

campeoes <- campeoes %>%
  mutate(ano_time=paste0(ano, time))

ggplot(campeoes, aes(x=taxa_vitoria, y=rating, label=ano_time)) +
  geom_point(shape=1) +
  geom_smooth(method="lm") + 
  geom_text()

ggplot(resultados, aes(x=taxa_vitoria, y=rating)) +
  geom_point(shape=1) +
  geom_smooth(method="lm")


cor(campeoes$taxa_vitoria, campeoes$rating)

cor(resultados$taxa_vitoria, resultados$rating)

write.csv(campeoes,"campeoes.csv", row.names=FALSE)



