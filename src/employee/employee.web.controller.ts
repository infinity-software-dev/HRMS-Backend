
import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Param, Patch, Post, Query, Req, Request, UseGuards } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { LeaveService } from '../leave/leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Types } from 'mongoose';

@UseGuards(JwtAuthGuard)
@Controller('api/web/employee')
export class EmployeeWebController {

    constructor(
        private readonly employeeService: EmployeeService,
        private readonly leaveService: LeaveService,
    ) { }

    @Get('profile')
    async getProfile(@Req() req) {
        // 2. Extract ID attached by JwtStrategy.validate()
        const userId = req.user.employeeId;

        // 3. Fetch profile
        const profile = await this.employeeService.getEmployeeById(userId);

        if (!profile) {
            throw new NotFoundException('Employee profile not found');
        }

        // 4. Return unified JSON structure matching your attendance controller
        return {
            statusCode: 200,
            message: 'Profile fetched successfully',
            data: profile,
        };
    }

    // MANAGER APPROVAL METRICS
    @Get(':id/approval-metrics')
    async getApprovalMetrics(@Param('id') id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid employee ID format passed in parameters.');
        }

        return await this.employeeService.getManagerApprovalMetrics(id);
    }

    // MANAGER DETAILED REQUESTS
    @Get(':id/detailed-requests')
    async getDetailedRequests(@Param('id') id: string) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid employee ID format passed in parameters.');
        }

        return await this.employeeService.getManagerDetailedRequests(id);
    }

    // MANAGER REQUEST HISTORY
    @Get(':id/requests-history')
    async getRequestsHistory(
        @Param('id') id: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException('Invalid employee ID format passed in parameters.');
        }

        const pageNum = parseInt(page || '1', 10);
        const limitNum = parseInt(limit || '10', 10);

        return await this.employeeService.getManagerActionHistory(
            id,
            pageNum,
            limitNum,
            status,
        );
    }

    // MANAGER APPROVE LEAVE
    @Patch(':managerId/leaves/:leaveId/approve')
    async managerApproveLeave(
        @Param('managerId') managerId: string,
        @Param('leaveId') leaveId: string
    ) {
        if (!Types.ObjectId.isValid(managerId) || !Types.ObjectId.isValid(leaveId)) {
            throw new BadRequestException('Invalid manager or leave tracking ID format.');
        }

        return await this.leaveService.approveLeaveStepByManager(leaveId, managerId);
    }

    // MANAGER REJECT LEAVE
    @Patch(':managerId/leaves/:leaveId/reject')
    async managerRejectLeave(
        @Param('managerId') managerId: string,
        @Param('leaveId') leaveId: string,
        @Body('remarks') remarks: string
    ) {
        if (!Types.ObjectId.isValid(managerId) || !Types.ObjectId.isValid(leaveId)) {
            throw new BadRequestException('Invalid manager or leave tracking ID format.');
        }

        return await this.leaveService.rejectLeaveStepByManager(leaveId, managerId, remarks);
    }

}
