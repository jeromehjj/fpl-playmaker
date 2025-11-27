import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FplTeam } from './fpl-team.entity';

@Entity('fpl_leagues')
export class FplLeague {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FplTeam, (team) => team.leagues, { onDelete: 'CASCADE' })
  team: FplTeam;

  @Column({ type: 'int' })
  externalLeagueId: number; // FPL league id from API

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  shortName: string | null;

  @Column({ type: 'varchar' })
  scoring: 'classic' | 'h2h';

  @Column({ type: 'varchar' })
  leagueType: string;

  @Column({ type: 'varchar' })
  rawLeagueType: string;

  @Column({ type: 'boolean' })
  closed: boolean;

  @Column({ type: 'boolean' })
  isAdmin: boolean;

  @Column({ type: 'boolean' })
  canLeave: boolean;

  @Column({ type: 'int', nullable: true })
  entryRank: number | null;

  @Column({ type: 'int', nullable: true })
  entryLastRank: number | null;

  @Column({ type: 'int', nullable: true })
  rankCount: number | null;

  @Column({ type: 'int', nullable: true })
  entryPercentileRank: number | null;

  @Column({ type: 'varchar' })
  category: 'classic-array' | 'h2h-array';
}
