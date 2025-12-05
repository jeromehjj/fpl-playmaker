export type NuxtUiColor =
  | 'error'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'neutral';

export const difficultyBadgeColor = (d: number): NuxtUiColor => {
  switch (d) {
    case 1:
      return 'success';
    case 2:
      return 'primary';
    case 3:
      return 'neutral';
    case 4:
      return 'warning';
    case 5:
      return 'error';
    default:
      return 'neutral';
  }
};

