import { ToolType, RoadType } from 'shared/types'
import type { DemandIndicators } from 'shared/types'
import type { BuildingId, BuildingCategory } from 'shared/types/building-defs'
import {
  MousePointer2,
  Route,
  Home,
  Store,
  Factory,
  TreePine,
  GraduationCap,
  Cross,
  Flame,
  Shield,
  Zap,
  ArrowBigUp,
  Trash2,
  Trophy,
  ScrollText,
  FlaskConical,
  Mountain,
  Droplets,
  Shovel,
  MountainSnow,
  Building2,
  Waypoints,
  Landmark,
  Warehouse,
  Hotel,
  ShoppingBag,
  Briefcase,
} from 'lucide-react'
import type { ModalType } from './dock-toolbar'

export const TOOL_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  [ToolType.Select]: MousePointer2,
  [ToolType.Road]: Route,
  [ToolType.Highway]: Waypoints,
  [ToolType.Bridge]: Route,
  [ToolType.Tunnel]: Route,
  [ToolType.Residential]: Home,
  [ToolType.Commercial]: Store,
  [ToolType.Industrial]: Factory,
  [ToolType.Park]: TreePine,
  [ToolType.School]: GraduationCap,
  [ToolType.Hospital]: Cross,
  [ToolType.FireStation]: Flame,
  [ToolType.PoliceStation]: Shield,
  [ToolType.PowerPlant]: Zap,
  [ToolType.Upgrade]: ArrowBigUp,
  [ToolType.Demolish]: Trash2,
  [ToolType.FlattenTerrain]: Mountain,
  [ToolType.FillWater]: Droplets,
  [ToolType.DigChannel]: Shovel,
  [ToolType.CreateHill]: MountainSnow,
}

export const BUILDING_ICONS: Partial<
  Record<BuildingId, React.ComponentType<{ size?: number; className?: string }>>
> = {
  house: Home,
  apartment: Hotel,
  residential_complex: Building2,
  shop: Store,
  office: Briefcase,
  mall: ShoppingBag,
  factory: Factory,
  heavy_industry: Factory,
  warehouse: Warehouse,
  park: TreePine,
  plaza: Landmark,
  school: GraduationCap,
  hospital: Cross,
  fire_station: Flame,
  police_station: Shield,
  power_plant: Zap,
}

export const CATEGORY_ICONS: Record<
  BuildingCategory,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  residential: Home,
  commercial: Store,
  industrial: Factory,
  service: Landmark,
}

export const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  residential: '住宅',
  commercial: '商业',
  industrial: '工业',
  service: '服务',
}

export const ROAD_TOOLS = [
  { type: ToolType.Road, roadType: RoadType.Normal },
  { type: ToolType.Highway, roadType: RoadType.Highway },
  { type: ToolType.Bridge, roadType: RoadType.Bridge },
  { type: ToolType.Tunnel, roadType: RoadType.Tunnel },
]

export const ACTION_TOOLS = [
  { type: ToolType.Upgrade },
  { type: ToolType.Demolish },
]

export const TOOL_TO_DEMAND_KEY: Partial<
  Record<ToolType, keyof DemandIndicators>
> = {
  [ToolType.Residential]: 'residential',
  [ToolType.Commercial]: 'commercial',
  [ToolType.Industrial]: 'industrial',
}

export const PANEL_BUTTONS: {
  panel: NonNullable<ModalType>
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}[] = [
  { panel: 'milestones', icon: Trophy, label: '成就' },
  { panel: 'policy', icon: ScrollText, label: '政策' },
  { panel: 'tech', icon: FlaskConical, label: '科技' },
]
