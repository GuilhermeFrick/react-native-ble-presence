# Especificacao Funcional

## Objetivo

Permitir que um aplicativo React Native detecte tags BLE genericas e associe essas tags a entidades cadastradas no sistema do cliente.

O SDK nao deve assumir que a entidade e obrigatoriamente um veiculo. O cliente podera mapear a tag para qualquer entidade do seu dominio.

## Conceitos

### Entity

Representa a entidade de negocio associada a uma tag.

Exemplos:

- veiculo;
- equipamento;
- sala;
- ativo;
- usuario;
- ponto de controle.

### BLE Tag

Dispositivo BLE fisico detectado pelo celular. Pode ser uma tag beacon, iBeacon, Eddystone ou outro dispositivo BLE que anuncie dados em advertising.

### Fingerprint

Assinatura BLE coletada durante o cadastro da tag. Ela deve conter todos os campos disponiveis no momento do scan.

Exemplo conceitual:

```json
{
  "platform": "android",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "peripheralId": null,
  "localName": "BLE_TAG_01",
  "rssi": -58,
  "manufacturerData": "4c000215...",
  "serviceData": {},
  "serviceUuids": ["0000180f-0000-1000-8000-00805f9b34fb"],
  "beacon": {
    "type": "ibeacon",
    "uuid": "e2c56db5-dffb-48d2-b060-d0f5a71096e0f",
    "major": 10,
    "minor": 45
  }
}
```

### Match

Resultado da comparacao entre uma tag detectada e fingerprints cadastrados.

Exemplo:

```json
{
  "entityId": "asset-123",
  "confidence": "high",
  "score": 92,
  "matchedBy": ["manufacturerData", "ibeacon"]
}
```

## Fluxos principais

### 1. Inicializacao do SDK

O aplicativo cliente inicializa o SDK com configuracoes e adapters.

Responsabilidades:

- configurar parametros de scan;
- informar adapter de API ou storage;
- configurar thresholds de RSSI;
- configurar regras de matching;
- expor eventos para o aplicativo hospedeiro.

### 2. Permissoes

O SDK deve auxiliar o aplicativo na verificacao de permissoes necessarias.

Android:

- Bluetooth scan;
- Bluetooth connect, quando aplicavel;
- localizacao, conforme versao do Android e comportamento BLE necessario;
- servicos de localizacao habilitados, quando exigido pelo sistema.

iOS:

- permissao Bluetooth;
- configuracoes de background modes, quando o cliente precisar de comportamento em segundo plano.

O SDK deve expor status claros:

- granted;
- denied;
- blocked;
- unavailable;
- requiresSystemAction.

### 3. Cadastro de tag

Fluxo esperado:

1. Aplicativo cliente informa a entidade que recebera a tag.
2. SDK inicia scan BLE para cadastro.
3. SDK lista candidatos proximos.
4. Operador aproxima o celular da tag desejada.
5. SDK recomenda o candidato mais provavel com base em RSSI e estabilidade do sinal.
6. Operador confirma.
7. SDK gera o fingerprint.
8. Aplicativo cliente salva o fingerprint no backend.
9. SDK retorna a qualidade do cadastro.

Qualidade do cadastro:

- `high`: contem identificador forte, como manufacturer data unico, service data unico ou payload beacon.
- `medium`: contem combinacao razoavel de campos, mas sem identificador claramente unico.
- `low`: depende de nome, service UUID generico ou caracteristicas fracas.
- `platform_specific`: depende de MAC Android ou peripheralId iOS.

### 4. Deteccao de presenca

Fluxo esperado:

1. SDK carrega fingerprints cadastrados.
2. SDK inicia scan BLE.
3. Cada resultado de scan e normalizado.
4. O motor de matching compara a tag detectada com a base local.
5. O SDK emite evento quando uma entidade e identificada.
6. O aplicativo decide como usar o evento.

Eventos:

- tagDetected;
- entityMatched;
- entityLost;
- scanStarted;
- scanStopped;
- permissionChanged;
- error.

### 5. Diagnostico

O SDK deve oferecer informacoes para suporte tecnico:

- tags proximas;
- RSSI atual;
- campos disponiveis por plataforma;
- motivo do match;
- score de confianca;
- alertas de compatibilidade;
- diferenca entre dados vistos no Android e no iOS.

## Estrategia de matching

Ordem sugerida de prioridade:

1. iBeacon UUID + major + minor.
2. Eddystone namespace + instance.
3. Manufacturer data unico.
4. Service data unico.
5. Combinacao de manufacturer data + local name.
6. Combinacao de service UUIDs + local name + padrao de RSSI.
7. MAC address no Android.
8. Peripheral identifier no iOS.
9. Local name como ultimo fallback.

O match deve retornar:

- entidade encontrada;
- nivel de confianca;
- score numerico;
- campos responsaveis pelo match;
- recomendacoes, quando o cadastro for fraco.

## Componentes e APIs esperadas

### Provider

```tsx
<BlePresenceProvider config={config} adapter={adapter}>
  <App />
</BlePresenceProvider>
```

### Hooks

```ts
useBlePermissions()
useBleScanner()
useTagRegistration()
usePresenceDetection()
useNearbyTags()
```

### Componentes opcionais

```tsx
<TagRegistrationScreen />
<NearbyTagsList />
<PresenceStatus />
<BleDiagnosticsPanel />
```

## Fora do escopo inicial

- Fornecer backend obrigatorio.
- Garantir compatibilidade perfeita com qualquer tag BLE existente.
- Conectar em GATT characteristics por padrao.
- Rastrear localizacao GPS.
- Substituir regras de negocio do aplicativo cliente.

