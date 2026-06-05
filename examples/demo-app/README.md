# BLE Presence Demo App

Aplicativo React Native de exemplo para demonstrar a integracao com o SDK `@guilhermefrick/react-native-ble-presence`.

## Objetivo

O demo usa o scanner BLE real via `react-native-ble-plx` e um adapter local com `AsyncStorage`.
Assim, o fluxo pode ser avaliado no aparelho sem backend, mantendo os cadastros salvos entre reinicios do app.

## Fluxos

- verificar permissao BLE;
- iniciar/parar scanner;
- iniciar/parar GPS para obter velocidade;
- listar tags proximas;
- selecionar entidade na tela de cadastro;
- cadastrar tag no armazenamento local;
- detectar entidade atual na tela de deteccao usando regras de presenca;
- visualizar confianca e campos usados no match.

## Regras de presenca do demo

O SDK entrega o match BLE bruto. O demo aplica uma camada de regra da aplicacao antes de confirmar presenca.
Esses valores podem ser alterados na aba de deteccao e ficam salvos no armazenamento local do aparelho:

- minimo de 3 deteccoes em 10 segundos;
- RSSI minimo de -85 dBm;
- velocidade GPS minima de 8 km/h para confirmar entrada;
- timeout de 30 segundos sem novo advertisement para perder presenca.

## Comandos

```bash
npm run demo:typecheck
npm run demo:android:docker
```

O comando Android via Docker gera o APK debug em:

```txt
examples/demo-app/android/app/build/outputs/apk/debug/app-debug.apk
```

Para rodar diretamente no host, e necessario ter Android SDK configurado com `ANDROID_HOME` ou `android/local.properties`.

O build iOS requer macOS com Xcode e CocoaPods.
