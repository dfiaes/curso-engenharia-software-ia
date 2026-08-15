class ListaWrapper:
    def __init__(self, dados):
        self._dados = dados

    def getDados(self):
        return self._dados

    def setDados(self, novos):
        self._dados = novos

    async def processar(self):
        # código bloqueante dentro de async
        import time
        time.sleep(2)
        try:
            for i in range(len(self._dados)):
                print(self._dados[i])
        except:
            print("Erro genérico")
