# BLE Presence Demo App

Aplicativo React Native de exemplo para demonstrar a integracao com o SDK `@guilhermefrick/react-native-ble-presence`.

## Objetivo

O demo usa um scanner BLE mockado e um adapter em memoria. Assim, o fluxo pode ser avaliado sem backend, sem tag fisica e sem permissoes nativas.

## Fluxos

- verificar permissao BLE mockada;
- iniciar/parar scanner;
- listar tags proximas;
- selecionar entidade;
- cadastrar tag;
- detectar entidade atual;
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
