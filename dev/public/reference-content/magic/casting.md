A magia do Archivum é baseada em perícias, como no GURPS, mas tem grimório, custos e tiers próprios. Cada feitiço é uma perícia mental ligada à [[IQ]]: você compra um nível, rola **3d6** contra ele para conjurar e paga o custo em [[Mana]].

Os exemplos usam o mesmo personagem de Secundários: **IQ 12** natural e **35** de Mana.

### Feitiços na ficha

Cada feitiço do grimório pertence a uma **escola**: Psiquemancia, Hidromancia, Arcanomancia, Somatomancia, Kinetomancia, Restauromancia, Geomancia, Fitomancia, Melomancia, Piromancia, Umbromancia, Eidomancia e outras escolas menores. O filtro da ficha separa os feitiços por escola.

O **tipo** diz o que o feitiço faz: Manipulação, Invocação, Debilitação, Maldição, Mental, Controle, Restauração, Proteção, Detecção, Sensorial, Movimentação, Aprimoramento e tipos mais específicos, como Projétil, Jato ou Sopro.

A **dificuldade** usa as letras das perícias: **F** (Fácil), **M** (Média), **D** (Difícil) e **MD** (Muito Difícil). Ela só influencia o custo em pontos de personagem.

O **tier** não é escolhido: ele vem do nível final do feitiço. Cada feitiço tem uma versão por tier, e a ficha mostra os dados da versão que você alcançou. Subir de tier costuma aumentar alcance, área, dano ou duração, e baratear o escalonamento.

| Tier         | Nível final |
| ------------ | ----------- |
| Aprendiz     | até 12      |
| Experiente   | 13 a 15     |
| Veterano     | 16 e 17     |
| Especialista | 18 e 19     |
| Mestre       | 20+         |

<details>
<summary>Campos do card</summary>

- **Escola, Dificuldade e Tier:** veja acima.
- **Custo:** Mana gasta ao conjurar. Alguns feitiços têm custo **Variável**, explicado na descrição.
- **Base, Mod, Aptidão, Encantamento e NH Final:** as parcelas do nível do feitiço (veja Nível do feitiço).
- **Tipo:** a categoria do efeito.
- **Conjuração:** quanto tempo leva para lançar: **Instantâneo**, **1 a 5 Turnos**, **Ritual** ou **Variável**.
- **Alvo:** Alvo Único, Área, Self, Linha, Cone, Objeto, Toque ou Feitiço (afeta outra magia).
- **Alcance:** distância máxima até o alvo, em hexágonos, por Toque, em Self ou em múltiplos da IQ.
- **Área:** tamanho do efeito, como a área ocupada pelo alvo ou um raio em hexágonos.
- **Duração:** quanto o efeito dura: Instantâneo, turnos, minutos, horas, Permanente ou Variável.
- **Escalonamento:** quanta Mana extra se paga para aumentar alcance, área ou duração além do valor do card.
- **Descrição e Observação:** o efeito em si, pré-requisitos de uso, modificadores e, nos feitiços de ataque, dados como a Precisão.

</details>

### Nível do feitiço

O nível final é a soma de quatro parcelas:

$$
\text{NH Final} = \text{Base} + \text{Mod} + \text{Aptidão Mágica} + \text{Encantamento}
$$

- **Base:** o nível comprado com pontos de personagem.
- **Mod:** ajustes manuais do Mestre ou do jogador.
- **Aptidão Mágica:** **+1**, **+2** ou **+3** da vantagem; só vale o maior nível que você tiver.
- **Encantamento:** bônus ou redutor vindo de itens encantados.

O custo em pontos considera só **Base + Mod**, comparado à IQ natural (base comprada + raça). Aptidão Mágica, encantamentos e bônus temporários de IQ sobem o nível de graça. Um feitiço concedido por um item começa em **IQ + bônus do item** e não custa pontos.

O nível relativo é Base + Mod menos a IQ natural. Os custos ficam assim:

