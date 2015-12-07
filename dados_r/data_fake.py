import json
from datetime import *

def date_range(start, end, intv):
    diff = (end  - start ) / intv
    for i in range(intv):
        yield (start + diff * i).strftime("%Y-%m-%d")
    yield end.strftime("%Y-%m-%d")

with open('visualizacao/data/dadosfull.json','r') as file:
    dados = json.load(file)

    dados[1]['data'] = dados[1]['dia']
    del dados[1]['dia']
    datas = [datetime.strptime(d,'%y%m%d').date() for d in dados[1]['data']]

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
        novas_datas = ["".join(n.split("-"))[2:] for n in novas_datas]
        dados_saida += novas_datas

    dados[1]['data_fake'] = dados_saida

    with open('visualizacao/data/dadosfull.json','w') as outfile:
        json.dump(dados,outfile)








