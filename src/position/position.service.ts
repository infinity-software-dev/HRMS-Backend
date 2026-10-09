import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Position, PositionDocument } from './schemas/position.schema';

@Injectable()
export class PositionService {
  constructor(
    @InjectModel(Position.name)
    private positionModel: Model<PositionDocument>,
  ) { }

  // CREATE
  async create(name: string): Promise<Position> {
    try {
      const newPosition = new this.positionModel({ name });
      return await newPosition.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Position already exists');
      }
      throw error;
    }
  }

  // GET ALL (Active and Inactive)
  async findAll(): Promise<Position[]> {
    return this.positionModel
      .find({})
      .sort({ name: 1 })
      .exec();
  }

  // GET ALL ACTIVE
  async findAllActive(): Promise<Position[]> {
    return this.positionModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  // UPDATE NAME
  async update(id: string, name: string): Promise<Position> {
    try {
      const position = await this.positionModel
        .findByIdAndUpdate(id, { name }, { new: true, runValidators: true })
        .exec();

      if (!position) {
        throw new NotFoundException('Position not found');
      }

      return position;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Position already exists');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }



  // ADD SINGLE RESPONSIBILITY
  async addResponsibility(id: string, responsibility: string): Promise<Position> {
    const position = await this.positionModel.findById(id).exec();
    if (!position) throw new NotFoundException('Position not found');
    if (!position.responsibilities) position.responsibilities = [];
    if (!position.responsibilities.includes(responsibility)) {
      position.responsibilities.push(responsibility);
    }
    return await position.save();
  }

  // EDIT SINGLE RESPONSIBILITY
  async editResponsibility(id: string, index: number, newResponsibility: string): Promise<Position> {
    const position = await this.positionModel.findById(id).exec();
    if (!position) throw new NotFoundException('Position not found');
    if (position.responsibilities && position.responsibilities.length > index) {
      position.responsibilities[index] = newResponsibility;
      position.markModified('responsibilities');
      return await position.save();
    }
    return position;
  }

  // REMOVE SINGLE RESPONSIBILITY
  async removeResponsibility(id: string, index: number): Promise<Position> {
    const position = await this.positionModel.findById(id).exec();
    if (!position) throw new NotFoundException('Position not found');
    if (position.responsibilities && position.responsibilities.length > index) {
      position.responsibilities.splice(index, 1);
      position.markModified('responsibilities');
      return await position.save();
    }
    return position;
  }

  // DELETE - Soft Delete
  async remove(id: string): Promise<{ message: string }> {
    const position = await this.positionModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    return { message: 'Position deleted successfully' };
  }

  // RESTORE - Undo Soft Delete
  async restore(id: string): Promise<{ message: string; data: Position }> {
    const position = await this.positionModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .exec();

    if (!position) {
      throw new NotFoundException('Position not found');
    }

    return {
      message: 'Position restored successfully',
      data: position,
    };
  }
}
