Perigos do ambiente que ferem ou cansam sem precisar de um inimigo. O cansaço sai da [[Mana]] e os ferimentos, dos [[PV]].

> [!HOUSE]
> Onde a 4e fala em fadiga, o Archivum gasta **Mana**. Veja Sistema › Condições › Fadiga e Cura.

### Impactos

<details>
<summary>Queda | dano por altura</summary>

Uma queda causa dano por contusão que depende dos PV de quem cai e da velocidade no impacto.

$$
\text{velocidade} = \sqrt{21{,}4 \times \text{altura em metros}}
$$

$$
\text{dados de dano} = \frac{\text{PV} \times \text{velocidade}}{100}
$$

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

Queda de 10 m com 32 PV:

$$
\frac{32 \times 15}{100} = 4{,}8 \approx \textbf{5d}
$$

</details>

</details>

<details>
<summary>Colisões | PV × velocidade</summary>

Bater em algo, ou ser atingido por algo grande em movimento, causa dano por contusão com a mesma fórmula da queda. Use a velocidade relativa entre os dois.

$$
\text{dados de dano} = \frac{\text{PV} \times \text{velocidade}}{100}
$$

- **Objeto imóvel:** um muro ou rocha usa os PV de quem colide; quem bate sofre todo o dano.
- **Dois corpos em movimento:** cada um causa ao outro o dano calculado com os próprios PV.
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
- **Falha:** perde **1** de Mana. Esforço, armadura e roupas pesadas dão redutores; aclimatação e água à vontade dão bônus.

</details>

<details>
<summary>Frio</summary>

- **Teste:** em frio abaixo do confortável, teste de **[[HT]]** a cada 30 minutos.
- **Falha:** perde **1** de Mana. Quando a Mana chega a 0, a perda passa a sair dos PV, como em qualquer fadiga.
- **Roupas:** roupas de inverno dão bônus grandes; roupas comuns ou molhadas dão redutores.
- **Vento e água:** vento forte agrava o frio; cair em água gelada exige testes muito mais frequentes.

</details>

### Respiração

<details>
<summary>Afogamento e Sufocamento</summary>

- **Prender a respiração:** em repouso, cerca de **[[HT]] × 10** segundos; menos em esforço ou combate.
- **Sem ar:** perde **1** de Mana por segundo.
- **Mana 0 ou menos:** teste de **[[Vontade]]** a cada segundo para continuar consciente, e cada segundo sem ar também tira PV.
- **Inconsciente:** sem ar, morre em poucos minutos se não for reanimado.
- **Nadando:** teste de Natação ao entrar na água e periodicamente depois. Cada falha faz engolir água e perder **1** de Mana.

Para reanimar, veja Sistema › Condições › Aflições e Condições › Ressuscitação.

</details>

### Necessidades

<details>
<summary>Fome e Sede | gastam Mana</summary>

> [!HOUSE]
> Fome e sede gastam **Mana**, não fadiga.

**Fome**

- **Refeição perdida:** cada uma das três refeições diárias que faltar custa **1** de Mana.
- **Recuperação:** essa Mana só volta com comida e descanso; descanso sozinho não basta.

**Sede**

- **Necessidade:** cerca de **2 litros** de água por dia; mais em calor ou esforço.
- **Falta de água:** cada período sem água suficiente custa Mana, e a desidratação piora mais rápido que a fome.
- **Recuperação:** essa Mana só volta bebendo.

Com Mana em 0 ou menos, a perda continua saindo dos PV.

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
