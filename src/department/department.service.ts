import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
  ) {}

  // CREATE
  async create(name: string): Promise<Department> {
    try {
      const newDepartment = new this.departmentModel({ name });
      return await newDepartment.save();
    } catch (error :any) {
      if (error.code === 11000) {
        throw new ConflictException('Department already exists');
      }
      throw error;
    }
  }

  // GET ALL (Active and Inactive)
  async findAll(): Promise<Department[]> {
    return this.departmentModel
      .find({})
      .sort({ name: 1 })
      .exec();
  }

  // GET ALL ACTIVE
  async findAllActive(): Promise<Department[]> {
    return this.departmentModel
      .find({ isActive: true })
      .sort({ name: 1 })
      .exec();
  }

  // UPDATE
  async update(id: string, name: string): Promise<Department> {
    try {
      const department = await this.departmentModel
        .findByIdAndUpdate(id, { name }, { new: true, runValidators: true })
        .exec();

      if (!department) {
        throw new NotFoundException('Department not found');
      }

      return department;
    } catch (error :any) {
      if (error.code === 11000) {
        throw new ConflictException('Department already exists');
      }

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw error;
    }
  }

  // DELETE - Soft Delete
  async remove(id: string): Promise<{ message: string }> {
    const department = await this.departmentModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department deleted successfully',
    };
  }

  // RESTORE - Undo Soft Delete
  async restore(id: string): Promise<{ message: string; data: Department }> {
    const department = await this.departmentModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .exec();

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department restored successfully',
      data: department,
    };
  }
}
