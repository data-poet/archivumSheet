Arcos, bestas, fundas, armas de arremesso e magias de projétil seguem as mesmas regras básicas. Contra projéteis, o alvo normalmente só pode esquivar ou bloquear. Aparar só funciona contra armas arremessadas.

### O ataque

Role contra o [[NH]] da perícia da arma, somando os modificadores abaixo.

- **Precisão:** bônus da arma que só vale se o personagem gastar ao menos um turno mirando. Veja Mirar em Combate › Manobras › Ataque e Movimento.
- **Distância e velocidade:** redutor pela distância até o alvo, somada à velocidade dele, se ele se mover rápido. Use a tabela abaixo.
- **Tamanho:** alvos maiores que um humano são mais fáceis de acertar; menores, mais difíceis.
- **Local de acerto:** redutor normal do local escolhido. Veja Combate › Regras › Locais de Acerto.
- **Postura do atirador:** a posição de quem atira ao disparar. Veja a tabela abaixo.

### Postura do atirador

| Postura                | Ataque à distância |
| ----------------------- | ------------------- |
| Em pé                   | **0**                |
| Agachado                | **-2**               |
| Ajoelhado ou sentado    | **0**                |
| Rastejando ou deitado   | **-2**               |

### Distância, velocidade e tamanho

Some a distância em metros até o alvo à velocidade dele em metros por segundo, e use essa soma na coluna **Distância + Velocidade**. Se o resultado cair entre duas linhas, use a linha de baixo, com o redutor maior. A coluna **Tamanho** usa a mesma escala de medida, só que aplicada à maior dimensão do alvo.

| Medida (m) | Redutor por distância + velocidade | Modificador por tamanho |
| ---------- | ----------------------------------- | ------------------------ |
| 0,5        | **0**                                | **-4**                   |
| 1          | **0**                                | **-2**                   |
| 2          | **0**                                | **0**                    |
| 3          | **-1**                               | **+1**                   |
| 5          | **-2**                               | **+2**                   |
| 7          | **-3**                               | **+3**                   |
| 10         | **-4**                               | **+4**                   |
| 15         | **-5**                               | **+5**                   |
| 20         | **-6**                               | **+6**                   |
| 30         | **-7**                               | **+7**                   |
| 50         | **-8**                               | **+8**                   |
| 70         | **-9**                               | **+9**                   |
| 100        | **-10**                              | **+10**                  |
| 150        | **-11**                              | **+11**                  |
| 200        | **-12**                              | **+12**                  |
| 300        | **-13**                              | **+13**                  |
| 500        | **-14**                              | **+14**                  |

> [!TIP]
> A tabela continua no mesmo padrão: cada vez que a medida aumenta cerca de 50%, o redutor de distância cresce **-1**.

<details>
<summary>Exemplos</summary>

**Distância e velocidade:** uma arqueira com **NH 14** e arco de **Precisão 2** mira por um turno num lobo a **18 m**, parado. A linha de **20 m** dá **-6**, e o lobo, com cerca de 1 m de comprimento, dá **-2**:

$$
14 + 2 - 6 - 2 = 8
$$

Se o lobo estivesse correndo a **10 m/s**, a medida seria $18 + 10 = 28$, na linha de **30 m**, e o redutor de distância subiria para **-7**.

**Tamanho:** um dragão de **20 m** de comprimento dá **+6** pelo tamanho, mesmo parado — o mesmo valor que o redutor de distância a 20 m, só que a favor de quem atira.

</details>

### Alcance

- **Meio Dano:** além dessa distância, o dano do ataque cai pela metade. A Precisão não muda.
- **Distância Máxima:** o projétil não alcança alvos além dela.
- Armas movidas pela força, como arcos e armas de arremesso, costumam listar esses valores como múltiplos da [[ST]] do usuário.

### Cadência de Tiro e Recuo

- **Cadência de Tiro:** quantos disparos a arma faz em um único ataque. A maioria das armas de baixa tecnologia tem cadência **1**.
- **Rajadas:** atirar muitas vezes no mesmo ataque dá bônus ao [[NH]]: **+1** com 5 a 8 disparos, **+2** com 9 a 12, **+3** com 13 a 16, **+4** com 17 a 24, **+5** com 25 a 49 e **+6** com 50 a 99.
- **Acertos múltiplos:** um sucesso acerta uma vez. Cada vez que a margem de sucesso alcança o **Recuo** da arma, mais um disparo acerta, até o total de disparos.
- **Defesa:** uma Esquiva bem-sucedida evita um acerto, e mais um cada vez que a margem alcança o Recuo.

<details>
<summary>Exemplo</summary>

Um personagem lança três estrelas de arremesso de uma vez (**Cadência 3**, **Recuo 1**) e passa no teste por **2**. Ele acerta $1 + 2 = 3$ vezes. Se o alvo esquivar com margem **1**, evita $1 + 1 = 2$ acertos e sofre só um.

</details>

### Volume

O **Volume** mede o quanto a arma é desajeitada de manejar. Ele é usado como redutor em vez do normal quando for pior:

- **Avançar e Atacar:** **-2** ou o Volume, o que for pior. Veja Combate › Manobras › Ataque e Movimento.
- **Combate corpo a corpo:** disparar contra um alvo ao alcance das mãos aplica o Volume como redutor.
