# Revisão visual — legibilidade

final result: passed

## Revisão adicional — saída da folha

Corrigido o salto lateral ao começar a troca: a textura da fotografia recebia a inclinação da camada de texto pela segunda vez. A camada de textura agora compensa essa inclinação. O primeiro quadro da dobra é preparado antes da pintura.

A saída perdeu a translação horizontal, a rotação lateral de 24 graus e o avanço de 140 px em profundidade. A dobra usa uma curva contínua, com saída vertical somente na fase final. Duração normal de 1,45 s e de 1 s nas trocas consecutivas.

Evidências desta revisão: `../output/folhinha-review/motion/before-0.jpg` e `before-4.jpg` mostram a textura desalinhada e a folha lançada para o lado; `after-0.jpg`, `after-5.jpg` e `after-9.jpg` mostram alinhamento inicial, dobra e subida. As sequências têm viewports e datas diferentes; foram usadas para verificar o movimento, sem afirmar equivalência pixel a pixel entre elas.

Validação adicional: 41 testes passaram, typecheck e build passaram. Quatro testes de regressão cobrem os dois cantos, a preparação do primeiro quadro, a permanência no eixo, a limpeza e o movimento reduzido. No navegador, trocas rápidas mantiveram no máximo três folhas e terminaram sem folhas pendentes; nenhum aviso/erro no console. Viewport de 390 px sem transbordamento horizontal durante a saída. Sem dependências novas. Não testado em aparelhos físicos nesta revisão.

## Escopo e fontes

Refinamento da interface publicada, preservando a composição aprovada, os calendários fotográficos e os 12 atalhos. Esta revisão não afirma fidelidade pixel a pixel ao mockup conceitual nem certificação WCAG.

Fonte visual desta iteração: capturas novas de https://folhinha-de-prazos.vercel.app/.
Implementação: http://127.0.0.1:4174/.
Pasta de evidências local: `../output/folhinha-review/plugins/`.

Comparações exibidas juntas, antes/depois, na mesma entrada de revisão:

- Página clara, mecânico: `03-claro.jpg` / `07-claro-ajustado.jpg`.
- Diálogo vazio, foco no nome: `04-aniversarios.jpg` / `11-dialogo-final.jpg`.
- Página móvel: `05-mobile.jpg` / `09-mobile-ajustado.jpg`.
- Evidência adicional: `01-folha.jpg`, `06-folha-ajustada.jpg` e `10-dialogo-mobile.jpg`.

Estado comum: 21/10/2026, 15 dias úteis, resultado 12/11/2026, três regras habilitadas, nenhum aniversário cadastrado. Tema claro nas comparações, escuro nas capturas adicionais de folha.

Viewport desktop: 1050 × 1252 CSS px, devicePixelRatio 1; capturas fornecidas pelo navegador: 1035 × 1234 px em ambos os lados. Viewport móvel solicitado: 390 × 844 CSS px; capturas: 375 × 812 px em ambos os lados. Comparação na mesma escala retornada pelo navegador, sem redimensionamento adicional. Não se inferiu erro de layout das margens omitidas pela captura.

## Achados e correções

1. [P2, resolvido] Dicas das regras tinham 10 px no desktop e 11 px no celular. Agora 12 px com entrelinha 1,45. Fatos do prazo e resumo de aniversários passaram a 14 px. As legendas ganharam legibilidade sem sobreposição.
2. [P2, resolvido] O botão de fechar herdava a fonte compacta dos botões do cabeçalho. Os seletores agora atingem somente filhos diretos do cabeçalho. O botão tem símbolo de 26 px e área de 44 × 44 px; salvar tem fonte de 14 px.

Histórico: a primeira captura após editar (`08-aniversarios-ajustado.jpg`) ainda mostrou fonte de 12 px no fechar. A inspeção do estilo computado revelou a regra responsiva herdada. Após restringir os seletores, `11-dialogo-final.jpg` e `10-dialogo-mobile.jpg` confirmam fonte de 26 px e área de 44 × 44 px.

## Superfícies verificadas

- Tipografia: família e hierarquia preservadas; aumentos intencionais nos textos acima. Símbolo de fechar visível no desktop e celular.
- Espaçamento: cartões crescem com o texto, mantendo alinhamento e separação. A configuração ocupa aproximadamente mais uma linha no desktop; mudança intencional para leitura.
- Cores: tokens existentes reutilizados, incluindo os temas claro e escuro. Nenhuma nova paleta.
- Imagens: os mesmos três WebP, proporções e transparências preservados. Calendários continuam fotográficos com datas HTML; não são modelos tridimensionais completos.
- Conteúdo: textos, regras de cálculo, atalhos e datas preservados.
- Comparação focada: diálogo de aniversariantes inteiro visível nos pares, permitindo avaliar diretamente botão, campos e ação principal sem recorte adicional.

## Fluxos e validação

1. Calculadora: saudável. Os 12 atalhos permanecem; 20/10/2026 + 70 úteis retorna 01/02/2027, com 104 dias corridos, 29 dias de fim de semana e 5 feriados.
2. Troca de modelo: saudável. Folha e mecânico exibem o mesmo vencimento.
3. Aniversariantes: saudável no escopo visual. Os dois gatilhos abrem o diálogo; fechar e Escape devolvem o foco ao gatilho correto.
4. Layout móvel: saudável nos elementos alterados. Largura de conteúdo 375 px para viewport de 390 px, sem transbordamento horizontal. Botão de fechar medido em 44 × 44 px.

37 testes existentes passaram; build de produção passou. Console da prévia sem avisos ou erros coletados. Não foram acrescentados testes que apenas reproduzem regras de CSS. Cache do aplicativo atualizado para receber os novos assets.

## Limites

Figma confirmado como instalado e habilitado; suas skills foram carregadas. Ferramentas de edição do Figma não foram expostas nesta sessão, portanto não houve criação ou alteração de arquivo Figma. Product Design orientou captura, auditoria e comparação.

Safari, aparelhos físicos, leitor de tela e avaliação integral de contraste não foram repetidos nesta revisão de CSS. Sem P0/P1/P2 pendente no escopo desta alteração.
