# AGENTS.md — Regras & Contexto Automático para IAs (Lumê)

Este repositório possui documentação técnica e de negócio no arquivo [PROJECT_CONTEXT.md](file:///c:/Users/nicol/Documents/projetos/lume/PROJECT_CONTEXT.md) e manual de UI/UX e estética no arquivo [DESIGN_SYSTEM.md](file:///c:/Users/nicol/Documents/projetos/lume/DESIGN_SYSTEM.md).

---

## ⚡ REGRA FUNDAMENTAL: O TRIO UNIFICADO LUMÊ (CANVAS + EMIL + DISTILL)
**A TODO MOMENTO, ANTES DE QUALQUER AÇÃO, REFATORAÇÃO OU CRIAÇÃO DE TELA/COMPONENTE, EXECUTE ESTE CHECKLIST MENTAL:**

### 1. DISTILL (Edição Impiedosa & Redução de Ruído)
- **Corte 20% que gera 80% do valor:** Remova elementos secundários desnecessários e deixe o objetivo principal óbvio.
- **Zero Card-in-Card:** Nunca crie caixas dentro de caixas. Achate estruturas usando respiro e alinhamento.
- **Zero Badges Excessivos:** Não use arco-íris de tags ou pílulas coloridas. Prefira texto sóbrio com indicador sutil.
- **Tipografia Limpa:** Nunca use fontes mono para valores monetários ou métricas. Use a fonte padrão elegante do sistema.
- **Cópia Cirúrgica:** Reduza títulos e legendas pela metade. Use voz ativa e direta.

### 2. CANVAS DESIGN (Composição de Arte & Qualidade de Museu)
- **Tratamento Editorial Nobre:** A tela deve transmitir refinamento artesanal de revista de luxo, nunca software genérico.
- **Espaço e Respiro Estrutural:** O espaço em branco é deliberado e harmonioso. Nada espremido, nada truncado.
- **Alinhamento Impecável:** Grids consistentes, hierarquia visual equilibrada e rigor milimétrico em margens.
- **Paleta Contida e Autêntica:** Apenas cores institucionais oficiais Lumê.

### 3. EMIL DESIGN ENGINEERING (Microinterações & Física Fluida)
- **Feedback Tátil:** Adicione sempre `:active:scale(0.97)` ou `active:scale-[0.98]` com `transition: transform 160ms ease-out` em botões, abas e cards clicáveis.
- **Limite de 300ms:** Nenhuma animação de interface deve durar mais de 300ms (ideal entre 150ms e 250ms).
- **Proibido `ease-in`:** Use sempre `ease-out` ou curva customizada rápida (`cubic-bezier(0.23, 1, 0.32, 1)`).
- **Nunca `scale(0)`:** Entradas de modais e menus partem de `scale(0.95)` + `opacity: 0`.
- **Origem de Transformação:** Dropdowns e popovers abrem a partir do elemento gatilho (`transform-origin`). Modais permanecem centrados.
- **Hardware Acceleration:** Anime estritamente `transform` e `opacity` para manter 60fps sem recálculo de layout.

---

## Diretrizes Obrigatórias Para Todo Agente:
1. **Consulte o Contexto Mestre:** Antes de propor refatorações ou implementar novas telas, leia sempre o [PROJECT_CONTEXT.md](file:///c:/Users/nicol/Documents/projetos/lume/PROJECT_CONTEXT.md) e consulte o [DESIGN_SYSTEM.md](file:///c:/Users/nicol/Documents/projetos/lume/DESIGN_SYSTEM.md).
2. **Zero Emojis:** Nunca use emojis na interface ou no código (em botões, títulos, cards ou labels). Use exclusivamente ícones do `lucide-react`.
3. **Identidade Visual Lumê:** 
   - Primária: `#B8A9D9` (lilás suave)
   - Fundo/Secundária: `#FAF7F5` (off-white)
   - Texto/Destaque: `#4A3F5C` (roxo profundo)
   - Financeiro: `emerald-700` (verde esmeralda)
4. **Layout Desktop:** Preserve sempre o design desktop sem barras de rolagem desnecessárias (`space-y-1` entre itens do menu lateral).
5. **Tipagem e Build:** Rode sempre `npx tsc --noEmit` para garantir 0 erros de compilação após suas modificações.
6. **Evite Badges Excessivos:** Não use badges, selos ou pílulas em excesso pela interface. Mantenha os elementos visuais limpos, sofisticados e diretos, evitando poluição visual com badges desnecessários ou repetitivos.
