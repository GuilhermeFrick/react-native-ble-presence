# Background Presence Monitoring

## Objetivo

Permitir que Android ou iOS notifiquem o aplicativo quando uma tag compativel aparece ou deixa de aparecer, sem depender de um scan React Native foreground continuo.

Esta capacidade complementa o scanner `react-native-ble-plx`. Ela nao substitui o scanner detalhado usado para cadastro, diagnostico e fingerprint.

## API

```ts
import { createNativeBackgroundBleMonitor } from '@guilhermefrick/react-native-ble-presence';

const monitor = createNativeBackgroundBleMonitor();

const unsubscribe = monitor.subscribe((event) => {
  console.log(event.type, event.filterId, event.scanResult);
});

await monitor.start({
  filters: [
    {
      id: 'fleet',
      type: 'ibeacon',
      uuid: 'e2c56db5-dffb-48d2-b060-d0f5a71096e0',
    },
  ],
});

const pendingEvents = await monitor.getPendingEvents();
```

Eventos:

- `entered`: filtro encontrado ou regiao iBeacon acessada;
- `exited`: match perdido ou saida da regiao;
- `error`: erro nativo;
- `discovered`: reservado para descobertas que nao representam entrada.

## Android

A implementacao usa:

- `BluetoothLeScanner`;
- filtros iBeacon ou service UUID;
- `PendingIntent`;
- `BroadcastReceiver`;
- SharedPreferences para eventos recebidos sem bridge React Native ativo.

Requisito do app hospedeiro:

```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
```

O app deve solicitar permissao runtime nas versoes aplicaveis.

O monitor por `PendingIntent` requer Android 8/API 26 ou mais recente. Em versoes anteriores, `isAvailable()` retorna `false`.

Eventos de match lost dependem do comportamento do Android/fabricante e devem ser combinados com timeout na regra da aplicacao.

## iOS

A implementacao inicial usa Core Location para regioes iBeacon.

Requisitos do app hospedeiro:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Usamos sua localizacao para detectar tags proximas.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Usamos sua localizacao para detectar tags em background.</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Usamos Bluetooth para detectar tags proximas.</string>
```

Para monitoramento background, o aplicativo deve obter autorizacao de localizacao apropriada conforme sua experiencia e politica de privacidade.

O iOS limita a quantidade de regioes monitoradas. Prefira uma regiao por UUID compartilhado e identifique entidades especificas posteriormente por major/minor.

Nesta fase, filtros `service_uuid` nao sao suportados pelo monitor iOS. Eles continuam disponiveis para Android e para scan foreground.

## Responsabilidades

- Monitor background: acordar/notificar e entregar eventos.
- Scanner foreground: coletar detalhes completos do advertisement.
- Fingerprint/matching: identificar a entidade.
- Aplicativo cliente: aplicar regras de negocio, persistir estado e comunicar backend.

## Limitacoes

- Eventos background nao sao garantidos em tempo real.
- Fabricantes Android podem aplicar restricoes adicionais de bateria.
- Saida/perda pode ser mais lenta ou menos confiavel que entrada.
- iOS iBeacon region monitoring nao entrega RSSI continuamente.
- Testes finais precisam ser executados em aparelhos fisicos.
