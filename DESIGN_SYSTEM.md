# DESIGN_SYSTEM.md — Manual de Estética, UI/UX & Estrutura Visual (Lumê)

> **Manual de Identidade & Engenharia Visual:** Este documento descreve as diretrizes visuais, tokens de estilo, hierarquia tipográfica, padrões de layout e componentes do **Lumê**. Qualquer novo chat, IA ou designer/desenvolvedor deve seguir estritamente este guia para garantir coesão estética e padrão visual em toda a plataforma.

---

## 1. Princípios de Design & Sensação da Marca

O Lumê foi projetado para transmitir **sofisticação, elegância e acolhimento** a profissionais da estética e beleza. A interface evita a rigidez de sistemas corporativos cinzentos e a superficialidade de temas infantis, adotando um visual orgânico com contrastes suaves e acabamento nobre.

### Pilares Fundamentais:
1. **Acabamento Premium (*Refined Luxury*):** Bordas generosamente arredondadas (`rounded-2xl` e `rounded-3xl`), micro-sombras aveludadas (`shadow-2xs` a `shadow-sm`) e fundos quentes e aconchegantes.
2. **Zero Emojis (Regra Inegociável):** Nunca utilize emojis na interface ou no código (nem em títulos, botões, cards ou badges). Use exclusivamente ícones vetoriais da biblioteca **`lucide-react`**.
3. **Clareza Informacional:** Rótulos em caixa alta sutil com espaçamento de letras (`uppercase tracking-wider text-[10px]`), dados quantitativos em números grandes e bem destacados com tipografia preta pesada (`font-black tracking-tight`).
4. **Responsividade Ergonômica:**
   - **Desktop:** Layout limpo e otimizado para caber no viewport sem barras de rolagem desnecessárias.
   - **Mobile:** Barra superior minimalista, navegação inferior ergonômica (*Bottom Navigation*) e modais em folha (*sheet-like*).

---

## 2. Paleta de Cores & Tokens

### 2.1 Cores Institucionais Lumê (Modo Claro)

```css
/* Tokens Oficiais */
--lume-primary:        #B8A9D9; /* Lilás suave / Lavanda institucional */
--lume-secondary:      #FAF7F5; /* Off-white aconchegante (Fundo da aplicação) */
--lume-text:           #4A3F5C; /* Roxo escuro profundo (Títulos e textos nobres) */
--lume-surface:        #FFFFFF; /* Branco puro (Superfície de Cards e Modais) */
--lume-border:         #E5E7EB; /* Cinza claríssimo (border-gray-200 / border-gray-100) */

/* Cores Semânticas de Negócio */
--lume-financial:      #047857; /* Verde esmeralda (emerald-700) para faturamento e pago */
--lume-financial-bg:   #ECFDF5; /* Verde claro (emerald-50) para fundos e tags de lucro */
--lume-warning:        #B45309; /* Âmbar (amber-700 / amber-500) para alertas e atenção */
--lume-danger:         #B91C1C; /* Vermelho carmim (rose-700 / red-600) para no-show e cancelamentos */
```

### 2.2 Aplicação Prática no Tailwind CSS
| Função Visual | Classes Recomendadas |
| :--- | :--- |
| **Fundo da Página** | `bg-[#FAF7F5]` |
| **Fundo de Cards Principais** | `bg-white border border-gray-200/80 shadow-2xs` |
| **Fundo de Sub-Cards / Inputs**| `bg-gray-50/80` ou `bg-[#FAF7F5] border border-gray-200` |
| **Títulos e Valores Principais**| `text-[#4A3F5C] font-bold` ou `font-black` |
| **Valores Financeiros** | `text-emerald-700 font-bold` |
| **Texto de Apoio / Subtítulo** | `text-gray-500 text-xs font-medium` |
| **Rótulos / Mini-trackers** | `text-gray-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider` |
| **Badge Primário (Lilás)** | `bg-[#B8A9D9]/25 text-[#4A3F5C] border border-[#B8A9D9]/40` |

### 2.3 Modo Escuro (*Dark Mode*)
Definido em `globals.css` sob a classe `html.dark`:
- Fundo do App: `#13111C`
- Superfície de Cards: `#1A1626`
- Fundo Secundário (Inputs e Sub-cards): `#221C33`
- Bordas: `#2D263D`
- Texto Primário: `#EAE5F3`
- Texto Secundário: `#A39BB5`

---

## 3. Tipografia & Hierarquia de Textos

A plataforma utiliza duas famílias tipográficas integradas via `next/font`:
- **Sans (Padrão e UI):** `Manrope` (`--font-manrope`) — moderna, geométrica, com alta legibilidade em telas pequenas e densas.
- **Serif (Editorial e Destaques):** `Fraunces` (`--font-fraunces`) — orgânica, sofisticada, utilizada em slogans ou seções selecionadas de apresentação.

### Padrão de Escala Tipográfica:
1. **Título de Página Principal (H1):**
   ```tsx
   <h1 className="text-2xl sm:text-3xl font-black text-[#4A3F5C] tracking-tight">
     Título da Tela
   </h1>
   <p className="text-xs text-gray-500 mt-0.5">
     Descrição objetiva da funcionalidade ou contexto da página.
   </p>
   ```
2. **Título de Card ou Seção (H2/H3):**
   ```tsx
   <h2 className="text-base sm:text-lg font-bold text-[#4A3F5C] tracking-tight">
     Nome da Seção
   </h2>
   ```
3. **Indicador Quantitativo (KPI Principal):**
   ```tsx
   <span className="text-3xl sm:text-4xl font-black text-[#4A3F5C] tracking-tight">
     R$ 4.850,00
   </span>
   ```
4. **Sub-rótulo de Indicador (Tracker):**
   ```tsx
   <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
     Meta Mensal Estipulada
   </span>
   ```

