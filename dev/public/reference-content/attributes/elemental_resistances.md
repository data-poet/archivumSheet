Cada personagem tem um multiplicador de dano para cada um dos dez elementos. Ele aparece na ficha como a porcentagem do dano daquele elemento que o personagem realmente recebe.

|  Valor   | Significado                 |
| :------: | :-------------------------- |
| **100%** | Dano normal                 |
| **200%** | Fraqueza: dano em dobro     |
| **50%**  | Resistência: metade do dano |
|  **0%**  | Imunidade                   |

Os elementos são Fogo, Água, Ar, Eletricidade, Terra, Corrosão, Necrótico, Sagrado, Vazio e Arcano.

<details>
<summary>Como o valor final é formado</summary>

$$
\text{Final} = \text{Raça} \times \text{Meta-raça} + \text{Modificador} + \text{Encantamento}
$$

- **Raça × Meta-raça:** os multiplicadores inatos se **multiplicam**. Com mais de uma meta-raça, todas entram na multiplicação. Na ficha, esse produto aparece como uma única coluna, Raça.
- **Modificador:** ajuste manual em pontos percentuais, somado depois da multiplicação. Por exemplo, **-20%** leva 100% a 80%.
- **Encantamento:** bônus ou redutores dos itens encantados equipados, também somados.

> [!WARNING]
> O valor final nunca fica abaixo de **0%**, mas não tem limite superior.

> [!EXAMPLE]
>
> - **Draconato Negro com a meta-raça Zumbi:** Necrótico 50% × 0% = **0%** (imune); Sagrado 100% × 200% = **200%**.
> - **Zumbi e Esqueleto juntos:** Sagrado 200% × 200% = **400%**.
> - **Draconto Vermelho com modificador -20% e encantamento +10%:** Fogo 50% - 20% + 10% = **40%**.

</details>

<details>
<summary>Aplicando ao dano</summary>

Multiplique o dano daquele elemento pelo valor final. Por exemplo, um personagem com Fogo **50%** que sofre **10** de dano de fogo recebe **5**.

</details>

<details>
<summary>Raças com multiplicadores</summary>

As raças fora desta lista recebem **100%** em todos os elementos.

| Raça                   | Multiplicadores                                                                      |
| :--------------------- | :----------------------------------------------------------------------------------- |
| Draconto Vermelho      | Fogo **50%** · Água **200%**                                                         |
| Draconto Azul          | Eletricidade **50%** · Corrosão **200%**                                             |
| Draconato Verde        | Fogo **200%** · Corrosão **50%**                                                     |
| Draconato Negro        | Eletricidade **200%** · Necrótico **50%**                                            |
| Draconato Branco       | Fogo **200%** · Água **50%**                                                         |
| Draconato Dourado      | Fogo **50%** · Eletricidade **200%**                                                 |
| Draconato Prateado     | Fogo **200%** · Água **50%**                                                         |
| Draconato de Bronze    | Eletricidade **50%** · Corrosão **200%**                                             |
| Draconato de Cobre     | Eletricidade **200%** · Corrosão **50%**                                             |
| Draconato de Latão     | Fogo **50%** · Corrosão **200%**                                                     |
| Repitiliano Salamandra | Água **200%**                                                                        |
| Repitiliano Serpente   | Água **200%**                                                                        |
| Elemental de Terra     | Água **200%** · Ar **200%** · Eletricidade **50%** · Terra **0%** · Corrosão **50%** |

</details>

<details>
<summary>Meta-raças com multiplicadores</summary>

| Meta-raça | Multiplicadores                                     |
| :-------- | :-------------------------------------------------- |
| Zumbi     | Necrótico **0%** · Sagrado **200%** · Vazio **50%** |
| Esqueleto | Necrótico **0%** · Sagrado **200%** · Vazio **50%** |

</details>
