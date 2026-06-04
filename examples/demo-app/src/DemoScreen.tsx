import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
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
} from '@guilhermefrick/react-native-ble-presence';
import { demoEntities } from './data/entities';

export function DemoScreen() {
  const [selectedEntityId, setSelectedEntityId] = useState(demoEntities[0]?.id ?? '');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [lastRegistrationMessage, setLastRegistrationMessage] = useState<string | null>(null);

  const { checkPermissions, permissionStatus, requestPermissions } = useBlePermissions();
  const { clearNearbyTags, isScanning, nearbyTags, scannerStatus, startScan, stopScan } = useBleScanner();
  const { currentMatch, refreshRegisteredTags, registeredTags } = usePresenceDetection();
  const { registerTag } = useTagRegistration();

  const selectedTag = useMemo(
    () => nearbyTags.find((tag) => tag.id === selectedTagId) ?? nearbyTags[0],
    [nearbyTags, selectedTagId],
  );
  const selectedEntity = demoEntities.find((entity) => entity.id === selectedEntityId);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>BLE Presence Demo</Text>
          <Text style={styles.subtitle}>SDK integrado com scanner e backend mockados</Text>
        </View>

        <View style={styles.toolbar}>
          <StatusPill label="Permissao" value={permissionStatus} />
          <StatusPill label="Scanner" value={scannerStatus} />
        </View>

        <View style={styles.actions}>
          <ActionButton label="Permitir" onPress={requestPermissions} variant="secondary" />
          <ActionButton label={isScanning ? 'Parar scan' : 'Iniciar scan'} onPress={handleToggleScan} />
        </View>

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
            <EmptyState text="Nenhuma tag detectada" />
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
            <Text style={styles.noticeText}>Cadastro: {lastRegistrationMessage}</Text>
          </View>
        ) : null}

        <Section title="Deteccao">
          {currentMatch ? (
            <View style={styles.matchBox}>
              <Text style={styles.matchTitle}>{currentMatch.entityId}</Text>
              <Text style={styles.matchText}>Confianca: {currentMatch.confidence}</Text>
              <Text style={styles.matchText}>Score: {currentMatch.score}</Text>
              <Text style={styles.matchText}>Campos: {currentMatch.matchedBy.join(', ')}</Text>
            </View>
          ) : (
            <EmptyState text="Nenhuma entidade identificada" />
          )}
        </Section>

        <Section title="Tags cadastradas">
          {registeredTags.length === 0 ? (
            <EmptyState text="Nenhum cadastro local" />
          ) : (
            registeredTags.map((registeredTag) => (
              <View key={registeredTag.entityId} style={styles.registeredRow}>
                <Text style={styles.registeredTitle}>{registeredTag.entityId}</Text>
                <Text style={styles.registeredText}>{registeredTag.fingerprint.quality}</Text>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
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
  onPress(): void;
  selected: boolean;
  tag: BleScanResult;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
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
  registeredTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  registeredText: {
    color: colors.muted,
    fontSize: 13,
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
