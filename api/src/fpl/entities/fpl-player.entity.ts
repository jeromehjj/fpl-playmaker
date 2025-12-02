import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FplClub } from './fpl-club.entity';
import type { FplPosition } from '../types/fpl-position';

@Entity('fpl_players')
export class FplPlayer {
  @PrimaryGeneratedColumn()
  id: number;

  // FPL "element" id from bootstrap-static
  @Index()
  @Column({ type: 'int', unique: true })
  externalId: number;

  @ManyToOne(() => FplClub, (club) => club.players, {
    onDelete: 'RESTRICT',
  })
  club: FplClub;

  @Column({ type: 'varchar' })
  webName: string; // e.g. "Haaland"

  @Column({ type: 'varchar', nullable: true })
  fullName: string | null; // we can fill from first_name + second_name later if we want

  @Column({ type: 'varchar', length: 3 })
  position: FplPosition; // 'GK' | 'DEF' | 'MID' | 'FWD'

  @Column({ type: 'int' })
  nowCost: number; // e.g. 125 = £12.5m

  // Keep raw JSON around in case we need more later
  @Column({ type: 'jsonb', nullable: true })
  raw: unknown;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
