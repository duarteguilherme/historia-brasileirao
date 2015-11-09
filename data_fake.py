import json
from datetime import *

def date_range(start, end, intv):
    diff = (end  - start ) / intv
    for i in range(intv):
        yield (start + diff * i).strftime("%Y-%m-%d")
    yield end.strftime("%Y-%m-%d")

with open('/var/www/html/historia_brasileirao/historia_fut.json','r') as file:
    dados = json.load(file)
    dados['data'] = dados['data']
    datas = [datetime.strptime(d,'%Y-%m-%d').date() for d in dados['data']]

    n_dados = {}
    for d in datas:
        if d.year not in n_dados:
            n_dados[d.year] = []
        n_dados[d.year].append(d)

    dados_saida = []
    for ano in n_dados:
        tamanho = len(n_dados[ano])
        start = date(ano,1,1)
        end = date(ano,11,30)
        novas_datas = date_range(start,end,tamanho-1)
        novas_datas = [n for n in novas_datas]
        dados_saida += novas_datas

    dados['data_fake'] = dados_saida

    with open('visualizacao/data/dadosfull.json','w') as outfile:
        json.dump(dados,outfile)








