# archivumSheet

A **archivumSheet** é uma ferramenta online para criação de fichas de personagem, com um mecanismo de regras modular. Ela permite que os jogadores criem personagens, calculem atributos e exportem/importem suas fichas em formato JSON.

O projeto foi desenvolvido com uma clara separação entre **ui**, **engine** e **data**, tornando-o escalável, testável e fácil de expandir.

## 1 - Conceito Central

O sistema é construído em torno de uma ideia simples:

> A engine é a única fonte de verdade para todos os cálculos.

- A **ui** coleta a entrada do usuário e renderiza os resultados
- A **engine** realiza todos os cálculos
- O **banco de dados (PostgreSQL)** fornece conteúdos estáticos, que são armazenados na pasta `/data`em formato `.csv`.

## 2 - Visão Geral da Arquitetura

```text
↓ User Input (UI Empty Rendering)

↓ Character Input JSON

↓ Engine (regras + sistemas)

↓ Calculated Character Sheet JSON

↓ UI Dynamic Rendering
```

---