| Relativo | F   | M   |
| -------- | --- | --- |
| **-4**   | 0,5 | —   |
| **-3**   | 0,5 | 0,5 |
| **-2**   | 0,5 | 1   |
| **-1**   | 0,5 | 2   |
| **+0**   | 1   | 2   |
| **+1**   | 2   | 4   |
| **+2**   | 4   | 6   |

| Relativo | D   | MD  |
| -------- | --- | --- |
| **-2**   | 1   | 2   |
| **-1**   | 2   | 4   |
| **+0**   | 4   | 6   |
| **+1**   | 6   | 8   |
| **+2**   | 8   | 10  |

A partir daí, cada nível acima custa **+2** pontos, até o nível relativo **+10**.

<details>
<summary>Exemplo</summary>

Bola de Fogo é **F**. Com IQ 12, o mago compra Base **13** (relativo **+1**) e paga **2** pontos. Com Aptidão Mágica **+1**, o NH Final é **14**, então ele usa a versão Experiente do feitiço, sem pagar nada a mais.

Um feitiço **D** com Base **12** (relativo **+0**) custa **4** pontos. Um anel que dá **+2** nesse feitiço leva o NH Final a **14**, e o custo continua **4**.

</details>

### Conjurar

Para lançar um feitiço, role **3d6** contra o NH Final, com os modificadores da situação. Feitiços **Instantâneos** saem na hora; os demais exigem a manobra Concentrar durante todos os turnos do tempo de conjuração e fazem efeito ao final do último. Rituais e tempos variáveis seguem a descrição do feitiço.

Feitiços de ataque, como Projétil, Jato e Sopro, pedem também uma jogada de ataque depois de conjurados, conforme a descrição.

Enquanto se concentra, o mago pode se defender. Pela regra do GURPS 4e, se ele se defender, sofrer dano, for derrubado ou distraído de outra forma, precisa passar num teste de **[[Vontade]]-3** para não perder o feitiço. O redutor de choque do dano também se aplica ao teste de conjuração no turno seguinte.

**Acerto Crítico:** o feitiço funciona sem custo de Mana e com um resultado especialmente bom, a critério do Mestre.

**Falha Crítica:** o mago paga a Mana e o feitiço sai de forma desastrosa. Role na tabela de Tabelas › Críticos › Falhas Mágicas.

As faixas de crítico são as normais do [[NH]]: veja Combate › Regras › Acerto Crítico e Falha Crítica.

### Custo em Mana

Ao conjurar, pague a Mana listada no card, mais o que você escolher pelo escalonamento. Uma falha comum gasta **1** ponto de Mana; um sucesso ou uma Falha Crítica gasta o custo cheio.

> [!HOUSE]
> No Archivum, feitiços gastam [[Mana]], não pontos de Fadiga.

Quem domina bem o feitiço gasta menos:

| NH Final | Desconto |
| -------- | -------- |
| 15 a 19  | **-1**   |
| 20 a 24  | **-2**   |
| 25 a 29  | **-3**   |

E assim por diante: **-1** a mais a cada 5 níveis.

<details>
<summary>Exemplo</summary>

Um feitiço de custo **8** sai por **8** com NH 14, **7** com NH 16 e **6** com NH 20. Com 35 de Mana e NH 16, o mago consegue lançá-lo **5** vezes antes de ficar com Mana muito baixa.

</details>

Quando a Mana acaba, o personagem sofre os efeitos de Mana baixa e pode continuar gastando à custa de [[PV]] e de testes para não desmaiar. Veja Sistema › Fadiga e Cura.

### Áreas de mana

O nível de mana do lugar onde o feitiço é lançado muda o que pode dar errado. O Archivum divide as áreas em **Baixa**, **Média** e **Alta**, e alguns feitiços citam também **Mana Morta**, onde a magia praticamente não flui.

O Mestre define a área de cada lugar. Na Falha Crítica, ele pode rolar na tabela oficial ou na tabela da área de mana atual. Alguns feitiços mudam de efeito conforme a área, e isso aparece na descrição.
