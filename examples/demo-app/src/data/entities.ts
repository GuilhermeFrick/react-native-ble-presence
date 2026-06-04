export type DemoEntity = {
  id: string;
  label: string;
  description: string;
};

export const demoEntities: DemoEntity[] = [
  {
    id: 'vehicle-001',
    label: 'Caminhao 01',
    description: 'Operacao urbana',
  },
  {
    id: 'asset-042',
    label: 'Gerador 42',
    description: 'Equipamento de campo',
  },
  {
    id: 'room-lab',
    label: 'Laboratorio',
    description: 'Ambiente controlado',
  },
];

