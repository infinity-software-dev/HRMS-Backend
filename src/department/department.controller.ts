import { Controller, Get, Post, Body } from '@nestjs/common';
import { DepartmentService } from './department.service';

@Controller('department')
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) { }

    // POST API: To add a new Department
    // URL: http://localhost:<port>/department
    
}
