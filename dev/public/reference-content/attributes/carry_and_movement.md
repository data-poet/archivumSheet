A [[Carga]] é o peso total que o personagem carrega em relação à sua [[ST]]. Ela gera um modificador somado à [[VB]] no cálculo do [[Deslocamento]] e, por consequência, reduz também a [[Esquiva]].

> [!HOUSE]
> No Archivum, os limites de carga são múltiplos da **ST** (em kg), sem a Carga Básica (ST²/10) da regra padrão. A carga leve não tem penalidade.

### Níveis de carga

| Nível           | Peso carregado (kg) | Modificador |
| :-------------- | :------------------ | :---------: |
| Nenhuma         | até **ST**          |    **0**    |
| Leve            | até **2 × ST**      |    **0**    |
| Média           | até **3 × ST**      |   **-1**    |
| Pesada          | até **6 × ST**      |   **-2**    |
| Muito Pesada    | até **10 × ST**     |   **-3**    |
| Acima do limite | mais de **10 × ST** |   **-4**    |

O peso carregado soma todos os itens marcados como carregados no inventário (armaduras, armas, munição, consumíveis, moedas e itens livres) e o peso base informado na ficha.

### Efeito no Deslocamento e na Esquiva

$$
\text{Deslocamento} = \left\lfloor \text{VB} + \text{modificador de carga} \right\rfloor
$$

$$
\text{Esquiva} = \text{Deslocamento} + 4
$$

Cada ponto de modificador tira um ponto do Deslocamento e um da Esquiva.

<details>
<summary>Exemplo</summary>

Com **ST 10** e **VB 5,75**:

| Carga           | Limite (kg) | Deslocamento | Esquiva |
| :-------------- | :---------: | :----------: | :-----: |
| Nenhuma         |     10      |      5       |    9    |
| Leve            |     20      |      5       |    9    |
| Média           |     30      |      4       |    8    |
| Pesada          |     60      |      3       |    7    |
| Muito Pesada    |     100     |      2       |    6    |
| Acima do limite | mais de 100 |      1       |    5    |

</details>

### Força alterada por encantamentos

Os limites usam a ST **final**. Itens encantados que aumentam ou reduzem a ST mudam os limites de carga na hora, e o Deslocamento e a Esquiva acompanham.
