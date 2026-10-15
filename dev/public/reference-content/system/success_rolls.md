Quase tudo que um personagem faz com risco de dar errado vira um teste: role **3d6** e compare com o número de que você precisa.

### Testes de Sucesso

Role **3d6**. Se o resultado for **igual ou menor** que o [[NH]] efetivo, o teste foi bem-sucedido. Se for maior, falhou.

A diferença entre o NH efetivo e o resultado é a **margem**. Ela mostra o quão bem ou mal foi o teste e decide disputas, efeitos de magias e vários outros detalhes.

$$
\text{margem} = \text{NH efetivo} - \text{resultado}
$$

Margem **0 ou mais** é sucesso; margem negativa é falha.

<details>
<summary>Exemplo</summary>

Com NH efetivo 12, um resultado **9** é sucesso por margem **3**. Um resultado **14** é falha por margem **2**.

</details>

### NH Efetivo

O NH efetivo é o valor usado de fato no teste: o NH básico mais todos os modificadores da situação (dificuldade, equipamento, ferimentos, iluminação, pressa etc.).

$$
\text{NH efetivo} = \text{NH básico} + \text{modificadores}
$$

**Valor predefinido:** quem não estudou uma perícia ainda pode tentar usá-la a partir de um atributo ou de outra perícia, com um redutor. Cada perícia lista seus próprios valores predefinidos; o mais comum é:

| Dificuldade da perícia | Valor predefinido |
| ---------------------- | ----------------- |
| Fácil                  | atributo **-4**   |
| Média                  | atributo **-5**   |
| Difícil                | atributo **-6**   |
| Muito Difícil          | em geral, não tem |

Se houver mais de um valor predefinido, use o melhor.

> [!WARNING]
> Com NH efetivo **abaixo de 3**, não é possível tentar o teste. A única exceção são os testes de defesa.

### Modificadores de Dificuldade

O Mestre ajusta o teste conforme a tarefa é mais simples ou mais difícil do que o normal para aquela perícia.

| Tarefa             | Modificador |
| ------------------ | ----------- |
| Automática         | sem teste   |
| Trivial            | **+10**     |
| Muito fácil        | **+8**      |
| Fácil              | **+6**      |
| Muito favorável    | **+4**      |
| Favorável          | **+2**      |
| Normal             | **0**       |
| Desfavorável       | **-2**      |
| Muito desfavorável | **-4**      |
| Difícil            | **-6**      |
| Muito difícil      | **-8**      |
| Perigosa           | **-10**     |
| Impossível         | sem teste   |

> [!TIP]
> Na dúvida, não role: se a tarefa é rotineira e não há pressão, o sucesso é automático.

### Acerto Crítico e Falha Crítica

Alguns resultados são sempre sucesso ou sempre falha, não importa o NH, e trazem consequências extras. Veja a tabela em Combate › Regras › Acerto Crítico e Falha Crítica.

### Testes Repetidos

Nem todo teste pode ser refeito. O Mestre decide caso a caso:

- **Uma chance só:** se a falha tem consequência imediata (cair do muro, quebrar a fechadura, ofender o rei), não há segunda tentativa nas mesmas condições.
- **Pode tentar de novo:** se falhar só custa tempo (abrir uma fechadura, procurar uma pista), o personagem pode insistir. Cada nova tentativa leva o tempo da tarefa de novo, e o Mestre pode aplicar **-1** cumulativo por repetição.
- **Testes de sentidos e de conhecimento:** repetir não ajuda. O personagem só tenta outra vez se algo mudar, como uma nova informação ou um ângulo melhor.

### Tempo e Tarefas Longas

Toda tarefa que não é instantânea tem um tempo normal. Gastar mais tempo dá bônus; apressar dá redutor. Nada disso vale em combate, onde cada ação já tem seu tempo fixo.

**Mais tempo**

| Tempo gasto  | Modificador |
| ------------ | ----------- |
| 2× o normal  | **+1**      |
| 4× o normal  | **+2**      |
| 8× o normal  | **+3**      |
| 15× o normal | **+4**      |
| 30× o normal | **+5**      |

O bônus máximo é **+5**.

**Pressa:** cada **10%** a menos do tempo normal dá **-1**, até no máximo metade do tempo, por **-5**.

Em tarefas muito longas, o Mestre pode dividir o trabalho em etapas, com um teste por etapa, ou pedir um único teste no fim.

<details>
<summary>Exemplo</summary>

Consertar uma armadura leva 4 horas. O ferreiro tem NH 11.

