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
npm run typecheck
npm test
npm run build
```

## Status tecnico

- Monorepo npm workspaces.
- Pacote SDK em TypeScript.
- Core inicial com fingerprint e matching.
- Testes unitarios com Vitest.
- Dockerfile para ambiente Android/Node.
- CI inicial com validacao Linux e smoke iOS em macOS.
