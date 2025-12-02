import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { FplLeague } from './fpl-league.entity';
import type { RawFplEntry } from '../types/fpl-raw-types';

@Entity('fpl_teams')
export class FplTeam {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  entryId: string; // FPL team ID

  @Column({ type: 'varchar' })
  teamName: string;

  @Column({ type: 'varchar' })
  managerName: string;

  @Column({ type: 'varchar' })
  region: string;

  @Column({ type: 'varchar' })
  regionCode: string;

  @Column({ type: 'int' })
  overallPoints: number;

  @Column({ type: 'int' })
  overallRank: number;

  @Column({ type: 'int' })
  gwPoints: number;

  @Column({ type: 'int' })
  gwRank: number;

  @Column({ type: 'int' })
  currentEvent: number;

  @Column({ type: 'timestamptz' })
  lastSyncedAt: Date;

  // Keep a copy of the raw FPL JSON in case we want more later
  @Column({ type: 'jsonb' })
  raw: RawFplEntry;

  @OneToMany(() => FplLeague, (league) => league.team, {
    cascade: true,
  })
  leagues: FplLeague[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
