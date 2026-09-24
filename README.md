# Folhinha de Prazos

PWA para calcular prazos em **dias corridos** e **dias úteis** com os feriados nacionais do Brasil
(fixos + móveis calculados pela Páscoa), feriados locais informados pelo usuário e exportação CSV.
O vencimento aparece numa folhinha de mesa em 3D que inclina com o ponteiro e "arranca a folha" a cada nova data.

## Rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + React Testing Library
npm run build      # gera dist/ (PWA pronto para deploy estático)
npm run typecheck  # checagem de tipos do TypeScript
npm run preview
```

## Stack

| Camada | Escolha |
| --- | --- |
| UI | React 18 + TypeScript |
| Bundler | Vite 5 |
| Estilo | CSS próprio com variáveis (temas claro/escuro, efeitos 3D com `transform-style: preserve-3d`) |
| Datas | date-fns 4 + locale `pt-BR` (formatação e grade do calendário); regras de feriado em `Date` puro |
| Estado | React Context + `useReducer` (preferências salvas em `localStorage`) |
| CSV | papaparse (`;` + BOM para Excel, `,` + ISO para Looker Studio) |
| PWA | `public/manifest.webmanifest` + `public/sw.js` (offline, sem plugin) |
| Testes | Vitest + React Testing Library |

## Estrutura

```
src/
├─ components/
│  ├─ Header/                 marca 3D, feriados, instalar app, tema
│  ├─ ConfigurationBar/       data inicial + regras de contagem
│  ├─ QuickCalculator/        dias úteis · dias corridos · entre datas
│  ├─ Folhinha3D/             folhinha em 3D (tilt + folha arrancada)
│  ├─ DayTimeline/            mini-calendário da contagem dia a dia
│  ├─ DeadlineTable/          tabela base de vencimentos
│  ├─ CalendarDaysTable/      5…180 dias corridos
│  ├─ BusinessDaysTable/      5…180 dias úteis
│  └─ HolidaysModal/          feriados do ano, feriados locais, CSV
├─ context/DateContext.tsx    Provider + reducer
├─ hooks/                     useHolidays, useTilt, useInstallPrompt, useThemeEffect, useOnline
├─ pages/Home.tsx
├─ pwa/registerSW.ts
├─ services/csvExport.ts
└─ utils/                     holidays.ts · calculator.ts · format.ts (+ __tests__)
```

## Regras de contagem

- **Excluir o dia do começo** (padrão, CPC art. 224): a contagem começa no dia seguinte.
- **Dias úteis**: pula sábados, domingos e feriados.
- **Dias corridos**: todos os dias contam; com **Prorrogar para dia útil**, um vencimento em dia sem expediente vai para o próximo dia útil.
- **Pontos facultativos** (Carnaval seg/ter, Quarta-feira de Cinzas, Corpus Christi) contam como feriado por padrão; dá para desligar.
- Feriados estaduais/municipais entram pelo modal de feriados.
- Recesso forense e suspensões de cada tribunal **não** são considerados.

## CSV para Looker Studio (Data Studio)

Sem back-end: o build emite `dist/api/holidays.csv` (ano anterior até +5 anos). Depois do deploy, use
`https://SEU-DOMINIO/api/holidays.csv` como fonte de dados. Em `npm run dev` o mesmo endpoint aceita
`?from=2025&to=2030`.

Para builds embutidos onde o navegador bloqueia downloads, rode com `VITE_NO_DOWNLOAD=true` e só os botões "Copiar" aparecem.

## Deploy

- **Vercel / Netlify**: importe o repositório; `vercel.json` e `netlify.toml` já estão prontos (build `npm run build`, pasta `dist`).
- **GitHub Pages**: o workflow `.github/workflows/deploy.yml` roda testes, faz o build e publica a cada push na `main`. Ative em *Settings → Pages → Source: GitHub Actions*. `base: './'` já funciona na subpasta `/nome-do-repo/`.

O service worker só é registrado no build de produção. Ao mudar o app, suba a constante `VERSION` em `public/sw.js`.

## Ícones

`public/icons/` já traz os PNGs. Para regerar a partir de `icon.svg`: `npm i -D sharp && npm run icons`.
