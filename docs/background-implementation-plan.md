# Plano de Implementacao: Background Presence Monitoring

Data: 2026-06-08

## Contexto

O SDK ja possui scanner foreground com `react-native-ble-plx`, fingerprint, matching, app demo com cadastro/deteccao, regras configuraveis, GPS e persistencia local.

A nova fase adiciona monitoramento em background para reduzir a necessidade de manter scan React Native continuo.

## Estado atual antes de continuar

Ha uma primeira base de background monitoring ja editada, ainda nao commitada:

- memoria tecnica do projeto;
- documentacao de background monitoring;
- contratos TypeScript para `BackgroundBleMonitor`;
- bridge React Native `createNativeBackgroundBleMonitor`;
- fallback `noopBackgroundBleMonitor`;
- base Android com `BluetoothLeScanner`, `PendingIntent` e `BroadcastReceiver`;
- base iOS com Core Location para regioes iBeacon;
- podspec do pacote;
- integracao inicial no demo app.

Antes de qualquer nova funcionalidade, essas mudancas precisam ser revisadas, validadas e commitadas em escopo coerente.

## Objetivo da etapa

Entregar uma primeira versao do SDK com capacidade nativa de monitoramento background, ainda marcada como inicial/experimental, com:

- API publica estavel o suficiente para teste;
- Android compilando e carregando o modulo nativo;
- iOS com base nativa implementada e pronta para validacao em macOS;
- demo app capaz de iniciar monitoramento para tags iBeacon cadastradas;
- documentacao clara de requisitos, limites e proximos passos.

## Fora do escopo imediato

- Garantir background perfeito em todos os fabricantes Android.
- Garantir comportamento iOS sem teste em aparelho real.
- Implementar Eddystone completo nesta mesma etapa.
- Substituir as regras de negocio da aplicacao.
- Criar backend.
- Publicar pacote npm.

## Plano de execucao

### 1. Revalidar estado atual

Tarefas:

- rodar `git status`;
- revisar diff por grupos: docs, TypeScript, Android, iOS, demo;
- garantir que nao ha alteracao acidental em arquivos gerados;
- confirmar que o README aponta para os documentos novos.

Criterio de aceite:

- diff entendido e sem mudancas fora do escopo.

### 2. Validar API TypeScript

Tarefas:

- revisar tipos `BackgroundBleMonitor*`;
- validar `createNativeBackgroundBleMonitor`;
- validar fallback `noopBackgroundBleMonitor`;
- rodar:

```bash
npm run typecheck:all
npm test
npm run build
npm audit
```

Criterio de aceite:

- comandos passam sem erro.

### 3. Validar Android build

Tarefas:

- confirmar autolinking com:

```bash
npx react-native config
```

- rodar build Android:

```bash
npm run demo:android:docker
```

- se autolinking estiver obsoleto, remover apenas artefatos gerados de autolinking e rebuildar;
- instalar APK no aparelho:

```bash
adb install -r examples/demo-app/android/app/build/outputs/apk/debug/app-debug.apk
```

Criterio de aceite:

- task `guilhermefrick_react-native-ble-presence:compileDebugJavaWithJavac` executa com sucesso;
- app abre sem crash;
- modulo nativo aparece como disponivel no demo.

### 4. Validar Android runtime minimo

Tarefas:

- reiniciar Metro limpo;
- abrir app;
- verificar logcat para erros `ReactNativeJS`, `AndroidRuntime`, `BlePresence`;
- conferir se a pill `Background` aparece como `disponivel`;
- com uma tag iBeacon cadastrada, acionar `Iniciar background`;
- validar que o app nao crasha;
- observar se eventos `entered` aparecem quando a tag esta proxima;
- testar recuperacao de eventos pendentes apenas se houver tempo e tag compativel.

Criterio de aceite:

- modulo carrega;
- chamada `isAvailable()` funciona;
- `start()` nao quebra com filtros iBeacon validos;
- eventos ou ausencia de eventos ficam diagnosticaveis.

### 5. Ajustar bugs Android encontrados

Possiveis ajustes esperados:

- permissao runtime ausente;
- flags de `PendingIntent`;
- callback type Android;
- serializacao de manufacturer data;
- mapeamento de `filterId`;
- comportamento quando nao ha filtro iBeacon.

Criterio de aceite:

- build volta a passar apos qualquer correcao.

### 6. Commitar primeira entrega

Sugestao de commits:

```bash
docs: record background monitoring plan
feat: add background monitor contracts
feat: add native background monitor base
feat: expose background monitor in demo
```

Se a revisao mostrar que o diff esta coeso, pode ser um unico commit:

```bash
feat: add background presence monitoring base
```

Criterio de aceite:

- `git status --short` limpo apos commit.

### 7. Planejar validacao iOS

Tarefas:

- preparar checklist para macOS;
- rodar `pod install`;
- compilar app iOS;
- validar permissoes `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSBluetoothAlwaysUsageDescription`;
- testar em aparelho real com iBeacon.

Criterio de aceite:

- plano iOS documentado mesmo que a execucao dependa de macOS.

### 8. Proxima fase: Eddystone

Tarefas futuras:

- implementar parser Eddystone UID;
- normalizar service data `FEAA`;
- adicionar testes unitarios;
- permitir filtros Android por Eddystone service UUID;
- documentar limitacoes iOS para Eddystone background.

## Riscos

- iOS background depende de permissao e comportamento do sistema.
- Android background varia por fabricante e politicas de bateria.
- `MATCH_LOST` Android pode nao ser confiavel em todos os aparelhos.
- Eventos background nao devem ser tratados como verdade absoluta; precisam passar pelas regras da aplicacao.
- Sem tag iBeacon real, parte da validacao fica limitada a build e carregamento do modulo.

## Decisao tecnica

O monitor background sera uma capacidade separada do scanner foreground:

- foreground scanner: diagnostico, cadastro e leitura rica;
- background monitor: acordar/notificar app com filtros;
- matching/fingerprint: identificar entidade;
- app cliente: aplicar regras, velocidade, timeout e comunicacao com backend.

