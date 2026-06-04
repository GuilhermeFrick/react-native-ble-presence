# Boas Praticas de Desenvolvimento

## Principios do SDK

- Ser embarcavel em aplicativos existentes.
- Nao impor backend proprio.
- Nao impor interface visual obrigatoria.
- Expor APIs TypeScript claras e estaveis.
- Separar logica core de componentes React Native.
- Retornar erros previsiveis e documentados.
- Explicar o motivo de cada match.
- Tratar diferencas entre Android e iOS como parte do dominio, nao como detalhe escondido.

## Padroes e principios adotados

O desenvolvimento deve seguir principios praticos de engenharia, evitando complexidade desnecessaria, mas mantendo o SDK previsivel para uso por outros times.

Principios:

- API-first: definir os contratos publicos antes de acoplar a implementacao.
- Separation of concerns: separar BLE, permissoes, fingerprint, matching, persistencia e UI.
- Dependency inversion: o SDK define interfaces; o app cliente injeta backend, storage e callbacks.
- Single responsibility: cada modulo deve ter uma responsabilidade clara.
- Open/closed: novas estrategias de matching devem ser adicionadas sem reescrever o motor inteiro.
- Composition over inheritance: preferir composicao de funcoes, hooks e adapters.
- Platform awareness: tratar Android e iOS explicitamente quando o comportamento for diferente.
- Fail-safe defaults: usar configuracoes conservadoras para bateria, privacidade e estabilidade.
- Progressive disclosure: permitir uso simples no inicio e configuracao avancada quando necessario.
- Headless first: a logica principal deve funcionar sem componentes visuais.

Padroes de projeto:

- Adapter pattern para backend, storage e camada BLE.
- Strategy pattern para regras de matching.
- Factory/builder para criacao de fingerprints.
- Observer/event emitter para eventos de scan, match e perda de presenca.
- Provider pattern para integracao React.
- Facade para expor uma API publica pequena e esconder detalhes internos.

## Arquitetura

O SDK deve ser dividido em camadas:

```txt
core/
  matching/
  fingerprint/
  compatibility/

react/
  provider/
  hooks/
  components/

native/
  ble/
  permissions/

types/
```

Diretrizes:

- `core` nao deve depender de React.
- `matching` deve ser testavel com dados estaticos.
- `hooks` devem coordenar estado e ciclo de vida.
- componentes visuais devem ser opcionais.
- adapters devem isolar integracao com backend/storage.

## Orientacao a testes

O projeto deve ser orientado a testes principalmente nas partes deterministicas do SDK.

A abordagem recomendada e TDD pragmatico:

- escrever testes antes ou junto da implementacao para regras de matching, fingerprint e compatibilidade;
- usar fixtures reais de scans Android/iOS sempre que possivel;
- evitar depender de dispositivo fisico para validar regras puras;
- cobrir regressao para bugs encontrados em campo;
- manter testes de UI e BLE nativo mais focados em fluxos criticos, sem tentar simular tudo.

Nem tudo precisa nascer com teste antes do codigo. Componentes visuais e integracoes nativas podem ser desenvolvidos com validacao manual inicial e depois receber testes onde houver estabilidade suficiente.

## Piramide de testes

Prioridade:

1. Testes unitarios do core.
2. Testes de integracao dos hooks e adapters.
3. Testes do app exemplo para fluxos principais.
4. Testes manuais de campo com tags reais.

O core deve concentrar a maior parte da cobertura porque e onde ficam as decisoes criticas do SDK.

## TypeScript

- Usar TypeScript em todo o SDK.
- Exportar tipos publicos.
- Evitar `any` em APIs publicas.
- Preferir tipos discriminados para estados e erros.
- Manter compatibilidade semantica entre versoes.

Exemplo:

```ts
type MatchConfidence = 'high' | 'medium' | 'low' | 'platform_specific' | 'none';
```

## API publica

A API publica deve ser pequena e consistente.

Exemplo:

```ts
export {
  BlePresenceProvider,
  useBlePermissions,
  useBleScanner,
  useTagRegistration,
  usePresenceDetection,
};
```

Evitar expor detalhes internos da biblioteca BLE usada por baixo.

## Permissoes

- Nunca iniciar scan sem checar permissao.
- Expor status claro para o app hospedeiro.
- Documentar diferencas por plataforma e versao do sistema.
- Nao esconder a necessidade de acao manual do usuario quando o sistema exigir.

## BLE

- Normalizar resultados Android/iOS em um modelo proprio.
- Tratar campos ausentes como comportamento esperado.
- Nao depender somente de MAC.
- Nao depender somente de local name.
- Permitir filtros configuraveis, mas manter defaults seguros.
- Evitar scans agressivos por padrao para preservar bateria.

## Matching

- Matching deve ser deterministico.
- Cada match deve retornar explicacao.
- Usar score e nivel de confianca.
- Permitir estrategia configuravel.
- Cobrir casos com testes unitarios.
- Considerar campos especificos de plataforma como menor confianca global.

## UI opcional

Componentes visuais devem:

- ser opcionais;
- aceitar customizacao basica;
- nao bloquear uso headless do SDK;
- comunicar qualidade do cadastro;
- facilitar diagnostico em campo.

## Testes

Camadas prioritarias:

- fingerprint builder;
- parsers de beacon payload;
- motor de matching;
- calculo de confianca;
- reducers/hooks quando houver estado complexo.

Testes de campo devem cobrir:

- Android cadastrando e Android detectando;
- Android cadastrando e iOS detectando;
- iOS cadastrando e Android detectando;
- iOS cadastrando e iOS detectando;
- tags com dados fortes;
- tags com somente nome;
- tags com MAC disponivel apenas no Android.

Fixtures recomendadas:

```txt
fixtures/
  android/
    ibeacon.json
    eddystone.json
    manufacturer-data.json
    mac-only.json
  ios/
    ibeacon.json
    service-data.json
    local-name-only.json
```

Metas iniciais:

- alta cobertura no motor de matching;
- alta cobertura no builder de fingerprint;
- alta cobertura em parsers de payload;
- cobertura suficiente nos hooks para estados de permissao, scan e erro;
- testes de smoke no app exemplo.

## Qualidade e CI

O pipeline deve validar:

- formatacao;
- lint;
- typecheck;
- testes unitarios;
- build do pacote;
- build Android do app exemplo;
- build iOS do app exemplo em runner macOS.

Docker deve ser usado para padronizar Node, Java, Android SDK e ferramentas de build Android.

iOS deve ser compilado em macOS com Xcode. Docker Linux nao substitui o toolchain da Apple.

## Versionamento

- Usar versionamento semantico.
- Mudancas quebrando API devem subir major version.
- Novos campos opcionais sobem minor version.
- Correcoes internas sobem patch version.

## Documentacao obrigatoria

Cada release deve manter atualizado:

- guia de instalacao;
- configuracao Android;
- configuracao iOS;
- permissoes;
- exemplos de uso;
- limitacoes conhecidas;
- changelog.

## Seguranca e privacidade

- Nao coletar localizacao GPS como parte do SDK.
- Nao enviar dados automaticamente para terceiros.
- Deixar o app hospedeiro controlar persistencia e envio ao backend.
- Evitar armazenar dados sensiveis no SDK.
- Documentar que BLE pode exigir permissao de localizacao em alguns cenarios Android.

## Qualidade de entrega

Antes de cada release:

- rodar lint;
- rodar testes;
- validar build TypeScript;
- testar app exemplo;
- revisar API publica;
- atualizar documentacao;
- registrar limitacoes conhecidas.
