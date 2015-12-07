## Medidas para o historia brasileirao

library(readr)
library(tidyr)
library(dplyr)

setwd('/var/www/html/historia_brasileirao/')
ratings <- read_csv('ratings.csv')


ratings <- na.omit(ratings)


medias_totais <- ratings %>%
  group_by(time) %>%
  summarise(media_total=mean(rating))


medias_parciais <- ratings %>%
  arrange(dia) %>%
  group_by(ano, time)             %>%
  summarise(media_parcial=rating[length(dia)]) %>%
  group_by(time) %>%
  summarise(media_parcial=mean(media_parcial))


diferencas <- ratings %>%
  arrange(dia) %>%
  group_by(ano, time)   %>%
  summarise(diff=(rating[length(dia)]-rating[1])) %>%
  mutate(subiu=ifelse(diff>0, TRUE,FALSE)) %>%
  arrange(desc(diff))



medias <- inner_join(medias_totais, medias_parciais) %>%
  arrange(desc(media_total))



max_min <- ratings %>%
  group_by(ano,time) %>%
  summarise(maximo=max(rating),
            minimo=min(rating)) %>%
  arrange(desc(maximo))


write.csv(medias, "medias.csv", row.names=FALSE)
write.csv(diferencas, "diferencas.csv", row.names=FALSE)
write.csv(max_min, "max_min.csv", row.names=FALSE)


library(WriteXLS)

WriteXLS("medias", "medias-corrigido.xls", row.names=FALSE)
WriteXLS("diferencas", "diferencas-corrigido.xls", row.names=FALSE)
WriteXLS("max_min", "max_min-corrigido.xls", row.names=FALSE)


n_jogos <- ratings %>%
  group_by(time, ano) %>%
  summarise(nunha=n()) %>%
  group_by(time) %>%
  summarise(n_jogos=n())

medias_times <- ratings %>%
  group_by(time) %>%
  summarise(media_total=mean(rating))


medias_times <- inner_join(medias_times, n_jogos) 


medias_times <- medias_times %>%
  mutate(values=media_total*n_jogos) %>%
  summarise(values=sum(values)/sum(n_jogos)) %>%
  print
