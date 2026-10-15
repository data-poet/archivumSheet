A magia do Archivum é baseada em perícias, como no GURPS, mas tem grimório, custos e tiers próprios. Cada feitiço é uma perícia mental ligada à [[IQ]]: você compra um nível, rola **3d6** contra ele para conjurar e paga o custo em [[Mana]].

Os exemplos usam o mesmo personagem de Secundários: **IQ 12** natural e **35** de Mana.

### Feitiços na ficha

Cada feitiço do grimório pertence a uma **escola**: Psiquemancia, Hidromancia, Arcanomancia, Somatomancia, Kinetomancia, Restauromancia, Geomancia, Fitomancia, Melomancia, Piromancia, Umbromancia, Eidomancia e outras escolas menores. O filtro da ficha separa os feitiços por escola.

O **tipo** diz o que o feitiço faz: Manipulação, Invocação, Debilitação, Maldição, Mental, Controle, Restauração, Proteção, Detecção, Sensorial, Movimentação, Aprimoramento e tipos mais específicos, como Projétil, Jato ou Sopro.

A **dificuldade** usa as letras das perícias: **F** (Fácil), **M** (Média), **D** (Difícil) e **MD** (Muito Difícil). Ela só influencia o custo em pontos de personagem.

O **tier** não é escolhido: ele vem do nível final do feitiço. Cada feitiço tem uma versão por tier, e a ficha mostra os dados da versão que você alcançou. Subir de tier costuma aumentar alcance, área, dano ou duração, e baratear o escalonamento. O tier também define o ritual necessário para conjurar.

| Tier         | Nível final | Forma de conjuração                                                                                                             |
| ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Aprendiz     | até 12      | Pronunciar algumas palavras em voz baixa e fazer um gesto.                                                                      |
| Experiente   | 13 a 15     | Dizer uma ou duas palavras e gesticular; alguns dedos bastam.                                                                   |
| Veterano     | 16 e 17     | Dizer uma ou duas palavras **ou** fazer um pequeno gesto, não necessariamente ambos.                                            |
| Especialista | 18 e 19     | Nenhum ritual: o mago parece apenas contemplar o espaço. Pode se concentrar enquanto faz outra manobra (lutar, conversar etc.). |
| Mestre       | 20+         | Como Especialista, e pode conjurar **dois feitiços no mesmo turno**.                                                            |

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

Enquanto se concentra, o mago pode se defender. Se ele se defender, sofrer dano, for derrubado ou distraído de outra forma, precisa passar num teste de **[[Vontade]]-3** para não perder o feitiço. O redutor de choque do dano também se aplica ao teste de conjuração no turno seguinte. A partir do tier Especialista, ele pode se concentrar enquanto realiza outra manobra.

**Acerto Crítico:** o feitiço funciona sem custo de Mana e com um resultado especialmente bom, a critério do Mestre.

**Falha Crítica:** o mago paga a Mana e o feitiço sai de forma desastrosa. Role na tabela de Tabelas › Críticos › Falhas Mágicas.

As faixas de crítico são as normais do [[NH]]: veja Combate › Regras › Acerto Crítico e Falha Crítica.

### Custo em Mana

Ao conjurar, pague a Mana listada no card, mais o que você escolher pelo escalonamento. O custo não diminui com o NH.

- **Sucesso:** gasta o custo cheio.
- **Falha comum:** gasta **1** de Mana.
- **Acerto Crítico:** não gasta Mana.
- **Falha Crítica:** gasta o custo cheio.

> [!HOUSE]
> No Archivum, feitiços gastam [[Mana]], não pontos de Fadiga.

<details>
<summary>Exemplo</summary>

Um feitiço de custo **8** custa **8** em qualquer NH. Com 35 de Mana, o mago consegue lançá-lo **4** vezes (32 de Mana) antes de precisar descansar.

</details>

Quando a Mana acaba, o personagem sofre os efeitos de Mana baixa e pode continuar gastando à custa de [[PV]] e de testes para não desmaiar. Veja Sistema › Fadiga e Cura.

### Áreas de mana

Cada lugar tem uma área de mana, definida pelo Mestre. Ela segue os níveis de mana do GURPS 4e e muda o que a magia consegue fazer e quanto de Mana se recupera ao descansar. Alguns feitiços também mudam de efeito conforme a área, e isso aparece na descrição.

<details>
<summary>Morta | sem mana</summary>

- **Conjuração:** nenhum feitiço funciona, e itens mágicos ficam inertes.
- **Descanso:** uma boa noite de descanso não recupera Mana.

</details>

<details>
<summary>Baixa | -5</summary>

- **Conjuração:** todos os feitiços sofrem **-5** em todos os testes, e itens mágicos sofrem o mesmo redutor.
- **Falha Crítica:** os efeitos costumam ser brandos. Use a tabela de Área de Mana Baixa.
- **Descanso:** uma boa noite de descanso recupera **10%** da Mana máxima, arredondado para baixo.

</details>

<details>
<summary>Média | normal</summary>

- **Conjuração:** os feitiços funcionam normalmente.
- **Falha Crítica:** use a tabela oficial ou a de Área de Mana Média.
- **Descanso:** uma boa noite de descanso recupera **30%** da Mana máxima, arredondado para baixo.

</details>

<details>
<summary>Alta | sem redutor</summary>

- **Conjuração:** os feitiços funcionam normalmente, e qualquer um que conheça o feitiço pode conjurá-lo.
- **Falha Crítica:** use a tabela de Área de Mana Alta.
- **Descanso:** uma boa noite de descanso recupera **50%** da Mana máxima, arredondado para baixo.

</details>

> [!NOTE]
> Quando o mago e o alvo estão em áreas diferentes, vale a área mais fraca das duas. Um projétil mágico atravessa para uma área Morta, mas nenhum outro efeito entra nela.

<details>
<summary>Exemplo</summary>

Um mago com **35** de Mana máxima descansa uma noite numa área Baixa: recupera $\lfloor 35 \times 0{,}1 \rfloor = 3$. Numa área Alta, recuperaria $\lfloor 35 \times 0{,}5 \rfloor = 17$.

</details>
