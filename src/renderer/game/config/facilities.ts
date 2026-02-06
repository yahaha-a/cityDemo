import { TileType, type FacilityTemplate } from 'shared/game-types'

export const FACILITY_TEMPLATES: FacilityTemplate[] = [
  {
    tileType: TileType.Park,
    name: '公园',
    buildCost: 300,
    maintenanceCost: 5,
    radius: 3,
    effects: [
      { type: 'satisfaction', value: 8, targetTileType: TileType.Residential },
    ],
    unlockTech: 'urban_planning',
  },
  {
    tileType: TileType.School,
    name: '学校',
    buildCost: 500,
    maintenanceCost: 10,
    radius: 4,
    effects: [
      {
        type: 'income_multiplier',
        value: 1.2,
        targetTileType: TileType.Residential,
      },
      { type: 'research_points', value: 3 },
    ],
    unlockTech: 'basic_education',
  },
  {
    tileType: TileType.Hospital,
    name: '医院',
    buildCost: 800,
    maintenanceCost: 15,
    radius: 5,
    effects: [
      { type: 'satisfaction', value: 6 },
      { type: 'crisis_resistance', value: 0.3 },
      {
        type: 'capacity_multiplier',
        value: 1.1,
        targetTileType: TileType.Residential,
      },
    ],
    unlockTech: 'public_health',
  },
  {
    tileType: TileType.FireStation,
    name: '消防局',
    buildCost: 400,
    maintenanceCost: 8,
    radius: 5,
    effects: [{ type: 'crisis_resistance', value: 0.4 }],
    unlockTech: 'basic_infrastructure',
  },
  {
    tileType: TileType.PoliceStation,
    name: '警察局',
    buildCost: 400,
    maintenanceCost: 8,
    radius: 4,
    effects: [
      {
        type: 'efficiency_multiplier',
        value: 1.1,
        targetTileType: TileType.Commercial,
      },
      { type: 'crisis_resistance', value: 0.3 },
    ],
    unlockTech: 'law_enforcement',
  },
  {
    tileType: TileType.PowerPlant,
    name: '发电厂',
    buildCost: 1000,
    maintenanceCost: 20,
    radius: 4,
    effects: [
      {
        type: 'efficiency_multiplier',
        value: 1.3,
        targetTileType: TileType.Industrial,
      },
      {
        type: 'satisfaction',
        value: -10,
        targetTileType: TileType.Residential,
      },
    ],
    unlockTech: 'power_grid',
  },
]

export function getFacilityTemplate(
  tileType: TileType
): FacilityTemplate | undefined {
  return FACILITY_TEMPLATES.find(t => t.tileType === tileType)
}
