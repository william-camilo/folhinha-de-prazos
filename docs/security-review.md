# Evidência de segurança — calendários de mesa

Verificação local em 20/10/2026 (America/Sao_Paulo), sobre a implementação do PR #1.

- `npm audit --omit=dev --json`: saída 0; zero vulnerabilidades conhecidas nas dependências de produção. A auditoria não cobre dependências de desenvolvimento nem comprova ausência de vulnerabilidades no código.
- `src/components/BirthdayWidget/BirthdayWidget.security.test.tsx`: regressão para rejeição de data inexistente antes da persistência e renderização de nomes contendo HTML como texto, sem criar elementos executáveis.
- Os aniversários continuam apenas no `localStorage` do navegador. Não foram adicionados endpoints, autenticação, tokens ou envio de dados pessoais.
- O cache ignora `Vary` somente nos arquivos públicos de `/assets/`, com nomes versionados pelo build. A rota `/api/` permanece fora desse cache.
- Navegador: exportação de CSV verificada após recarga offline, fechamento do diálogo com Esc, retorno do foco e validação de 31/02.

O aviso automático do ECC classificou arquivos de `src/hooks/` como sensíveis. Neste projeto são hooks React de interface; as alterações não configuram hooks de execução de agentes. Esta evidência não altera permissões do GitHub App nem substitui a avaliação do robô.
