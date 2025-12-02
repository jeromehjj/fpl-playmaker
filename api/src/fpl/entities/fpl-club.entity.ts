import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FplPlayer } from './fpl-player.entity';

@Entity('fpl_clubs')
export class FplClub {
  @PrimaryGeneratedColumn()
  id: number;

  // FPL "team" id from bootstrap-static
  @Column({ type: 'int', unique: true })
  externalId: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', length: 8 })
  shortName: string;

  @OneToMany(() => FplPlayer, (player) => player.club)
  players: FplPlayer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
