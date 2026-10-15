Todo ataque tem um tipo de dano. O tipo define quanto do dano que passa pela [[RD]] vira lesão de fato, e como cada local do corpo reage ao golpe.

### Tipos e multiplicadores no tronco

O multiplicador de lesão vale para um acerto no tronco. Os outros locais alteram esse valor (veja Por local de acerto).

| Tipo               | Sigla  | Tronco   |
| ------------------ | ------ | -------- |
| Contusão           | cont   | **×1**   |
| Corte              | cort   | **×1,5** |
| Perfuração pequena | perf-  | **×0,5** |
| Perfuração         | perf   | **×1**   |
| Perfuração grande  | perf+  | **×1,5** |
| Perfuração enorme  | perf++ | **×2**   |
| Empalamento        | emp    | **×2**   |
| Queimadura         | qmd    | **×1**   |
| Corrosão           | cor    | **×1**   |
| Toxina             | tox    | **×1**   |
| Fadiga             | fad    | **×1**   |

- **Contusão:** porretes, socos, quedas. Pode projetar o alvo para trás.
- **Corte:** lâminas usadas em golpes de balanço, como espadas e machados.
- **Perfuração:** projéteis sem ponta afiada ou de tamanhos variados, como balas e pedras de funda. O tamanho do projétil define a variante.
- **Empalamento:** pontas que penetram fundo: lanças, flechas, floretes.
- **Queimadura:** fogo, calor e eletricidade.
- **Corrosão:** ácidos e efeitos que dissolvem a carne e a armadura.
- **Toxina:** venenos, doenças e efeitos que atacam o organismo por dentro.

> [!NOTE]
> **Dano de fadiga** reduz os [[PF]], não os [[PV]]. O dano de fadiga ignora o local de acerto.

### Por local de acerto

Os redutores para acertar e os efeitos especiais de cada local estão em Combate › Regras › Locais de Acerto. Aqui ficam só as mudanças no multiplicador.

<details>
<summary>Cérebro | ×4</summary>

- **Todos os tipos:** **×4**, exceto toxina, que mantém o multiplicador do tronco.
- **Crânio:** soma **+2** à [[RD]], exceto contra toxina.

</details>

<details>
<summary>Olho | ×4</summary>

- **Todos os tipos elegíveis:** **×4**, exceto toxina.
- **Elegíveis:** apenas empalamento, perfuração e queimaduras de feixe estreito alcançam o olho.
- O crânio não protege o olho.

</details>

<details>
<summary>Face | cor ×1,5</summary>

- **Corrosão:** **×1,5**.
- **Demais tipos:** como no tronco.

</details>

<details>
<summary>Pescoço | cort ×2</summary>

- **Corte:** **×2**.
- **Contusão e corrosão:** **×1,5**.
- **Demais tipos:** como no tronco.

</details>

<details>
<summary>Órgãos vitais | perf e emp ×3</summary>

- **Perfuração (todas as variantes) e empalamento:** **×3**.
- **Queimadura de feixe estreito:** **×2**.
- **Demais tipos:** acertam o tronco, com o multiplicador normal.

</details>

<details>
<summary>Braço, perna, mão e pé | máx. ×1</summary>

- **Perfuração grande, perfuração enorme e empalamento:** caem para **×1**.
- **Demais tipos:** como no tronco.
- **Limite:** a lesão acima do limiar de incapacitação do membro se perde. Veja Lesões Incapacitantes em Combate › Regras.

</details>

<details>
<summary>Virilha | como o tronco</summary>

- **Todos os tipos:** multiplicador do tronco.
- Contusão em alvos masculinos tem efeitos extras, descritos em Locais de Acerto.

</details>

### Ordem de resolução

1. **Dano básico:** role o dano da arma ou do ataque.
2. **[[RD]]:** subtraia a RD do local atingido. Um divisor de armadura divide a RD antes da subtração: **(2)** usa metade da RD, **(0,5)** usa o dobro.
3. **Multiplicador de lesão:** multiplique o que passou pelo multiplicador do tipo, já ajustado pelo local.
4. **Resistência elemental:** se o ataque tiver elemento, multiplique pela porcentagem do alvo para aquele elemento (veja Personagem › Resistências).
5. **Lesão:** arredonde para baixo e subtraia dos [[PV]].

> [!HOUSE]
> A resistência elemental é uma regra do Archivum. Ela entra sempre **depois** da RD, como um multiplicador a mais.

<details>
<summary>Exemplo</summary>

Uma flecha flamejante (**empalamento**, elemento Fogo) causa **10** de dano básico no tronco de um alvo com **RD 3** e Fogo **50%**.

$$
(10 - 3) \times 2 \times 0{,}5 = 7
$$

O alvo perde **7** [[PV]]. Se a mesma flecha acertasse os órgãos vitais, seria $7 \times 3 \times 0{,}5 = 10{,}5$, ou seja, **10** de lesão.

</details>

### Notas

- **Lesão mínima:** se qualquer dano passar pela [[RD]], o alvo sofre pelo menos **1** de lesão, mesmo que os multiplicadores reduzam o valor a menos que isso. A exceção é a imunidade elemental (**0%**).
- **Projeção:** contusão, e corte que não passou da RD, podem empurrar o alvo para trás. Veja Projeção em Combate › Regras.
- **Dano em larga escala:** explosões, cones e efeitos de área ignoram o local de acerto e usam uma RD média. Veja Dano em Larga Escala em Combate › Regras.
