library(tidyr)


banco2015 <- read.csv('~/elo_futebol/banco2015.csv', stringsAsFactors=FALSE)


banco2015$ano <- 2015






banco2015$time_fora <- iconv(banco2015$time_fora, from="utf8", to="ascii//translit")
banco2015$time_fora <- gsub("-","",banco2015$time_fora)
banco2015$time_fora <- tolower(banco2015$time_fora)

banco2015$time_casa <- iconv(banco2015$time_casa, from="utf8", to="ascii//translit")
banco2015$time_casa <- gsub("-","",banco2015$time_casa)
banco2015$time_casa <- tolower(banco2015$time_casa)

banco2015 <- unite(banco2015, dia, data, ano)


banco2015 <- select(banco2015, -rodada)

banco2015$dia <- as.Date(banco2015$dia, format="%d/%m_%Y")
banco2015$dia <- as.character(banco2015$dia)
banco2015$r_timecasa <- NA
banco2015$r_timefora <- NA


banco2015$ano <- 2015

banco <- rbind(banco,banco2015)