- Com calma, gastando **8 horas** (2×), testa contra **12**.
- Com muita calma, gastando **16 horas** (4×), testa contra **13**.
- Com pressa, terminando em **3 horas** (25% a menos), testa contra **9**.

</details>

### Disputas

Quando dois personagens agem um contra o outro, eles fazem uma disputa: cada um testa sua própria perícia ou atributo, e os resultados são comparados.

**Disputa Rápida:** cada lado faz um teste uma vez só. Vence quem tiver a melhor margem: o maior sucesso, ou, se os dois falharem, a menor falha.

- **Empate:** ninguém vence. Se um lado tenta mudar a situação e o outro só resiste, a situação continua como estava.
- **Repetição:** em geral, o perdedor só tenta de novo se a situação mudar ou depois de um tempo, a critério do Mestre.

<details>
<summary>Exemplo</summary>

Dois guerreiros disputam quem pega primeiro uma espada caída, com [[DX]] 12 contra DX 11.

- O primeiro rola **10**: sucesso por margem **2**.
- O segundo rola **8**: sucesso por margem **3**.

O segundo vence, apesar da DX menor, porque teve a margem maior.

</details>

**Disputa Normal:** usada em esforços longos, como uma queda de braço. Os dois testam a cada rodada (ou outro intervalo definido pelo Mestre):

- Se um tiver sucesso e o outro falhar, quem teve sucesso vence.
- Se os dois tiverem sucesso, ou os dois falharem, ninguém vence e eles testam de novo no próximo intervalo.

> [!TIP]
> Se os dois NH forem maiores que **14**, reduza o maior para 14 e o menor no mesmo valor. A chance relativa não muda e a disputa termina mais rápido.

<details>
<summary>Exemplo</summary>

Queda de braço com [[ST]] 16 contra ST 13. Reduzindo para agilizar: **14** contra **11**.

- **Rodada 1:** 9 e 10, os dois têm sucesso. Continua.
- **Rodada 2:** 12 e 13, o primeiro tem sucesso e o segundo falha.

O primeiro vence na segunda rodada.

</details>

### Testes de Resistência

Quando algo tenta afetar o personagem contra a vontade dele, como um veneno, uma doença, uma magia ou uma intimidação, ele faz um teste de resistência, normalmente de [[HT]] (efeitos sobre o corpo) ou de [[Vontade]] (efeitos sobre a mente).

- **Contra um efeito fixo:** um teste simples, com o modificador do efeito. Um veneno forte pode impor **-4** ao teste de HT, por exemplo.
- **Contra alguém:** uma Disputa Rápida entre a perícia de quem ataca e a HT ou Vontade de quem resiste. Quem ataca precisa ter sucesso no próprio teste; se ele falhar, o efeito falha. Em caso de empate, quem resiste vence.

<details>
<summary>Exemplo</summary>

Um mago com NH 16 em uma magia de sono a lança em um guarda com Vontade 11.

- O mago rola **12**: sucesso por margem **4**.
- O guarda rola **9**: sucesso por margem **2**.

O mago vence e o guarda adormece.

</details>

### Testes de Atributo e de Perícia

**Teste de perícia:** usado quando a ação depende de treino (lutar, cavalgar, lançar magias, abrir fechaduras). Role contra o NH da perícia, ou contra o valor predefinido se o personagem não a tiver.

**Teste de atributo:** usado quando nenhuma perícia se aplica e a ação depende só da capacidade bruta:

- **[[ST]]:** força bruta, como erguer um portão ou arrombar uma porta.
- **[[DX]]:** equilíbrio e coordenação, como não cair num piso escorregadio.
- **[[IQ]]:** memória, raciocínio e conhecimento geral.
- **[[HT]]:** resistir a doenças, venenos, choque e exaustão.
- **[[Vontade]]:** resistir a medo, tentação e influência mental.

**Testes de sentidos:** a [[Per]] se divide em três valores separados na ficha, cada um começando igual a IQ. Use o sentido que a situação pede:

| Sentido | Quando usar                               |
| ------- | ----------------------------------------- |
| Visão   | Notar algo à vista, achar algo escondido  |
| Audição | Ouvir passos, vozes, um alarme distante   |
| Olfato  | Sentir cheiros e sabores, notar um veneno |

Escuridão, distância, barulho e distração impõem redutores. Se o personagem estiver procurando ativamente, o Mestre pode dar bônus ou deixar usar uma perícia de busca no lugar.

> [!NOTE]
> Cada sentido é comprado separadamente. Visão Aguçada, Ouvido Aguçado e Paladar/Olfato Apurados somam ao sentido correspondente, e Prontidão soma aos três.
