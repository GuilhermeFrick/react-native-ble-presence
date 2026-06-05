import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useBlePermissions,
  useBleScanner,
  usePresenceDetection,
  useTagRegistration,
  type BleScanResult,
  type RegisteredTag,
} from '@guilhermefrick/react-native-ble-presence';
import { demoEntities } from './data/entities';
import { useGpsSpeed } from './location/useGpsSpeed';
import { usePresenceRules, type PresenceRulesConfig } from './rules/usePresenceRules';
import { usePresenceRuleSettings } from './rules/usePresenceRuleSettings';
import { deleteStoredTagRegistration } from './storage/createAsyncStorageBlePresenceAdapter';

type DemoView = 'registration' | 'detection';

export function DemoScreen() {
  const [activeView, setActiveView] = useState<DemoView>('registration');
  const [selectedEntityId, setSelectedEntityId] = useState(demoEntities[0]?.id ?? '');
  const [selectedRegisteredTag, setSelectedRegisteredTag] = useState<RegisteredTag | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [lastRegistrationMessage, setLastRegistrationMessage] = useState<string | null>(null);

  const { checkPermissions, permissionStatus, requestPermissions } = useBlePermissions();
  const { clearNearbyTags, isScanning, nearbyTags, scannerStatus, startScan, stopScan } = useBleScanner();
  const { currentMatch, refreshRegisteredTags, registeredTags } = usePresenceDetection();
  const { registerTag } = useTagRegistration();
  const gpsSpeed = useGpsSpeed();
  const presenceRuleSettings = usePresenceRuleSettings();
  const latestTag = nearbyTags[0] ?? null;
  const ruledPresence = usePresenceRules({
    latestTag,
    rawMatch: currentMatch,
    rules: presenceRuleSettings.rules,
    speedKmh: gpsSpeed.speedKmh,
  });

  const selectedTag = useMemo(
    () => nearbyTags.find((tag) => tag.id === selectedTagId) ?? nearbyTags[0],
    [nearbyTags, selectedTagId],
  );
  const selectedEntity = demoEntities.find((entity) => entity.id === selectedEntityId);
  const confirmedMatchEntity = ruledPresence.confirmedMatch
    ? demoEntities.find((entity) => entity.id === ruledPresence.confirmedMatch?.entityId)
    : null;
  const rawMatchEntity = currentMatch ? demoEntities.find((entity) => entity.id === currentMatch.entityId) : null;

  useEffect(() => {
    void checkPermissions();
    void refreshRegisteredTags();
  }, [checkPermissions, refreshRegisteredTags]);

  async function handleToggleScan() {
    if (isScanning) {
      await stopScan();
      return;
    }

    clearNearbyTags();
    await startScan({
      allowDuplicates: true,
      minRssi: -85,
    });
  }

  async function handleRegisterSelectedTag() {
    if (!selectedTag || !selectedEntity) {
      return;
    }

    const result = await registerTag({
      entityId: selectedEntity.id,
      scanResult: selectedTag,
    });

    await refreshRegisteredTags();
    setLastRegistrationMessage(`${selectedEntity.label}: ${result.quality}`);
  }

  async function handleDeleteRegisteredTag(entityId: string) {
    await deleteStoredTagRegistration(entityId);
    setSelectedRegisteredTag(null);
    await refreshRegisteredTags();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BLE Presence Demo</Text>
          <Text style={styles.subtitle}>SDK integrado com scanner BLE real e cadastro local</Text>
        </View>

        <View style={styles.toolbar}>
          <StatusPill label="Permissao" value={permissionStatus} />
          <StatusPill label="Scanner" value={scannerStatus} />
          <StatusPill label="GPS" value={formatSpeed(gpsSpeed.speedKmh)} />
          <StatusPill label="Presenca" value={ruledPresence.status} />
        </View>

        <View style={styles.actions}>
          <ActionButton label="Permitir" onPress={requestPermissions} variant="secondary" />
          <ActionButton label={isScanning ? 'Parar scan' : 'Iniciar scan'} onPress={handleToggleScan} />
          <ActionButton
            label={gpsSpeed.isWatching ? 'Parar GPS' : 'Iniciar GPS'}
            onPress={gpsSpeed.isWatching ? gpsSpeed.stop : gpsSpeed.start}
            variant="secondary"
          />
        </View>

        <View style={styles.tabs}>
          <TabButton
            active={activeView === 'registration'}
            label="Cadastro"
            onPress={() => setActiveView('registration')}
          />
          <TabButton
            active={activeView === 'detection'}
            label="Deteccao"
            onPress={() => setActiveView('detection')}
          />
        </View>

        {activeView === 'registration' ? (
          <View style={styles.screen}>
            <Section title="Entidade">
              <View style={styles.entityGrid}>
                {demoEntities.map((entity) => (
                  <TouchableOpacity
                    key={entity.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedEntityId(entity.id)}
                    style={[styles.entityCard, selectedEntityId === entity.id && styles.selectedCard]}
                  >
                    <Text style={styles.entityTitle}>{entity.label}</Text>
                    <Text style={styles.entityDescription}>{entity.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            <Section title="Tags proximas">
              {nearbyTags.length === 0 ? (
                <EmptyState text="Nenhuma tag BLE detectada" />
              ) : (
                nearbyTags.map((tag) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    selected={selectedTag?.id === tag.id}
                    onPress={() => setSelectedTagId(tag.id)}
                  />
                ))
              )}
            </Section>

            <View style={styles.actions}>
              <ActionButton
                disabled={!selectedTag || !selectedEntity}
                label="Cadastrar tag"
                onPress={handleRegisterSelectedTag}
              />
            </View>

            {lastRegistrationMessage ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Cadastro salvo: {lastRegistrationMessage}</Text>
              </View>
            ) : null}

            <RegisteredTagsSection
              onPressTag={setSelectedRegisteredTag}
              registeredTags={registeredTags}
            />
          </View>
        ) : (
          <View style={styles.screen}>
            <Section title="Presenca confirmada">
              {ruledPresence.confirmedMatch ? (
                <View style={styles.matchBox}>
                  <Text style={styles.matchTitle}>
                    {confirmedMatchEntity?.label ?? ruledPresence.confirmedMatch.entityId}
                  </Text>
                  <Text style={styles.matchText}>Entidade: {ruledPresence.confirmedMatch.entityId}</Text>
                  <Text style={styles.matchText}>Confianca: {ruledPresence.confirmedMatch.confidence}</Text>
                  <Text style={styles.matchText}>Score: {ruledPresence.confirmedMatch.score}</Text>
                  <Text style={styles.matchText}>Campos: {ruledPresence.confirmedMatch.matchedBy.join(', ')}</Text>
                  <Text style={styles.matchText}>Ultimo sinal: {formatDateTime(ruledPresence.lastSeenAt)}</Text>
                </View>
              ) : (
                <EmptyState text="Nenhuma presenca confirmada pelas regras" />
              )}
            </Section>

            <Section title="Regras">
              <View style={styles.ruleBox}>
                <Text style={styles.ruleStatus}>{ruledPresence.reason}</Text>
                <Text style={styles.matchText}>Status: {ruledPresence.status}</Text>
                <Text style={styles.matchText}>
                  Candidato: {ruledPresence.candidateEntityId ?? '-'} ({ruledPresence.candidateDetections}{' '}
                  deteccoes)
                </Text>
                <Text style={styles.matchText}>Velocidade: {formatSpeed(gpsSpeed.speedKmh)}</Text>
                {gpsSpeed.errorMessage ? (
                  <Text style={styles.errorText}>GPS: {gpsSpeed.errorMessage}</Text>
                ) : null}
                <View style={styles.ruleList}>
                  {ruledPresence.ruleSummary.map((rule) => (
                    <Text key={rule} style={styles.ruleChip}>
                      {rule}
                    </Text>
                  ))}
                </View>
              </View>
            </Section>

            <RuleSettingsSection
              isLoaded={presenceRuleSettings.isLoaded}
              onReset={presenceRuleSettings.resetRules}
              onUpdate={presenceRuleSettings.updateRules}
              rules={presenceRuleSettings.rules}
            />

            <Section title="Match BLE bruto">
              {currentMatch ? (
                <View style={styles.matchBox}>
                  <Text style={styles.matchTitle}>{rawMatchEntity?.label ?? currentMatch.entityId}</Text>
                  <Text style={styles.matchText}>Entidade: {currentMatch.entityId}</Text>
                  <Text style={styles.matchText}>Confianca: {currentMatch.confidence}</Text>
                  <Text style={styles.matchText}>Score: {currentMatch.score}</Text>
                </View>
              ) : (
                <EmptyState text="Nenhum match BLE no momento" />
              )}
            </Section>

            <Section title="Tags proximas">
              {nearbyTags.length === 0 ? (
                <EmptyState text="Inicie o scan para detectar tags BLE" />
              ) : (
                nearbyTags.map((tag) => <TagRow key={tag.id} tag={tag} selected={false} />)
              )}
            </Section>

            <RegisteredTagsSection
              onPressTag={setSelectedRegisteredTag}
              registeredTags={registeredTags}
            />
          </View>
        )}
      </ScrollView>

      <RegisteredTagDetailsModal
        onClose={() => setSelectedRegisteredTag(null)}
        onDelete={handleDeleteRegisteredTag}
        registeredTag={selectedRegisteredTag}
      />
    </SafeAreaView>
  );
}

function RuleSettingsSection({
  isLoaded,
  onReset,
  onUpdate,
  rules,
}: {
  isLoaded: boolean;
  onReset(): void;
  onUpdate(patch: Partial<PresenceRulesConfig>): void;
  rules: PresenceRulesConfig;
}) {
  return (
    <Section title="Configuracao de regras">
      <View style={styles.ruleBox}>
        <StepperRule
          enabled={rules.useMinDetectionsToEnter}
          label="Deteccoes para entrar"
          onEnabledChange={(value) => onUpdate({ useMinDetectionsToEnter: value })}
          onChange={(value) => onUpdate({ minDetectionsToEnter: value })}
          step={1}
          suffix="x"
          value={rules.minDetectionsToEnter}
        />
        <StepperRule
          enabled={rules.useEnterWindow}
          label="Janela de entrada"
          onEnabledChange={(value) => onUpdate({ useEnterWindow: value })}
          onChange={(value) => onUpdate({ enterWindowMs: value * 1000 })}
          step={5}
          suffix="s"
          value={Math.round(rules.enterWindowMs / 1000)}
        />
        <StepperRule
          enabled={rules.useLostAfter}
          label="Perder apos"
          onEnabledChange={(value) => onUpdate({ useLostAfter: value })}
          onChange={(value) => onUpdate({ lostAfterMs: value * 1000 })}
          step={5}
          suffix="s"
          value={Math.round(rules.lostAfterMs / 1000)}
        />
        <StepperRule
          enabled={rules.useMinRssi}
          label="RSSI minimo"
          onEnabledChange={(value) => onUpdate({ useMinRssi: value })}
          onChange={(value) => onUpdate({ minRssi: value })}
          step={5}
          suffix="dBm"
          value={rules.minRssi}
        />
        <StepperRule
          enabled={rules.requireMovementToEnter}
          label="Velocidade minima"
          onEnabledChange={(value) => onUpdate({ requireMovementToEnter: value })}
          onChange={(value) => onUpdate({ minSpeedToConfirmKmh: value })}
          step={1}
          suffix="km/h"
          value={rules.minSpeedToConfirmKmh}
        />
        <View style={styles.settingFooter}>
          <Text style={styles.settingSaved}>{isLoaded ? 'Salvo localmente' : 'Carregando regras'}</Text>
          <ActionButton label="Restaurar padrao" onPress={onReset} variant="secondary" />
        </View>
      </View>
    </Section>
  );
}

function StepperRule({
  enabled,
  label,
  onChange,
  onEnabledChange,
  step,
  suffix,
  value,
}: {
  enabled: boolean;
  label: string;
  onChange(value: number): void;
  onEnabledChange(value: boolean): void;
  step: number;
  suffix: string;
  value: number;
}) {
  return (
    <View style={[styles.stepperRow, !enabled && styles.disabledSettingRow]}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingHint}>{enabled ? 'Ativo na decisao' : 'Ignorado pela regra'}</Text>
      </View>
      <View style={styles.stepperControls}>
        <Switch onValueChange={onEnabledChange} value={enabled} />
        <IconButton disabled={!enabled} label="-" onPress={() => onChange(value - step)} />
        <Text style={styles.stepperValue}>
          {value} {suffix}
        </Text>
        <IconButton disabled={!enabled} label="+" onPress={() => onChange(value + step)} />
      </View>
    </View>
  );
}

function IconButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress(): void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconButton, disabled && styles.disabledButton]}
    >
      <Text style={styles.iconButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress(): void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.tabButton, active && styles.activeTabButton]}
    >
      <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RegisteredTagsSection({
  onPressTag,
  registeredTags,
}: {
  onPressTag(registeredTag: RegisteredTag): void;
  registeredTags: RegisteredTag[];
}) {
  return (
    <Section title="Tags cadastradas">
      {registeredTags.length === 0 ? (
        <EmptyState text="Nenhum cadastro local" />
      ) : (
        registeredTags.map((registeredTag) => {
          const entity = demoEntities.find((item) => item.id === registeredTag.entityId);

          return (
            <TouchableOpacity
              accessibilityRole="button"
              key={registeredTag.entityId}
              onPress={() => onPressTag(registeredTag)}
              style={styles.registeredRow}
            >
              <View style={styles.registeredContent}>
                <Text style={styles.registeredTitle}>{entity?.label ?? registeredTag.entityId}</Text>
                <Text style={styles.registeredId}>{registeredTag.entityId}</Text>
              </View>
              <Text style={styles.registeredText}>{registeredTag.fingerprint.quality}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </Section>
  );
}

function RegisteredTagDetailsModal({
  onClose,
  onDelete,
  registeredTag,
}: {
  onClose(): void;
  onDelete(entityId: string): void | Promise<void>;
  registeredTag: RegisteredTag | null;
}) {
  const entity = registeredTag
    ? demoEntities.find((item) => item.id === registeredTag.entityId)
    : null;
  const fingerprint = registeredTag?.fingerprint;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={Boolean(registeredTag)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalTitle}>{entity?.label ?? registeredTag?.entityId ?? 'Tag'}</Text>
              <Text style={styles.modalSubtitle}>{registeredTag?.entityId ?? '-'}</Text>
            </View>
            <IconButton label="x" onPress={onClose} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <DetailRow label="Qualidade" value={fingerprint?.quality} />
            <DetailRow label="Fingerprint ID" value={fingerprint?.id} />
            <DetailRow label="Plataforma" value={fingerprint?.platform} />
            <DetailRow label="Criado em" value={formatDateTime(fingerprint?.createdAt ?? null)} />
            <DetailRow label="Nome local" value={fingerprint?.localName} />
            <DetailRow label="MAC" value={fingerprint?.macAddress} />
            <DetailRow label="Peripheral ID" value={fingerprint?.peripheralId} />
            <DetailRow label="Manufacturer data" value={fingerprint?.manufacturerData} multiline />
            <DetailRow
              label="Service UUIDs"
              value={fingerprint?.serviceUuids.length ? fingerprint.serviceUuids.join(', ') : undefined}
              multiline
            />
            <DetailRow
              label="Service data"
              value={fingerprint?.serviceData ? JSON.stringify(fingerprint.serviceData) : undefined}
              multiline
            />
            <DetailRow
              label="Beacon"
              value={fingerprint?.beacon ? JSON.stringify(fingerprint.beacon) : undefined}
              multiline
            />
            <DetailRow
              label="Metadata"
              value={registeredTag?.metadata ? JSON.stringify(registeredTag.metadata) : undefined}
              multiline
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <ActionButton label="Fechar" onPress={onClose} variant="secondary" />
            {registeredTag ? (
              <ActionButton label="Descadastrar" onPress={() => onDelete(registeredTag.entityId)} />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  label,
  multiline,
  value,
}: {
  label: string;
  multiline?: boolean;
  value?: string | number | null;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, multiline && styles.detailValueMultiline]}>
        {value === undefined || value === null || value === '' ? '-' : String(value)}
      </Text>
    </View>
  );
}

function Section({ children, title }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusPill}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  disabled,
  label,
  onPress,
  variant = 'primary',
}: {
  disabled?: boolean;
  label: string;
  onPress(): void | Promise<unknown>;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.secondaryButtonText]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TagRow({
  onPress,
  selected,
  tag,
}: {
  onPress?(): void;
  selected: boolean;
  tag: BleScanResult;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={[styles.tagRow, selected && styles.selectedCard]}
    >
      <View style={styles.tagHeader}>
        <Text style={styles.tagName}>{tag.localName ?? tag.id}</Text>
        <Text style={styles.rssi}>{tag.rssi ?? '-'} dBm</Text>
      </View>
      <Text style={styles.tagMeta}>{tag.manufacturerData ? 'manufacturerData' : 'sem manufacturerData'}</Text>
      <Text style={styles.tagId}>{tag.id}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function formatSpeed(speedKmh: number | null) {
  return typeof speedKmh === 'number' ? `${speedKmh.toFixed(1)} km/h` : '-';
}

function formatDateTime(value: string | null) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleTimeString();
}

const colors = {
  background: '#f6f7f9',
  border: '#d8dde5',
  ink: '#17202a',
  muted: '#687385',
  panel: '#ffffff',
  primary: '#176b57',
  primarySoft: '#e2f1ec',
  secondary: '#eef1f5',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    gap: 16,
    padding: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 132,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statusLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  statusValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabs: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  activeTabButton: {
    backgroundColor: colors.panel,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  activeTabText: {
    color: colors.ink,
  },
  screen: {
    gap: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  disabledButton: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.ink,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
  },
  entityGrid: {
    gap: 8,
  },
  entityCard: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  selectedCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  entityTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  entityDescription: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  tagRow: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  tagHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  tagName: {
    color: colors.ink,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  rssi: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  tagMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  tagId: {
    color: colors.muted,
    fontSize: 12,
  },
  notice: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  noticeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  matchBox: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    padding: 12,
  },
  matchTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  matchText: {
    color: colors.muted,
    fontSize: 13,
  },
  ruleBox: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  ruleStatus: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  ruleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  ruleChip: {
    backgroundColor: colors.secondary,
    borderRadius: 6,
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  errorText: {
    color: '#a33a2b',
    fontSize: 13,
    fontWeight: '700',
  },
  stepperRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 8,
  },
  settingLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    paddingRight: 12,
  },
  settingText: {
    flex: 1,
    paddingRight: 12,
  },
  settingHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  disabledSettingRow: {
    opacity: 0.72,
  },
  stepperControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stepperValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    minWidth: 76,
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 6,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconButtonText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
  },
  toggleRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingVertical: 8,
  },
  toggleText: {
    flex: 1,
    paddingRight: 12,
  },
  settingFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  settingSaved: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  registeredRow: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  registeredContent: {
    flex: 1,
    paddingRight: 12,
  },
  registeredTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  registeredId: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  registeredText: {
    color: colors.muted,
    fontSize: 13,
  },
  modalBackdrop: {
    backgroundColor: 'rgba(23, 32, 42, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalPanel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    maxHeight: '88%',
    padding: 16,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  modalTitleGroup: {
    flex: 1,
  },
  modalTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  modalContent: {
    gap: 8,
    paddingVertical: 16,
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  detailRow: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 10,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  detailValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  detailValueMultiline: {
    fontWeight: '500',
    lineHeight: 18,
  },
  emptyState: {
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
});
