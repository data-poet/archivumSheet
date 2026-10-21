Os atributos secundários são calculados a partir dos valores **finais** dos atributos primários. Depois do cálculo, a maioria ainda pode ser comprada com pontos (veja Custo e Compra) e receber modificadores e encantamentos.

Os exemplos abaixo usam o mesmo personagem: **ST 10, DX 12, IQ 12, HT 11**.

> [!TIP]
> No resumo, cada barra de PV, PF, Mana e Toxicidade tem dois campos: **Atual** (pontos perdidos ou gastos) e **Máx.** (redução do máximo, por exemplo quando a fome limita os PF).

<details>
<summary>Pontos de Vida (PV)</summary>

Os [[PV]] representam quanto dano o personagem aguenta.

$$
\text{PV} = \left\lfloor \frac{HT \times 4 + ST \times 2}{2} \right\rfloor
$$

<details>
<summary>Exemplo</summary>

$$
\text{PV} = \left\lfloor \frac{11 \times 4 + 10 \times 2}{2} \right\rfloor = \left\lfloor \frac{64}{2} \right\rfloor = 32
$$

</details>

**Limiares de morte**

Os testes para não morrer usam a [[HT]], não os PV. Assim, personagens com muitos PV não ganham uma margem enorme antes da morte.

> [!HOUSE]
> A HT usada aqui é a **base + raça + meta-raça**. Equipamentos, encantamentos e efeitos temporários não contam.

- **PV ≤ 0:** teste de HT a cada rodada para não desmaiar, com **-1** para cada múltiplo de -HT alcançado.
- **PV = -1 × HT:** teste de HT para não morrer, repetido a cada novo múltiplo negativo de HT.
- **PV = -5 × HT:** morte automática.
- **PV = -10 × HT:** o corpo é destruído, se a fonte do dano for capaz disso.

Com HT 11 e 32 PV: testes de morte em **-11, -22, -33 e -44**, morte automática em **-55** e corpo destruído em **-110**. Na regra padrão (×PV), seriam -32 e -160.

</details>

<details>
<summary>Pontos de Fadiga (PF)</summary>

Os [[PF]] são a reserva de energia física do personagem: esforço, corrida, fome, sede, calor e sono perdido gastam PF. Feitiços não: eles gastam Mana.

$$
\text{PF} = HT
$$

Abaixo de **1/3** dos PF, o personagem está exausto: o Deslocamento e a Esquiva caem pela metade, arredondando para cima, e a [[ST]] cai pela metade para erguer e carregar. A ficha aplica tudo sozinha: a metade do Deslocamento e da Esquiva, que se soma à de PV baixos, e a ST pela metade nos limites de carga. Veja Sistema › Condições › Fadiga e Cura.

<details>
<summary>Exemplo</summary>

Com **HT 11**, o personagem tem **11** PF. Com **3** PF ou menos, o Deslocamento passa de 5 para **3** e a Esquiva de 9 para **5**.

</details>

</details>

<details>
<summary>Mana</summary>

A [[Mana]] é a energia mágica disponível para conjurar magias e sustentar efeitos mágicos.

$$
\text{Mana} = \left\lfloor \frac{IQ \times 4 + HT \times 2}{2} \right\rfloor
$$

A Mana nunca fica negativa. Ao chegar a **0**, conjurar magias passa a custar [[PV]] em vez de Mana, e o personagem fica com a condição Esgotamento Arcano até a Mana voltar a ficar positiva. A ficha aplica isso sozinha. Veja Sistema › Condições › Aflições e Condições.

<details>
<summary>Exemplo</summary>

$$
\text{Mana} = \left\lfloor \frac{12 \times 4 + 11 \times 2}{2} \right\rfloor = \left\lfloor \frac{70}{2} \right\rfloor = 35
$$

</details>

</details>

<details>
<summary>Toxicidade</summary>

A [[Toxicidade]] é o limite do corpo para consumir substâncias alquímicas (poções, elixires) sem sofrer efeitos adversos; cada consumível gasto reduz a Toxicidade pelo seu custo (veja a coluna de toxicidade dos consumíveis alquímicos).

$$
\text{Toxicidade} = HT
$$

Abaixo de **1/3** do máximo, o personagem fica Saturado; ao chegar a **0**, Intoxicado. Negativa, a Toxicidade escala em três estágios de Envenenamento (Leve, Grave e Crítico — este último incapacita), cada terço do máximo abaixo de zero piorando um estágio, até **-Toxicidade** (natural). A ficha aplica e remove essas condições sozinha, conforme o valor muda. Veja Sistema › Condições › Aflições e Condições.

<details>
<summary>Exemplo</summary>

Com **HT 11**, o personagem tem **11** de Toxicidade.

</details>

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

<details>
<summary>Exemplo</summary>

$$
\text{VB} = \frac{11 + 12}{4} = 5{,}75
$$

</details>

</details>

<details>
<summary>Deslocamento</summary>

O [[Deslocamento]] é quantos metros por segundo o personagem percorre. Sem carga, é a VB arredondada para baixo; a [[Carga]] multiplica esse valor.

$$
\text{Deslocamento} = \left\lfloor \lfloor \text{VB} \rfloor \times \text{fator de carga} \right\rfloor
$$

Não pode ser comprado diretamente: aumente a VB ou reduza a carga. Veja os níveis em Carga e Movimento.

<details>
<summary>Exemplo</summary>

Sem carga: $\lfloor 5{,}75 \rfloor = 5$ m/s. Com carga média (**×0,6**): $\lfloor 5 \times 0{,}6 \rfloor = 3$ m/s.

</details>

> [!WARNING]
> **Ferido gravemente:** quando os PV atuais caem abaixo de **1/3** dos PV naturais (base + comprados), o Deslocamento e a Esquiva atuais caem pela metade, arredondando para cima. A VB não muda.
>
> No exemplo, com 32 PV naturais: abaixo de **10,67** PV o Deslocamento passa de 5 para **3** e a Esquiva de 9 para **5**.

</details>

<details>
<summary>Esquiva</summary>

A [[Esquiva]] é a defesa ativa para sair do caminho de um ataque. Para esquivar, role **3d6** e tire igual ou menos que o valor.

$$
\text{Esquiva} = \text{Deslocamento sem carga} + 4 - \text{nível de carga}
$$

> [!HOUSE]
> No Archivum, a Esquiva parte do Deslocamento sem carga (+4), em vez da VB + 3 do 4e. A carga tira de **0** a **4** pontos, como no 4e.

A vantagem Reflexos em Combate soma **+1** à base da Esquiva. A Esquiva não pode ser comprada: aumente a VB ou reduza a carga. Ferido gravemente, ela cai pela metade (veja Deslocamento).

<details>
<summary>Exemplo</summary>

Sem carga: $5 + 4 = 9$. Com carga média (**-2**): $5 + 4 - 2 = 7$.

</details>

</details>

<details>
<summary>Resistência a Dano (RD)</summary>

A [[RD]] do personagem começa em **0** por padrão. Você pode definir o valor inicial na tabela de atributos (nunca negativo), sem custo em pontos. Ela não pode ser comprada e, além do valor inicial, só muda por modificadores e encantamentos. A RD das armaduras é contada à parte, por peça e local do corpo.

</details>
