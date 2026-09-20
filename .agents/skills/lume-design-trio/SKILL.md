---
name: lume-design-trio
description: Unified Design & Engineering Trio (Canvas Design + Emil Design Eng + Distill) for Lumê. Use this skill whenever building, modifying, or reviewing any user interface, component, page, or interaction.
---

# Lumê Design Trio: Canvas Design + Emil Design Eng + Distill

Esta skill funde os três padrões mundiais de design e engenharia de interface para a plataforma Lumê:
1. **Canvas Design (Anthropic):** Sofisticação visual, ritmo espacial, respiração e acabamento artesanal com rigor de obra de arte.
2. **Emil Design Engineering (Emil Kowalski):** Microinterações táteis, fluidez 60fps, escala ativa, curvas de aceleração naturais e respeito ao tempo do usuário.
3. **Distill (Impeccable / Pedro Bakaus):** Edição cirúrgica, remoção de ruído, redução de containers aninhados, zero poluição por badges e foco absoluto no que gera 80% do valor.

---

## 1. O Ritual de Execução em Toda Ação (Pre-Flight Checklist)

Antes de escrever qualquer linha de código em `src/components` ou `src/app`:

1. **[DISTILL] O que posso cortar antes de começar?**
   - Existe algum card dentro de card? Se sim, achate a estrutura usando espaçamento e linha de corte sutil.
   - Existem badges/pílulas coloridas desnecessárias competindo com o conteúdo? Remova e converta em texto limpo.
   - Existem múltiplos botões principais competindo? Deixe apenas UM botão primário em evidência.
   - Os textos estão prolixos? Corte pela metade.

2. **[CANVAS] A composição respira e parece executiva?**
   - As margens e espaçamentos seguem o ritmo do design system (`gap-4`, `gap-6`, `p-6`, `p-8`)?
   - O alinhamento dos elementos é milimétrico?
   - A paleta está contida e elegante (Lilás `#B8A9D9`, Off-White `#FAF7F5`, Roxo `#4A3F5C`, Esmeralda `#047857`)?
   - Zero emojis no código ou tela (exclusivo `lucide-react`).

3. **[EMIL] Como é a sensação física da interação?**
   - Elementos clicáveis têm `:active:scale(0.97)` e transição ágil (`duration-150` ou `duration-200`)?
   - Transições usam propriedades explícitas (nunca `transition-all`)?
   - Nenhuma animação usa `ease-in`? Usar `ease-out` ou `cubic-bezier(0.23, 1, 0.32, 1)`.
   - Modais ou popovers surgem de `scale(0.95)` + `opacity: 0` e nunca de `scale(0)`?
   - Animações duram menos de 300ms?

---

## 2. Detalhamento dos Pilares

### Pilar A: Distill — Edição Cirúrgica & Foco
- **Redução de Ruído:** Elimine bordas duplas, sombras excessivas e fundos pesados.
- **Hierarquia 80/20:** Os 20% das ações que resolvem 80% do dia a dia da profissional ou do administrador devem ter acesso instantâneo. O restante deve ficar sob abas ou botões discretos de menu ("Mais ações").
- **Tipografia:** Sem fontes monospaçadas para dados financeiros ou cadastrais. Use a tipografia institucional fluida e limpa com peso adequado (`font-bold` ou `font-black`).

### Pilar B: Canvas Design — Acabamento Artístico & Rigor
- **Tratamento de Galeria:** Não entregue telas que pareçam tabelas cruas do Excel ou formulários padrão de Bootstrap. Dê peso, margem de respiro e distribuição equilibrada de massas visuais.
- **Espaço Negativo Ativo:** Espaço em branco não é vazio: é a respiração que dá sensação de luxo e controle.
- **Cores com Propósito:**
  - Off-white `#FAF7F5`: Aconchego e amplitude.
  - Lilás `#B8A9D9`: Toque de marca e destaque primário.
  - Roxo `#4A3F5C`: Leitura nobre e firme.
  - Esmeralda `#047857`: Confiança e saúde financeira.

### Pilar C: Emil Design Engineering — Física e Microinterações
- **Feedback Tátil:** Adicione sempre `active:scale-[0.98] transition-transform duration-150 ease-out` aos botões e abas.
- **Performance de GPU:** Animar apenas propriedades compostas pelo compositing engine (`transform`, `opacity`). Evite animar `height` ou `width` diretamente.
- **Origem do Movimento:** Dropdowns devem abrir a partir de onde foram clicados, mantendo coerência espacial.
- **Modais e Overlays:** Entradas suaves com `duration-200`, backdrop com `backdrop-blur-xs` e saída mais rápida do que a entrada.

---

## 3. Tabela de Revisão Obrigatória (Before / After / Why)

Ao propor refatorações ou revisar telas existentes, estruture o diagnóstico neste formato padronizado:

| Elemento / Código Anterior | Ajuste Proposto (Trio Lumê) | Motivo & Benefício |
| :--- | :--- | :--- |
| `transition-all duration-500` | `transition-transform duration-200 ease-out` | [Emil] Evita lag de layout e acelera resposta percebida |
| Card com borda dentro de outro card | Seção plana com espaçamento limpo | [Distill] Remove claustrofobia visual e ruído de caixas |
| Badges coloridos em cada linha | Texto sóbrio com indicador discreto | [Distill + Canvas] Reduz fadiga visual e polui menos a visão executiva |
| Botão sem estado ativo | `active:scale-[0.97]` | [Emil] Dá feedback físico imediato de que o clique foi registrado |
