A [[Carga]] é o peso total que o personagem carrega em relação à sua [[CB]]. Cada nível multiplica o [[Deslocamento]] e reduz a [[Esquiva]], como no GURPS 4e.

### Carga Básica

A Carga Básica vem da [[ST]]:

$$
\text{CB} = \frac{ST \times ST}{10} \text{ kg}
$$

A partir de **5 kg**, arredonde para o kg inteiro mais próximo.

<details>
<summary>Exemplo</summary>

ST 10: $\frac{100}{10} = 10$ kg. ST 12: $\frac{144}{10} = 14{,}4$, arredondado para **14** kg. ST 7: $\frac{49}{10} = 4{,}9$ kg, sem arredondar.

</details>

### Níveis de carga

| Nível           | Peso carregado (kg) | Deslocamento | Esquiva |
| :-------------- | :------------------ | :----------: | :-----: |
| Nenhuma         | até **CB**          |    **×1**    |  **0**  |
| Leve            | até **2 × CB**      |   **×0,8**   | **-1**  |
| Média           | até **3 × CB**      |   **×0,6**   | **-2**  |
| Pesada          | até **6 × CB**      |   **×0,4**   | **-3**  |
| Muito Pesada    | até **10 × CB**     |   **×0,2**   | **-4**  |
| Acima do limite | mais de **10 × CB** | não se move  | **-4**  |

O peso carregado soma todos os itens marcados como carregados no inventário (armaduras, armas, munição, consumíveis, moedas e itens livres) e o peso base informado na ficha. O resumo mostra o nível atual, os limites e a Carga Básica.

### Efeito no Deslocamento e na Esquiva

$$
\text{Deslocamento} = \left\lfloor \lfloor \text{VB} \rfloor \times \text{fator de carga} \right\rfloor
$$

$$
\text{Esquiva} = \text{Deslocamento sem carga} + 4 - \text{nível de carga}
$$

- Arredonde o Deslocamento para baixo. Dentro dos limites, ele nunca fica abaixo de **1**.
- A Esquiva parte do Deslocamento **sem carga**, para a carga não contar duas vezes.
- O nível de carga também vale como redutor em testes de Escalada, Furtividade e Natação.

> [!HOUSE]
> A Esquiva parte do Deslocamento sem carga + 4, em vez da VB + 3 do 4e. O resto segue o 4e.

<details>
<summary>Exemplo</summary>

Com **ST 12** (CB 14 kg) e **VB 5,75** (Deslocamento sem carga 5):

| Carga           | Limite (kg) | Deslocamento | Esquiva |
| :-------------- | :---------: | :----------: | :-----: |
| Nenhuma         |     14      |      5       |    9    |
| Leve            |     28      |      4       |    8    |
| Média           |     42      |      3       |    7    |
| Pesada          |     84      |      2       |    6    |
| Muito Pesada    |     140     |      1       |    5    |
| Acima do limite | mais de 140 |      0       |    5    |

</details>

### Erguer e mover

O que o personagem consegue erguer ou mover, também em múltiplos da CB:

| Ação                                     | Peso        |
| :--------------------------------------- | :---------- |
| Erguer com uma mão (2 segundos)          | **2 × CB**  |
| Erguer com as duas mãos (4 segundos)     | **8 × CB**  |
| Empurrar ou derrubar                     | **12 × CB** |
| Carregar nas costas                      | **15 × CB** |
| Arrastar um pouco (no chão, com esforço) | **50 × CB** |

O resumo da ficha mostra esses valores já calculados.

### ST alterada

- **Encantamentos:** os limites usam a ST **final**. Itens encantados que aumentam ou reduzem a ST mudam a CB na hora, e o Deslocamento e a Esquiva acompanham.
- **Exaustão:** abaixo de **1/3** dos [[PF]], a ST cai pela metade (arredondando para cima) para erguer e carregar. A ficha recalcula a CB e os limites sozinha; o alcance e o dano das armas continuam usando a ST inteira.
