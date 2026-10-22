Os pontos de personagem pagam pelos atributos escolhidos pelo jogador. Atributos inatos da raça e da meta-raça, modificadores e encantamentos são gratuitos.

### Atributos primários

Cada nível acima de **10** custa pontos, e cada nível abaixo devolve a mesma quantidade:

| Atributo | Custo por nível |
| :------- | :-------------: |
| [[ST]]   |     **10**      |
| [[DX]]   |     **20**      |
| [[IQ]]   |     **20**      |
| [[HT]]   |     **10**      |

$$
\text{Custo} = (\text{Base} - 10) \times \text{custo por nível}
$$

Só a **Base** entra na conta. Os bônus de raça e meta-raça são somados por cima da escolha do jogador, sem custo.

<details>
<summary>Exemplo</summary>

DX 12 custa $(12 - 10) \times 20 = 40$ pontos. ST 9 devolve $(9 - 10) \times 10 = -10$ pontos.

</details>

### Atributos secundários

Depois de calculado, cada atributo secundário pode ser aumentado com compras. Cada compra custa **5 pontos**:

| Atributo                                                    |   Ganho por compra    | Máximo de compras |
| :---------------------------------------------------------- | :-------------------: | :---------------: |
| [[PV]], [[Mana]]                                            |        **+4**         |         5         |
| [[VB]]                                                      |       **+0,5**        |         6         |
| [[PF]], [[Toxicidade]], [[Vontade]], Visão, Audição, Olfato |        **+1**         |         5         |
| [[Deslocamento]], [[Esquiva]], [[RD]]                       | não pode ser comprado |         —         |

$$
\text{Custo} = \text{compras} \times 5
$$

<details>
<summary>Exemplo</summary>

Duas compras de PV: $+8$ PV por $2 \times 5 = 10$ pontos. Uma compra de VB leva 5,75 a 6,25, o que também aumenta o Deslocamento e a Esquiva em 1.

</details>

### Ordem do cálculo

1. **Primários:** Base + Raça (inclui a meta-raça) + Modificador + Encantamento.
2. **Base dos secundários:** fórmulas aplicadas aos primários finais. Vantagens e desvantagens como Força de Vontade ou Audição Aguçada somam ou subtraem dessas bases automaticamente.
3. **Secundários:** base + compras, depois modificadores e encantamentos.
4. **Deslocamento:** VB arredondada para baixo, multiplicada pelo fator de carga (mínimo 1).
5. **Esquiva:** VB arredondada para baixo + 3, menos o nível de carga, mais modificadores e encantamentos.
6. **Ferido gravemente:** se os PV atuais estiverem abaixo de 1/3 dos PV naturais, o Deslocamento e a Esquiva caem pela metade, arredondando para cima. A VB não muda.
