A [[ST]] determina o dano de ataques desarmados e com armas brancas. Há dois tipos de dano básico:

- [[GDP]]: socos, chutes, mordidas e armas de ponta, como lanças e floretes.
- [[BAL]]: machados, porretes, espadas e qualquer arma que funcione como alavanca para multiplicar a ST.

O dano é escrito como dados mais bônus: **1d6-2** significa rolar um dado de seis faces e subtrair 2.

> [!NOTE]
> Armas e ataques específicos somam seus próprios modificadores a este dano básico. Os modificadores de GDP e BAL na ficha também são somados ao bônus da tabela.

### Tabela de dano (ST 1 a 100)

Uma ST entre dois valores da tabela usa a linha imediatamente abaixo. Por exemplo, ST 32 usa a linha da ST 31.

|   ST    |  GDP   |  BAL   |
| :-----: | :----: | :----: |
|  **1**  |   —    |   —    |
|  **2**  |   —    |   —    |
|  **3**  |   —    |   —    |
|  **4**  |   —    |   —    |
|  **5**  | 1d6-5  | 1d6-5  |
|  **6**  | 1d6-4  | 1d6-4  |
|  **7**  | 1d6-3  | 1d6-3  |
|  **8**  | 1d6-3  | 1d6-2  |
|  **9**  | 1d6-2  | 1d6-1  |
| **10**  | 1d6-2  |  1d6   |
| **11**  | 1d6-1  | 1d6+1  |
| **12**  | 1d6-1  | 1d6+2  |
| **13**  |  1d6   | 2d6-1  |
| **14**  |  1d6   |  2d6   |
| **15**  | 1d6+1  | 2d6+1  |
| **16**  | 1d6+1  | 2d6+2  |
| **17**  | 1d6+2  | 3d6-1  |
| **18**  | 1d6+2  |  3d6   |
| **19**  | 2d6-1  | 3d6+1  |
| **20**  | 2d6-1  | 3d6+2  |
| **21**  |  2d6   | 4d6-1  |
| **22**  |  2d6   |  4d6   |
| **23**  | 2d6+1  | 4d6+1  |
| **24**  | 2d6+1  | 4d6+2  |
| **25**  | 2d6+2  | 5d6-1  |
| **26**  | 2d6+2  |  5d6   |
| **27**  | 3d6-1  | 5d6+1  |
| **28**  | 3d6-1  | 5d6+2  |
| **29**  |  3d6   | 6d6-1  |
| **30**  |  3d6   |  6d6   |
| **31**  | 3d6+1  | 6d6-1  |
| **33**  | 3d6+2  |  6d6   |
| **35**  | 4d6-1  | 6d6+1  |
| **37**  |  4d6   | 6d6+2  |
| **39**  | 4d6+1  | 7d6-1  |
| **45**  |  5d6   | 7d6+1  |
| **50**  | 5d6+2  | 8d6-1  |
| **55**  |  6d6   | 8d6+1  |
| **60**  | 7d6-1  |  9d6   |
| **65**  | 7d6+1  | 9d6+2  |
| **70**  |  8d6   |  10d6  |
| **75**  | 8d6+2  | 10d6+2 |
| **80**  |  9d6   |  11d6  |
| **85**  | 9d6+2  | 11d6+2 |
| **90**  |  10d6  |  12d6  |
| **95**  | 10d6+2 | 12d6+2 |
| **100** |  11d6  |  13d6  |

— significa sem dano básico.

### Acima de ST 100

O dano sobe **1 dado a cada 10 de ST**, sem bônus fixo, e o BAL fica sempre 2 dados à frente do GDP:

$$
\text{GDP} = \left( \left\lfloor \frac{ST}{10} \right\rfloor + 1 \right)\text{d6}
\qquad
\text{BAL} = \left( \left\lfloor \frac{ST}{10} \right\rfloor + 3 \right)\text{d6}
$$

Por exemplo, ST 125: GDP **13d6** e BAL **15d6**.
