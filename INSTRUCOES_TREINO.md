# Instruções para Preenchimento do Arquivo de Treino

## Visão Geral
O arquivo de treino é um JSON que define o plano de exercícios do aluno. O app carrega este arquivo e exibe os exercícios do dia com animações, alternativas e métricas.

## Estrutura Completa

`json
{
  "nome": "Treino ABCD - Hipertrofia",
  "aluno": "Nome do Aluno",
  "objetivo": "hipertrofia",
  "semanaInicio": "2026-11-12",
  "configuracoesPersonal": {
    "hidratacaoMl": 3500,
    "diasTreino": 4,
    "metaPeso": 75,
    "obs": "Observações gerais do personal"
  },
  "dias": [
    {
      "dia": "Segunda",
      "nome": "Treino A - Peito e Tríceps",
      "exercicios": [
        {
          "nome": "Supino Reto com Barra",
          "grupoMuscular": "Peitoral Maior",
          "series": 4,
          "repeticoes": "8-12",
          "cargaKg": 60,
          "descansoS": 90,
          "animacao": "🏋️",
          "alternativa": "Supino reto com halteres",
          "obs": "Controle a descida em 3 segundos"
        }
      ]
    }
  ]
}
`

## Campos do Nível Raiz

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| 
ome | string | Sim | Nome do plano de treino |
| luno | string | Sim | Nome do aluno |
| objetivo | string | Sim | Objetivo principal (hipertrofia, forca, emagrecimento, etc) |
| semanaInicio | string | Sim | Data de início no formato YYYY-MM-DD |
| configuracoesPersonal | object | Não | Configurações que sobrescrevem cálculos automáticos |
| dias | array | Sim | Lista de dias de treino |

## Configurações do Personal

| Campo | Tipo | Descrição |
|-------|------|-----------|
| hidratacaoMl | number | Meta diária de água em ml (sobrescreve cálculo peso×35ml) |
| diasTreino | number | Dias necessários por semana (compara com realizados) |
| metaPeso | number | Peso alvo em kg |
| obs | string | Observações gerais do personal |

## Estrutura de Cada Dia

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| dia | string | Sim | Dia da semana (Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo) |
| 
ome | string | Não | Nome do treino (ex: "Treino A - Peito") |
| xercicios | array | Sim | Lista de exercícios do dia |

## Estrutura de Cada Exercício

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| 
ome | string | **Sim** | Nome completo do exercício |
| grupoMuscular | string | **Sim** | Grupo muscular principal (usado em gráficos) |
| series | number | **Sim** | Número de séries |
| epeticoes | string/number | **Sim** | Repetições (ex: 12 ou "8-12") |
| cargaKg | number/null | **Sim** | Peso em kg (null para peso corporal) |
| descansoS | number | **Sim** | Descanso entre séries em segundos |
| nimacao | string | Não | Emoji ou URL de GIF (app busca automaticamente se vazio) |
| lternativa | string | Não | Exercício substituto se máquina ocupada |
| obs | string | Não | Dica técnica ou observação |

## Exemplos de Grupos Musculares

Use nomes padronizados para melhor agrupamento nos gráficos:

- **Peito**: Peitoral Maior, Peitoral Superior, Peitoral Inferior
- **Costas**: Dorsais, Romboides, Trapézio, Lombar
- **Ombros**: Deltoide Anterior, Deltoide Lateral, Deltoide Posterior
- **Braços**: Bíceps, Tríceps, Braquial, Antebraço
- **Pernas**: Quadríceps, Posterior de Coxa, Glúteos, Panturrilha, Adutores, Abdutores
- **Core**: Abdômen, Oblíquos, Transverso

## Exemplo Mínimo Funcional

`json
{
  "nome": "Treino Básico",
  "aluno": "João",
  "objetivo": "saude",
  "semanaInicio": "2026-11-12",
  "dias": [
    {
      "dia": "Segunda",
      "nome": "Treino A",
      "exercicios": [
        {
          "nome": "Flexão de Braço",
          "grupoMuscular": "Peitoral Maior",
          "series": 3,
          "repeticoes": "10-15",
          "cargaKg": null,
          "descansoS": 60
        }
      ]
    }
  ]
}
`

## Dicas Importantes

1. **Animações**: O app busca automaticamente GIFs de exercícios baseado no nome. Se não encontrar, usa o emoji do campo nimacao ou um ícone padrão.

2. **Dias de Descanso**: Para dias sem treino, inclua o dia com array xercicios vazio:
   `json
   { "dia": "Quarta", "nome": "Descanso", "exercicios": [] }
   `

3. **Cargas Progressivas**: Para indicar progressão, adicione observações no campo obs ou use o relatório semanal para ajustar.

4. **Alternativas**: Sempre forneça alternativas para exercícios com máquinas específicas, caso estejam ocupadas.

5. **Grupos Musculares**: Use nomes consistentes para que os gráficos de stress e frequência funcionem corretamente.
