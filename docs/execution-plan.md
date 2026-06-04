# Plano de Execucao

## Fase 1: Fundacao do repositorio

Objetivo: preparar a base tecnica para o SDK e o app exemplo.

Entregas:

- monorepo com pacote SDK e app exemplo;
- TypeScript configurado;
- lint e formatacao;
- estrutura de testes;
- pipeline basico de CI;
- documentacao inicial;
- Dockerfile para ambiente Android/Node;
- job macOS separado para validacao iOS.

Estrutura sugerida:

```txt
react-native-ble-presence/
  packages/
    react-native-ble-presence/
  examples/
    demo-app/
  docs/
```

## Fase 2: Modelo de dados e contratos

Objetivo: definir os tipos publicos do SDK.

Entregas:

- tipos `BleScanResult`, `BleFingerprint`, `RegisteredTag`, `PresenceMatch`;
- interfaces de adapter para backend/storage;
- modelo de configuracao;
- enums de plataforma, confianca, status de permissao e erro;
- documentacao dos contratos.

## Fase 3: Camada BLE

Objetivo: implementar scan BLE multiplataforma.

Entregas:

- wrapper sobre biblioteca BLE React Native;
- normalizacao de resultados Android/iOS;
- controle de start/stop scan;
- tratamento de permissoes;
- erros padronizados;
- modo foreground.

Decisao tecnica a validar:

- usar `react-native-ble-plx` como base principal, salvo restricao especifica do cliente.

## Fase 4: Fingerprint

Objetivo: transformar resultados de scan em assinaturas persistiveis.

Entregas:

- builder de fingerprint;
- parser de manufacturer data;
- parser de iBeacon, quando detectavel;
- parser de Eddystone, quando detectavel;
- classificacao de qualidade do cadastro;
- avisos de compatibilidade por plataforma.

## Fase 5: Motor de matching

Objetivo: identificar entidades a partir de fingerprints cadastrados.

Entregas:

- comparadores por tipo de campo;
- score de confianca;
- estrategia configuravel de prioridade;
- explicacao do match;
- testes unitarios com casos Android/iOS;
- fixtures de scans reais ou simulados;
- testes de regressao para casos ambiguos.

## Fase 6: Cadastro de tag

Objetivo: fornecer fluxo de registro embarcavel.

Entregas:

- hook `useTagRegistration`;
- selecao de candidato por RSSI e estabilidade;
- criacao de fingerprint;
- retorno de qualidade;
- componente opcional `TagRegistrationScreen`;
- exemplos de adapter para salvar no backend.

## Fase 7: Deteccao de presenca

Objetivo: detectar continuamente a entidade proxima.

Entregas:

- hook `usePresenceDetection`;
- eventos de entrada e saida;
- debounce para evitar troca instavel;
- configuracao de RSSI minimo;
- configuracao de tempo para considerar entidade perdida;
- componente opcional `PresenceStatus`.

## Fase 8: App exemplo

Objetivo: demonstrar a integracao completa.

Entregas:

- tela de permissoes;
- tela de entidades fake;
- fluxo de cadastro de tag;
- tela de scanner;
- tela de diagnostico;
- adapter mock/local;
- instrucoes para rodar Android/iOS.

## Fase 8.1: Estrategia de testes e CI

Objetivo: garantir qualidade continua do SDK.

Entregas:

- testes unitarios do core;
- testes de integracao dos hooks;
- fixtures Android/iOS;
- teste de build do pacote;
- teste de build Android em Linux/Docker;
- teste de build iOS em macOS;
- checklist de validacao manual com tags reais.

## Fase 9: Documentacao de integracao

Objetivo: permitir que outro time integre o SDK com autonomia.

Entregas:

- instalacao;
- setup iOS;
- setup Android;
- permissoes;
- exemplo de Provider;
- exemplo de adapter;
- exemplo de cadastro;
- exemplo de deteccao;
- limitacoes conhecidas;
- troubleshooting.

## Fase 10: Validacao em campo

Objetivo: testar o SDK com tags reais.

Entregas:

- matriz de testes por tipo de tag;
- comparativo Android/iOS;
- validacao de dados expostos por plataforma;
- ajustes de matching;
- relatorio de compatibilidade.

## Riscos tecnicos

- Algumas tags podem anunciar poucos dados alem do MAC.
- iOS nao expoe o MAC real.
- Background scanning tem limitacoes importantes em iOS.
- RSSI varia bastante por ambiente, aparelho e posicao.
- Tags diferentes podem ter nomes iguais.
- Fabricantes podem usar payloads proprietarios.

## Mitigacoes

- salvar fingerprint rico, nao apenas um campo;
- classificar confianca do cadastro;
- expor diagnostico para suporte;
- documentar tags com compatibilidade baixa;
- permitir regras de matching configuraveis;
- manter app exemplo para reproducao de cenarios.
