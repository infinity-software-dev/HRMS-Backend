import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/web/kyc')
export class KycController {
    constructor(private readonly kycService: KycService) {}

    // POST /api/web/kyc/aadhaar/send-otp
    @Post('aadhaar/send-otp')
    async sendAadhaarOtp(@Body('aadhaar_number') aadhaarNumber: string) {
        return this.kycService.aadhaarSendOtp(aadhaarNumber);
    }

    // POST /api/web/kyc/aadhaar/verify-otp
    @Post('aadhaar/verify-otp')
    async verifyAadhaarOtp(
        @Body('reference_id') referenceId: string,
        @Body('otp') otp: string,
        @Body('employee_name') employeeName?: string,
    ) {
        return this.kycService.aadhaarVerifyOtp(referenceId, otp, employeeName);
    }

    // POST /api/web/kyc/pan/verify
    @Post('pan/verify')
    async verifyPan(
        @Body('pan') pan: string,
        @Body('name_as_per_pan') nameAsPerPan: string,
        @Body('date_of_birth') dateOfBirth: string,
    ) {
        return this.kycService.panVerify(pan, nameAsPerPan, dateOfBirth);
    }

    // POST /api/web/kyc/bank/verify
    @Post('bank/verify')
    async verifyBank(
        @Body('account_number') accountNumber: string,
        @Body('ifsc') ifsc: string,
        @Body('account_holder_name') accountHolderName: string,
    ) {
        return this.kycService.bankVerify(accountNumber, ifsc, accountHolderName);
    }
}
