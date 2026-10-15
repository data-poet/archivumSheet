Os atributos secundários são calculados a partir dos valores **finais** dos atributos primários. Depois do cálculo, a maioria ainda pode ser comprada com pontos (veja Custo e Compra) e receber modificadores e encantamentos.

Os exemplos abaixo usam o mesmo personagem: **ST 10, DX 12, IQ 12, HT 11**.

<details>
<summary>Pontos de Vida (PV)</summary>

Os [[PV]] representam quanto dano o personagem aguenta.

$$
\text{PV} = \left\lfloor \frac{HT \times 4 + ST \times 2}{2} \right\rfloor
$$

> [!EXAMPLE]
>
> $$
> \text{PV} = \left\lfloor \frac{11 \times 4 + 10 \times 2}{2} \right\rfloor = \left\lfloor \frac{64}{2} \right\rfloor = 32
> $$

<details>
<summary>Limiares de morte</summary>

Os testes para não morrer usam a [[HT]], não os PV. Assim, personagens com muitos PV não ganham uma margem enorme antes da morte.

> [!HOUSE]
> A HT usada aqui é a **base + raça + meta-raça**. Equipamentos, encantamentos e efeitos temporários não contam.

- **PV ≤ 0:** teste de HT a cada rodada para não desmaiar.
- **PV = -1 × HT:** teste de HT para não morrer, repetido a cada novo múltiplo negativo de HT.
- **PV = -5 × HT:** morte automática.
- **PV = -10 × HT:** o corpo é destruído, se a fonte do dano for capaz disso.

Com HT 11 e 32 PV: testes de morte em **-11, -22, -33 e -44**, morte automática em **-55** e corpo destruído em **-110**. Na regra padrão (×PV), seriam -32 e -160.

</details>

</details>

<details>
<summary>Mana</summary>

A [[Mana]] é a energia mágica disponível para conjurar magias e sustentar efeitos mágicos.

$$
\text{Mana} = \left\lfloor \frac{IQ \times 4 + HT \times 2}{2} \right\rfloor
$$

> [!EXAMPLE]
>
> $$
> \text{Mana} = \left\lfloor \frac{12 \times 4 + 11 \times 2}{2} \right\rfloor = \left\lfloor \frac{70}{2} \right\rfloor = 35
> $$

</details>

<details>
<summary>Toxicidade</summary>

A [[Toxicidade]] é o limite do corpo para consumir substâncias alquímicas sem sofrer efeitos adversos.

$$
\text{Toxicidade} = \left\lfloor \frac{HT \times 4 + ST \times 2 + IQ \times 2}{3} \right\rfloor
$$

> [!EXAMPLE]
>
> $$
> \text{Toxicidade} = \left\lfloor \frac{44 + 20 + 24}{3} \right\rfloor = \left\lfloor 29{,}33 \right\rfloor = 29
> $$

</details>

<details>
<summary>Vontade</summary>

A [[Vontade]] mede a capacidade de resistir a pressão psicológica (medo, hipnotismo, interrogatório, sedução, tortura) e a ataques sobrenaturais, como magia.

$$
\text{Vontade} = IQ
$$

Pode ser aumentada com pontos. A vantagem Força de Vontade e a desvantagem Vontade somam ou subtraem da base automaticamente.

</details>

<details>
<summary>Sentidos: Visão, Audição e Olfato</summary>

A [[Per]] representa a atenção geral do personagem. O Mestre pede testes de sentidos para saber se ele nota detalhes ou acontecimentos ao redor. Na ficha, ela é dividida em três sentidos, cada um com seu próprio valor:

$$
\text{Visão} = \text{Audição} = \text{Olfato} = IQ
$$

Cada sentido pode ser comprado separadamente. As vantagens Visão Aguçada, Ouvido Aguçado e Paladar/Olfato Apurados somam ao sentido correspondente, e Prontidão soma aos três.

</details>

<details>
<summary>Velocidade Básica (VB)</summary>

A [[VB]] mede os reflexos e a rapidez do personagem. Ela define a ordem de ação em combate (quem tem a maior age primeiro) e é a base do Deslocamento.

$$
\text{VB} = \frac{HT + DX}{4}
$$

> [!WARNING]
> Não arredonde: 5,75 é melhor do que 5,5.

> [!EXAMPLE]
>
> $$
> \text{VB} = \frac{11 + 12}{4} = 5{,}75
> $$

<details>
<summary>Ferido gravemente</summary>

Quando os PV atuais caem abaixo de **1/3** dos PV naturais (base + comprados), a VB cai pela metade, arredondada para baixo. O Deslocamento e a Esquiva caem junto, porque são calculados a partir dela.

No exemplo, com 32 PV naturais: abaixo de **10,67** PV a VB passa de 5,75 para **2**, o Deslocamento para **2** e a Esquiva para **6**.

</details>

</details>

<details>
<summary>Deslocamento</summary>

O [[Deslocamento]] é quantos metros por segundo o personagem percorre. É a VB somada ao modificador de [[Carga]], arredondada para baixo.

$$
\text{Deslocamento} = \left\lfloor \text{VB} + \text{modificador de carga} \right\rfloor
$$

Não pode ser comprado diretamente: aumente a VB ou reduza a carga. Veja os níveis em Carga e Movimento.

> [!EXAMPLE]
> Sem carga: $\lfloor 5{,}75 + 0 \rfloor = 5$ m/s. Com carga média (**-1**): $\lfloor 5{,}75 - 1 \rfloor = 4$ m/s.

</details>

<details>
<summary>Esquiva</summary>

A [[Esquiva]] é a defesa ativa para sair do caminho de um ataque. Para esquivar, role **3d6** e tire igual ou menos que o valor.

$$
\text{Esquiva} = \text{Deslocamento} + 4
$$

> [!HOUSE]
> No Archivum, a Esquiva parte do Deslocamento, então a carga também reduz a Esquiva.

A vantagem Reflexos em Combate soma **+1** à base da Esquiva.

> [!EXAMPLE]
> Sem carga: $5 + 4 = 9$. Com carga média: $4 + 4 = 8$.

</details>

<details>
<summary>Resistência a Dano (RD)</summary>

A [[RD]] do personagem começa em **0** e não pode ser comprada. Ela só muda por modificadores e encantamentos. A RD das armaduras é contada à parte, por peça e local do corpo.

</details>
