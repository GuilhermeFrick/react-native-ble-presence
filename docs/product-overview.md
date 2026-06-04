# Visao do Produto

## Contexto

Muitos aplicativos moveis precisam identificar proximidade ou presenca fisica sem depender de hardware dedicado de rastreamento. Tags BLE podem ser usadas para indicar que um celular esta proximo de um objeto, veiculo, equipamento, ambiente ou ponto de operacao.

O desafio e que diferentes tags BLE anunciam dados diferentes. Alem disso, Android e iOS expoem informacoes distintas. No Android, o endereco MAC normalmente esta disponivel. No iOS, o MAC real do dispositivo BLE nao e exposto por restricoes de privacidade.

Por isso, a solucao nao deve depender exclusivamente de MAC, nome da tag ou identificadores locais do sistema operacional.

## Proposta

Criar um SDK React Native chamado `react-native-ble-presence`, capaz de ser embarcado em aplicativos de terceiros para:

- escanear dispositivos BLE proximos;
- construir uma assinatura tecnica da tag, chamada de fingerprint;
- cadastrar uma tag e associa-la a uma entidade de negocio;
- identificar posteriormente a entidade associada a uma tag detectada;
- informar o nivel de confianca do match;
- funcionar em Android e iOS com a melhor estrategia disponivel por plataforma.

## Principio central

A solucao deve identificar tags por uma assinatura BLE rica, e nao por um unico campo.

Campos considerados:

- manufacturer data;
- service data;
- service UUIDs;
- payload iBeacon, quando disponivel;
- payload Eddystone, quando disponivel;
- MAC address no Android;
- peripheral identifier no iOS;
- local name como fallback de baixa confianca.

## Publico-alvo

O SDK sera utilizado por empresas que ja possuem aplicativo proprio e desejam incorporar deteccao BLE sem construir toda a camada nativa e de matching do zero.

Exemplos de uso:

- identificar em qual veiculo o usuario esta;
- associar celular a um equipamento proximo;
- detectar entrada em uma sala ou area operacional;
- confirmar proximidade de um ativo;
- automatizar eventos baseados em presenca fisica.

## Entregaveis do projeto

- Pacote SDK React Native.
- Componentes React Native opcionais.
- Hooks e APIs TypeScript.
- Motor de fingerprint e matching.
- App exemplo Android/iOS.
- Documentacao de integracao.
- Guia de permissoes, background scanning e limitacoes por plataforma.

