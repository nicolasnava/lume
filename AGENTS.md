# AGENTS.md — Regras & Contexto Automático para IAs (Lumê)

Este repositório possui uma documentação técnica e de negócio completa no arquivo [PROJECT_CONTEXT.md](file:///c:/Users/user/Documents/Projetos/lume/PROJECT_CONTEXT.md) e um manual completo de UI/UX e estética no arquivo [DESIGN_SYSTEM.md](file:///c:/Users/user/Documents/Projetos/lume/DESIGN_SYSTEM.md).

## Diretrizes Obrigatórias Para Todo Agente:
1. **Consulte o Contexto Mestre:** Antes de propor refatorações ou implementar novas telas, leia sempre o [PROJECT_CONTEXT.md](file:///c:/Users/user/Documents/Projetos/lume/PROJECT_CONTEXT.md) e consulte o [DESIGN_SYSTEM.md](file:///c:/Users/user/Documents/Projetos/lume/DESIGN_SYSTEM.md).
2. **Zero Emojis:** Nunca use emojis na interface ou no código (em botões, títulos, cards ou labels). Use exclusivamente ícones do `lucide-react`.
3. **Identidade Visual Lumê:** 
   - Primária: `#B8A9D9` (lilás suave)
   - Fundo/Secundária: `#FAF7F5` (off-white)
   - Texto/Destaque: `#4A3F5C` (roxo profundo)
   - Financeiro: `emerald-700` (verde esmeralda)
4. **Layout Desktop:** Preserve sempre o design desktop sem barras de rolagem desnecessárias (`space-y-1` entre itens do menu lateral).
5. **Tipagem e Build:** Rode sempre `npx tsc --noEmit` para garantir 0 erros de compilação após suas modificações.

