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
```

Os comandos Android/iOS serao adicionados quando o projeto nativo do exemplo for gerado.

