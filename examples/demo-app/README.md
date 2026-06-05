# BLE Presence Demo App

Aplicativo React Native de exemplo para demonstrar a integracao com o SDK `@guilhermefrick/react-native-ble-presence`.

## Objetivo

O demo usa o scanner BLE real via `react-native-ble-plx` e um adapter local com `AsyncStorage`.
Assim, o fluxo pode ser avaliado no aparelho sem backend, mantendo os cadastros salvos entre reinicios do app.

## Fluxos

- verificar permissao BLE;
- iniciar/parar scanner;
- listar tags proximas;
- selecionar entidade na tela de cadastro;
- cadastrar tag no armazenamento local;
- detectar entidade atual na tela de deteccao;
- visualizar confianca e campos usados no match.

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
