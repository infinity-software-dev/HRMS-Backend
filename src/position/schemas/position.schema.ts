import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PositionDocument = Position & Document;

@Schema({ timestamps: true })
export class Position {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  name!: string;

  @Prop({ default: true })
  isActive!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const PositionSchema = SchemaFactory.createForClass(Position);
