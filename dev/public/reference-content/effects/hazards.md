Perigos do ambiente que ferem ou cansam sem precisar de um inimigo. O cansaço sai dos [[PF]] e os ferimentos, dos [[PV]]. Veja Sistema › Condições › Fadiga e Cura.

### Impactos

<details>
<summary>Queda | dano por altura</summary>

Uma queda causa dano por contusão que depende da [[ST]] de quem cai e da velocidade no impacto.

$$
\text{velocidade} = \sqrt{21{,}4 \times \text{altura em metros}}
$$

$$
\text{dados de dano} = \frac{\text{ST} \times \text{velocidade}}{100}
$$

> [!HOUSE]
> No 4e a fórmula usa os PV, que lá valem a ST. No Archivum os PV são cerca de 3× maiores, então use a ST.

Arredonde para o dado mais próximo. Abaixo de meio dado, o dano é **1d-3**; de meio dado até 1 dado, **1d-2**.

| Altura | Velocidade |
| ------ | ---------- |
| 1 m    | 5 m/s      |
| 3 m    | 8 m/s      |
| 5 m    | 10 m/s     |
| 10 m   | 15 m/s     |
| 20 m   | 21 m/s     |
| 30 m   | 25 m/s     |
| 50 m   | 33 m/s     |
| 100 m  | 46 m/s     |

- **Velocidade terminal:** por volta de **55 m/s** para um humanoide; quedas mais longas não aceleram mais.
- **Acrobacia:** um sucesso reduz a altura efetiva em **5 m**.
- **Superfície macia:** terra fofa, neve funda ou feno reduzem o dano por dado; água rasa não ajuda.
- **Local atingido:** sem outra indicação, o dano vai para o tronco.

<details>
<summary>Exemplo</summary>

Queda de 10 m com ST 12:

$$
\frac{12 \times 15}{100} = 1{,}8 \approx \textbf{2d}
$$

</details>

</details>

<details>
<summary>Colisões | ST × velocidade</summary>

Bater em algo, ou ser atingido por algo grande em movimento, causa dano por contusão com a mesma fórmula da queda. Use a velocidade relativa entre os dois.

$$
\text{dados de dano} = \frac{\text{ST} \times \text{velocidade}}{100}
$$

- **Objeto imóvel:** um muro ou rocha usa a ST de quem colide; quem bate sofre todo o dano.
- **Dois corpos em movimento:** cada um causa ao outro o dano calculado com a própria ST.
- **Projeção:** quem é projetado contra uma parede sofre o dano como se tivesse sido arremessado. Veja Combate › Regras › Projeção.

</details>

### Temperatura

<details>
<summary>Fogo e Calor</summary>

**Fogo**

- **Chamas:** tocar ou atravessar fogo causa dano de queimadura por segundo, de **1d-3** numa tocha até **1d** ou mais num incêndio.
- **Em chamas:** roupas pegando fogo causam **1d-4** por segundo se parcial, **1d-1** se o corpo todo. Apagar exige rolar no chão ou abafar.
- **Ignição:** um golpe de queimadura forte o bastante incendeia roupas e materiais inflamáveis.

> [!HOUSE]
> O dano de fogo passa pela [[RD]] e depois pela resistência elemental a **Fogo**, que multiplica o que sobrou.

**Calor**

- **Teste:** em calor acima do confortável, teste de **[[HT]]** a cada 30 minutos.
- **Falha:** perde **1 PF**. Esforço, armadura e roupas pesadas dão redutores; aclimatação e água à vontade dão bônus.

</details>

<details>
<summary>Frio</summary>

- **Teste:** em frio abaixo do confortável, teste de **[[HT]]** a cada 30 minutos.
- **Falha:** perde **1 PF**. Com PF em 0 ou menos, cada PF perdido também tira **1 PV**, como em qualquer fadiga.
- **Roupas:** roupas de inverno dão bônus grandes; roupas comuns ou molhadas dão redutores.
- **Vento e água:** vento forte agrava o frio; cair em água gelada exige testes muito mais frequentes.
- **Dano por frio:** frio que causa dano direto (gelo mágico, sopro gélido) conta como elemento **Água**: aplique a resistência a Água depois da [[RD]].

</details>

### Respiração

<details>
<summary>Afogamento e Sufocamento</summary>

- **Prender a respiração:** em repouso, cerca de **[[HT]] × 10** segundos; menos em esforço ou combate.
- **Sem ar:** perde **1 PF** por segundo.
- **PF 0 ou menos:** teste de **[[Vontade]]** a cada segundo para continuar consciente, e cada segundo sem ar também tira PV.
- **Inconsciente:** sem ar, morre em poucos minutos se não for reanimado.
- **Nadando:** teste de Natação ao entrar na água e periodicamente depois. Cada falha faz engolir água e perder **1 PF**.

Para reanimar, veja Sistema › Condições › Aflições e Condições › Ressuscitação.

</details>

### Necessidades

<details>
<summary>Fome, Sede e Sono | gastam PF</summary>

**Fome**

- **Refeição perdida:** cada uma das três refeições diárias que faltar custa **1 PF**.
- **Recuperação:** esses PF só voltam comendo; descanso sozinho não basta.

**Sede**

- **Necessidade:** cerca de **2 litros** de água por dia; mais em calor ou esforço.
- **Falta de água:** sem água suficiente, perde **1 PF** a cada 8 horas, e a desidratação piora mais rápido que a fome.
- **Recuperação:** esses PF só voltam bebendo.

**Sono**

- **Noite sem dormir:** custa **5 PF**, que só voltam dormindo.

Com PF em 0 ou menos, cada PF perdido também tira **1 PV**.

</details>

### Visão

<details>
<summary>Escuridão e Visão | -1 a -10</summary>

A pouca luz dá redutores nos testes de Visão e em todo teste que depende de enxergar, inclusive ataques e defesas.

| Iluminação       | Redutor |
| ---------------- | ------- |
| Tocha ou lampião | **-2**  |
| Lua cheia        | **-3**  |
| Luz das estrelas | **-5**  |
| Noite nublada    | **-7**  |
| Escuridão total  | **-10** |

- **Atacar sem ver:** o redutor de escuridão vale para o ataque; se o alvo não for visto nem ouvido, o Mestre decide se o ataque é possível.
- **Defender sem ver:** sem ver o atacante, a defesa sofre **-4**, e só é possível se o personagem souber de onde vem o golpe.
- **Visão Noturna:** reduz o redutor de escuridão, mas não ajuda na escuridão total.

</details>

### Venenos

<details>
<summary>Venenos | teste de HT</summary>

- **Resistência:** a vítima testa **[[HT]]**, com o modificador do veneno. Sucesso evita ou reduz o efeito.
- **Efeito:** dano tóxico, uma aflição (náusea, sonolência, paralisia) ou ambos. Veja Sistema › Condições › Aflições e Condições.
- **Início:** muitos venenos demoram segundos, minutos ou horas para agir.
- **Ciclos:** alguns repetem o teste e o efeito em intervalos até a vítima passar ou o veneno acabar.
- **Via:** venenos ingeridos, inalados ou injetados ignoram a [[RD]]; os de contato só agem na pele exposta.
- **Resistências:** a vantagem Resistência a Venenos dá bônus no teste.

</details>
