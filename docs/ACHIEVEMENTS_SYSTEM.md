# Achievement System Documentation

Complete documentation for the enhanced achievement and XP system (Sprints 5-7).

## Quick Links
- [Components](#components)
- [Usage Examples](#usage-examples)
- [Performance](#performance-optimizations)

## Components Overview

### Stats Components

- **XPProgressChart** - Daily/cumulative XP line chart
- **WinRateChart** - Win rate trend with average line
- **ComparisonCard** - User vs platform average comparison
- **AdvancedStatsPanel** - Best day, patterns, favorite competitors

### Achievement Components

- **AchievementChain** - Progressive tier chains with visual connections
- **AchievementCard** - Enhanced with temporary badges
- **LevelRewardsPanel** - Level milestone rewards timeline

### Repositories

- **StatsRepository** - All stats/analytics endpoints

## Key Features

1. Progressive achievement chains (4 tiers)
2. Temporary/revocable achievements
3. Level rewards with XP multipliers
4. Advanced statistics and analytics
5. Interactive charts with French locale
6. Loading skeletons for better UX
7. React.memo optimization
8. Comprehensive error handling

## Usage Example

```tsx
import XPProgressChart from '@/app/components/stats/XPProgressChart';
import LevelRewardsPanel from '@/app/components/profile/LevelRewardsPanel';

<XPProgressChart userId={user.id} period="30d" />
<LevelRewardsPanel userId={user.id} currentLevel={user.level} />
```

See full documentation in this file for detailed prop descriptions and examples.