---

## 4. Padrões Estruturais de Componentes

### 4.1 Cards Principais
Containers brancos de conteúdo com cantos muito suaves e bordas leves.
```tsx
<div className="rounded-3xl bg-white p-6 sm:p-7 border border-gray-200/80 shadow-2xs space-y-5">
  {/* Conteúdo do Card */}
</div>
```

### 4.2 Mini Cards & Métricas Rápidas (Grid de KPIs)
```tsx
<div className="rounded-3xl bg-white p-5 border border-gray-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
  <div className="flex items-center justify-between">
    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
      Faturamento Atual
    </span>
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
      <DollarSign className="h-5 w-5" />
    </div>
  </div>
  <div>
    <span className="text-3xl font-black text-[#4A3F5C] tracking-tight">
      R$ 3.420,00
    </span>
    <p className="text-[11px] text-gray-400 mt-1">
      Comparado ao mesmo período anterior
    </p>
  </div>
</div>
```

### 4.3 Padrão dos Ícones em Destaque
Ícones são inseridos em pequenos containers arredondados com tom lilás ou temático:
```tsx
<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C] shrink-0">
  <Calendar className="h-5 w-5 text-[#8675A9]" />
</div>
```

### 4.4 Badges e Tags Semânticas
- **Sucesso / Ativo / 100% Batida:**
  `px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold`
- **Informativo / Lumê Pill:**
  `px-2.5 py-1 rounded-xl bg-[#B8A9D9]/25 border border-[#B8A9D9]/40 text-[#4A3F5C] text-xs font-bold`
- **Atenção / Pendente:**
  `px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold`
- **Perigo / Cancelado:**
  `px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold`

### 4.5 Formulários, Inputs e Selects
Inputs com fundo ligeiramente aquecido (`#FAF7F5`), borda fina e foco no tom lilás da marca:
```tsx
<div className="space-y-1">
  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
    <User className="h-3.5 w-3.5 text-[#B8A9D9]" />
    <span>Nome Completo</span>
  </label>
  <input
    type="text"
    placeholder="Ex: Maria Silva"
    className="w-full rounded-xl border border-gray-200 bg-[#FAF7F5] px-3.5 py-2.5 text-xs text-[#4A3F5C] font-semibold focus:border-[#B8A9D9] focus:bg-white focus:outline-hidden transition"
  />
</div>
```

### 4.6 Modais e Diálogos Suspensos
Modais com backdrop suave escuro (`backdrop-blur-xs`), cantos arredondados generosos (`rounded-3xl`) e sombra imersiva:
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
  <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-5">
    {/* Cabeçalho do Modal */}
    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8A9D9]/20 text-[#4A3F5C]">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#4A3F5C]">Título do Modal</h3>
          <p className="text-xs text-gray-500 font-medium">Subtítulo explicativo</p>
        </div>
      </div>
      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition cursor-pointer">
        <X className="h-5 w-5" />
      </button>
    </div>
    {/* Corpo e Botões */}
  </div>
</div>
```

---

## 5. Estrutura do Menu Lateral Desktop (*Sidebar*)

A barra lateral desktop segue parâmetros milimétricos para evitar scroll desnecessário:
- **Largura e Fixação:** `md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200 p-4 justify-between`.
- **Cabeçalho:**
  - Logo Lumê no topo (`max-h-9 object-contain`).
  - Card de atalho para página pública estilizado com as cores da profissional (`rounded-2xl p-3.5`).
- **Linha de Novidades e Feedback:**
  - No mesmo alinhamento horizontal, sem linha divisória abaixo.
  - À esquerda: Ícone de sino roxo + texto *"Novidades"*.
  - À direita: Botão pill *"Feedback"* com fundo `bg-purple-50` e borda `border-purple-200/80`.
- **Itens de Navegação:**
  - Espaçamento vertical estrito: `space-y-1` (4px entre botões).
  - Formato dos botões: `rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] gap-3.5 font-semibold`.
  - **Item Ativo:** `bg-[#B8A9D9]/25 text-[#4A3F5C] font-bold shadow-2xs`.
  - **Item Inativo:** `text-gray-600 hover:bg-gray-100/80 hover:text-[#4A3F5C]`.
- **Rodapé da Sidebar:**
  - Linha divisória fina (`border-t border-gray-100 pt-3.5 mt-4`).
  - Foto circular da profissional (`h-9 w-9 rounded-full border border-[#B8A9D9]/40`), nome em negrito e email abaixo.

---

## 6. Barra de Rolagem Customizada (*Scrollbars*)

Configurada no `src/app/globals.css` para manter discrição visual e consistência com a paleta:
- **Largura/Altura:** `6px`.
- **Trilha (Track):** Transparente (`background: transparent`).
- **Cursor (Thumb):** `#D9D2CB` com cantos arredondados (`rounded-full`).
- **Hover:** Transição suave para o lilás institucional `#B8A9D9`.
- **Modo Escuro:** Thumb `#3B334D` com hover `#8675A9`.

---

## 7. Checklist de Qualidade Visual para Novas Telas

Ao implementar ou refatorar qualquer tela do Lumê, confira:
- [ ] O fundo geral da página está utilizando `bg-[#FAF7F5]`?
- [ ] Não há nenhum emoji no código ou na tela? Todos os ícones são do `lucide-react`?
- [ ] Os cards utilizam `rounded-3xl` ou `rounded-2xl` com `border-gray-200/80`?
- [ ] Valores monetários estão com a classe `text-emerald-700 font-bold`?
- [ ] O menu desktop permanece sem barras de rolagem estranhas no viewport padrão?
- [ ] O contraste de cores respeita os padrões de legibilidade?
- [ ] O comando `npx tsc --noEmit` roda com **0 erros**?
