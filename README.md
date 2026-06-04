# React Native BLE Presence

SDK React Native para cadastro, identificacao e deteccao de presenca/proximidade por BLE, sem depender de um unico modelo de tag.

O objetivo do projeto e permitir que aplicativos React Native incorporem recursos de leitura BLE para associar tags fisicas a entidades de negocio, como veiculos, ativos, equipamentos, ambientes ou usuarios.

## Documentacao

- [Visao do produto](docs/product-overview.md)
- [Especificacao funcional](docs/functional-specification.md)
- [Plano de execucao](docs/execution-plan.md)
- [Boas praticas de desenvolvimento](docs/development-guidelines.md)

## Escopo inicial

- SDK React Native embarcavel em aplicativos existentes.
- Motor de escaneamento BLE para Android e iOS.
- Cadastro de tags por fingerprint BLE.
- Matching multiplataforma por campos de advertising.
- Indicacao de qualidade/confianca da identificacao.
- Componentes de UI opcionais para fluxo de cadastro e diagnostico.
- App exemplo para demonstrar integracao completa.

## Estrutura inicial

```txt
packages/react-native-ble-presence
examples/demo-app
docs
```

## Desenvolvimento

```bash
npm install
npm run typecheck:all
npm test
npm run build
```

## Uso previsto

```tsx
import {
  BlePresenceProvider,
  createBlePlxScanner,
  useBlePermissions,
  usePresenceDetection,
  useTagRegistration,
} from '@guilhermefrick/react-native-ble-presence';

const scanner = createBlePlxScanner();

function App() {
  return (
    <BlePresenceProvider adapter={adapter} scanner={scanner}>
      <PresenceFeature />
    </BlePresenceProvider>
  );
}

function PresenceFeature() {
  const { permissionStatus, requestPermissions } = useBlePermissions();
  const { currentMatch, refreshRegisteredTags } = usePresenceDetection();
  const { nearbyTags, registerTag } = useTagRegistration();

  // O app cliente decide quando buscar tags cadastradas,
  // qual entidade sera registrada e como exibir a UI.
}
```

O SDK tambem aceita um `permissionManager` customizado para que o app cliente controle a estrategia de permissoes por plataforma.

## Status tecnico

- Monorepo npm workspaces.
- Pacote SDK em TypeScript.
- Core inicial com fingerprint e matching.
- Provider e hooks headless iniciais.
- Contratos de adapter para backend/storage do cliente.
- Contrato de permissoes BLE injetavel.
- Scanner BLE abstrato e implementacao inicial com `react-native-ble-plx`.
- Normalizacao testada de resultados BLE Android/iOS.
- Testes unitarios com Vitest.
- Dockerfile para ambiente Android/Node.
- CI inicial com validacao Linux e smoke iOS em macOS.
- Demo app mockado em `examples/demo-app`.
