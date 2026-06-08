# Memoria Tecnica do Projeto

Ultima atualizacao: 2026-06-06

## Objetivo do produto

Fornecer um SDK React Native embarcavel para identificar presenca/proximidade de entidades por tags BLE genericas.

O SDK nao assume que a entidade seja um veiculo. Uma tag pode representar veiculo, ativo, equipamento, ambiente, usuario ou qualquer entidade definida pelo aplicativo cliente.

O problema principal e permitir que uma tag cadastrada em Android tambem seja reconhecida no iOS, sem depender exclusivamente do MAC Android ou do peripheral identifier do iOS.

## Repositorio

- Repositorio: `https://github.com/GuilhermeFrick/react-native-ble-presence.git`
- Branch principal: `main`
- Pacote SDK: `packages/react-native-ble-presence`
- App demonstrativo: `examples/demo-app`
- Documentacao: `docs`

## Arquitetura atual

### SDK

O SDK e headless e fornece:

- provider React Native;
- hooks de permissao, scan, cadastro e deteccao;
- contrato de scanner injetavel;
- contrato de adapter para backend/storage do cliente;
- implementacao foreground com `react-native-ble-plx`;
- normalizacao dos resultados Android/iOS;
- fingerprint BLE;
- parser iBeacon;
- motor de matching com score e explicacao.

O SDK nao contem regras de negocio como velocidade minima, quantidade de deteccoes ou timeout operacional. Essas regras pertencem ao aplicativo cliente.

### Demo app

O demo demonstra:

- scanner BLE real;
- permissoes Android/iOS;
- cadastro local de tag por entidade;
- persistencia via AsyncStorage;
- detalhe e descadastro de tags;
- deteccao de presenca;
- velocidade GPS;
- regras configuraveis e ativaveis individualmente.

As entidades do demo continuam fixas em `examples/demo-app/src/data/entities.ts`. Em uma integracao real, elas devem vir do backend do cliente.

## Estrategia de identificacao

Prioridade recomendada:

1. iBeacon UUID + major + minor.
2. Eddystone namespace + instance.
3. Manufacturer data estavel.
4. Service data estavel.
5. Combinacoes de service UUIDs e local name.
6. MAC Android ou peripheral identifier iOS como fallback especifico da plataforma.
7. Local name apenas como ultimo recurso.

### Estado dos protocolos

- iBeacon: parser implementado e usado no fingerprint/matching.
- Eddystone UID: tipos e matching modelados, parser automatico ainda pendente.

## Regras de presenca do demo

Valores padrao:

```ts
{
  enterWindowMs: 10000,
  lostAfterMs: 30000,
  minDetectionsToEnter: 3,
  minRssi: -85,
  minSpeedToConfirmKmh: 8,
  requireMovementToEnter: true,
  useEnterWindow: true,
  useLostAfter: true,
  useMinDetectionsToEnter: true,
  useMinRssi: true,
}
```

Cada criterio pode ser ligado ou desligado. Os valores ficam persistidos no AsyncStorage do demo.

## Build e validacao

### Comandos principais

```bash
npm install
npm run typecheck:all
npm test
npm run build
npm audit
npm run demo:android:docker
```

### Android

- Build debug executado em container Docker.
- APK: `examples/demo-app/android/app/build/outputs/apk/debug/app-debug.apk`
- Instalacao testada via ADB.
- BLE real, AsyncStorage e GPS foram validados no build nativo.

### iOS

- Build requer macOS + Xcode + CocoaPods.
- Nao e possivel gerar build iOS em container Linux.
- Ainda precisa ser validado em aparelho iOS real.

## Decisoes importantes

- Nao identificar tags apenas pelo nome, pois tags diferentes podem compartilhar o mesmo nome.
- Nao depender apenas de MAC, pois iOS nao expoe o MAC real.
- Tratar RSSI como indicador de proximidade, nao como distancia precisa.
- Manter regras operacionais fora do core do SDK.
- Usar fingerprints ricos para melhorar compatibilidade entre plataformas.
- Manter scanner foreground e monitoramento background como capacidades separadas.

## Limitacoes conhecidas

- BLE advertising e intermitente; perder um pacote nao significa perder presenca.
- RSSI varia por ambiente, corpo, posicao da tag, bateria e aparelho.
- iOS limita scans e execucao em background.
- Android aplica politicas de bateria e restricoes de background.
- Algumas tags anunciam poucos dados estaveis.
- `react-native-ble-plx` sozinho nao fornece monitoramento persistente confiavel com processo encerrado.

## Nova fase: Background Presence Monitoring

Objetivo: permitir que o sistema operacional acorde ou notifique o aplicativo quando uma tag compativel aparecer, evitando manter scan React Native continuo.

### Estrategia iOS

- Usar Core Location para monitoramento de regioes iBeacon.
- Registrar regioes por UUID compartilhado, evitando uma regiao por veiculo.
- Ao receber entrada/saida, acordar o app e emitir evento para React Native.
- Opcionalmente executar ranging/scan curto para identificar major/minor.
- Implementar Core Bluetooth state restoration para casos genericos quando aplicavel.

### Estrategia Android

- Usar `BluetoothLeScanner.startScan()` com filtros e `PendingIntent`.
- Receber resultados em `BroadcastReceiver`.
- Persistir eventos recebidos quando o processo React Native nao estiver ativo.
- Entregar eventos pendentes quando o bridge estiver disponivel.
- Considerar Worker/foreground service apenas quando houver trabalho adicional prolongado.

### Contrato implementado

O SDK deve expor um monitor independente do scanner foreground:

```ts
const monitor = createNativeBackgroundBleMonitor();

await monitor.start({
  filters: [
    {
      type: 'ibeacon',
      uuid: 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
    },
  ],
});

monitor.subscribe((event) => {
  // discovered, entered, exited ou error
});
```

Estado atual:

- contrato TypeScript e bridge React Native implementados;
- fallback noop implementado e testado;
- Android PendingIntent + BroadcastReceiver implementado e compilado no demo;
- fila Android de eventos pendentes implementada;
- iOS Core Location iBeacon region monitoring implementado;
- fila iOS de eventos pendentes implementada;
- autolinking Android/iOS configurado;
- build iOS e validacao em aparelho iOS ainda pendentes.

### Separacao de responsabilidades

- Monitor nativo background: acorda/notifica o app e entrega eventos.
- Scanner foreground: coleta advertisements detalhados.
- Fingerprint/matching: identifica a entidade.
- Aplicativo cliente: aplica regras de negocio e envia eventos ao backend.

## Proximos passos priorizados

1. Integrar monitoramento background ao demo.
2. Validar eventos Android em aparelho com app foreground/background/encerrado.
3. Validar build e eventos em aparelho iOS real.
4. Adicionar parser Eddystone UID.
5. Mapear `filterId` Android a partir dos resultados recebidos.
6. Avaliar Core Bluetooth state restoration para tags nao-iBeacon no iOS.
7. Ampliar testes automatizados da camada nativa.

## Historico recente

- `3779cea feat: manage registered demo tags`
- `1f85cd7 feat: toggle demo presence criteria`
- `d621637 feat: configure demo presence rules`
- `2e3fd32 feat: add demo presence rules`
- `73c0e40 feat: persist demo registrations locally`
- `be573ec feat: enable real ble demo scanning`
- `4cca552 feat: parse ibeacon fingerprints`
- `f3e115d feat: add ble plx scanner`
- `f9f4182 feat: add provider and headless hooks`
- `46cc4e7 feat: scaffold sdk workspace`
