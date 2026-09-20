---
description: Regra ativa contínua - Trio Unificado de Design & Engenharia Visual Lumê (Canvas Design + Emil Design Eng + Distill).
globs: ["src/**/*.tsx", "src/**/*.jsx", "src/**/*.css", "src/**/*.ts"]
---

# Diretriz Permanente: O Trio Unificado Lumê (Canvas + Emil + Distill)

Antes e durante QUALQUER modificação, criação ou refatoração de interface no Lumê, siga obrigatoriamente estes três pilares unificados:

## 1. DISTILL (Edição Impiedosa & Redução de Ruído)
- **Elimine o excesso:** Se um elemento não tem utilidade direta para 80% do valor do usuário, remova ou oculte em revelação progressiva.
- **Zero Card-in-Card:** Nunca coloque cards dentro de cards. Use espaçamento, alinhamento e contraste de cor de fundo em vez de caixas repetitivas.
- **Zero Badges Excessivos:** Sem arco-íris de tags. Status deve ser preferencialmente texto elegante e sóbrio com indicador discreto.
- **Tipografia Limpa:** Nunca use fontes mono para moedas ou valores; use a tipografia institucional fluida e limpa.
- **Cópia Enxuta:** Títulos curtos, botões em voz ativa ("Salvar alterações", "Suspender conta"), sem texto óbvio ou redundante.

## 2. CANVAS DESIGN (Composição Editorial & Qualidade de Museu)
- **Sensação de Artefato Nobre:** Trate a tela como um design de revista ou galeria de arte contemporânea, nunca como um software genérico ou amador.
- **Espaço e Respiro:** O espaço em branco é estrutural. Dê margem e ar para os blocos respirarem sem ficarem espremidos nem desconectados.
- **Rigor nos Alinhamentos:** Nada desalinhado, nada truncado, margens proporcionais e grids consistentes.
- **Paleta Contida e Autêntica:** Apenas tons oficiais Lumê (#B8A9D9, #FAF7F5, #4A3F5C, emerald-700).

## 3. EMIL DESIGN ENGINEERING (Microinterações & Fluidez Tátil)
- **Feedback ao Pressionar:** `:active:scale(0.97)` com `transition: transform 160ms ease-out` em todo botão, aba ou card clicável.
- **Regra dos 300ms:** Nenhuma animação de interface deve passar de 300ms (padrão 150ms-250ms).
- **Proibido `ease-in`:** Use sempre `ease-out` ou curva forte `cubic-bezier(0.23, 1, 0.32, 1)`.
- **Nunca `scale(0)`:** Modais, toasts e menus entram a partir de `scale(0.95)` + `opacity: 0`.
- **Origem do Gatilho:** Menus e popovers abrem a partir do elemento clicado (`transform-origin`). Modais permanecem centralizados.
- **Aceleração por Hardware:** Anime estritamente `transform` e `opacity`, evitando recálculos de layout.
