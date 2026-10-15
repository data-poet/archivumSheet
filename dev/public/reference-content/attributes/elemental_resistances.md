Cada personagem tem um multiplicador de dano para cada um dos dez elementos. Ele aparece na ficha como a porcentagem do dano daquele elemento que o personagem realmente recebe.

|  Valor   | Significado                 |
| :------: | :-------------------------- |
| **100%** | Dano normal                 |
| **200%** | Fraqueza: dano em dobro     |
| **50%**  | Resistência: metade do dano |
|  **0%**  | Imunidade                   |

Os elementos são Fogo, Água, Ar, Eletricidade, Terra, Corrosão, Necrótico, Sagrado, Vazio e Arcano.

### Como o valor final é formado

$$
\text{Final} = \text{Raça} \times \text{Meta-raça} + \text{Modificador} + \text{Encantamento}
$$

- **Raça × Meta-raça:** os multiplicadores inatos se **multiplicam**. Com mais de uma meta-raça, todas entram na multiplicação. Na ficha, esse produto aparece como uma única coluna, Raça.
- **Modificador:** ajuste manual em pontos percentuais, somado depois da multiplicação. Por exemplo, **-20%** leva 100% a 80%.
- **Encantamento:** bônus ou redutores dos itens encantados equipados, também somados.

> [!WARNING] O valor final nunca fica abaixo de **0%**, mas não tem limite superior.

### Aplicando ao dano

Multiplique o dano daquele elemento pelo valor final. Por exemplo, um personagem com Fogo **50%** que sofre **10** de dano de fogo recebe **5**.
