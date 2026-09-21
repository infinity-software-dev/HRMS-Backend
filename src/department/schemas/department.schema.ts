import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
    @Prop({ required: true, unique: true, trim: true, uppercase: true })
    name!: string;

    @Prop({ default: true })
    isActive!: boolean;


    createdAt!: Date;
    updatedAt!: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
