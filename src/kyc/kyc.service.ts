import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KycService {
    private readonly baseUrl: string;
    private readonly apiKey: string;
    private readonly secretKey: string;
    private readonly apiVersion: string;

    // ── Token Cache (reuse for 23 hours) ──
    private cachedToken: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(private readonly configService: ConfigService) {
        this.baseUrl = this.configService.get<string>('SANDBOX_BASE_URL') || 'https://api.sandbox.co.in';
        this.apiKey = this.configService.get<string>('SANDBOX_API_KEY') || '';
        this.secretKey = this.configService.get<string>('SANDBOX_SECRET_KEY') || '';
        this.apiVersion = this.configService.get<string>('SANDBOX_API_VERSION') || '1.0';
    }

    // ── STEP 1: Generate Sandbox JWT access token (with caching) ──
    private async generateAccessToken(): Promise<string> {
        // Reuse cached token if still valid
        if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.cachedToken;
        }

        const url = `${this.baseUrl}/authenticate`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'x-api-key': this.apiKey,
                    'x-api-secret': this.secretKey,
                    'x-api-version': this.apiVersion,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json() as any;

            // Sandbox returns: { access_token: "...", data: { access_token: "..." } }
            const token = data?.data?.access_token || data?.access_token;

            if (!response.ok || !token) {
                console.error('Sandbox Auth Error:', data);
                throw new InternalServerErrorException(
                    `Sandbox authentication failed: ${data?.message || 'Unknown error'}`
                );
            }

            // Cache token for 23 hours (Sandbox tokens valid 24 hours)
            this.cachedToken = token;
            this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

            return token;
        } catch (err: any) {
            if (err instanceof InternalServerErrorException) throw err;
            console.error('Sandbox Auth Error:', err?.message);
            throw new InternalServerErrorException('Sandbox authentication failed');
        }
    }

    // ── AADHAAR: Send OTP ──
    async aadhaarSendOtp(aadhaarNumber: string): Promise<any> {
        if (!/^\d{12}$/.test(aadhaarNumber)) {
            throw new BadRequestException('Aadhaar number must be exactly 12 digits.');
        }

        const token = await this.generateAccessToken();
        const url = `${this.baseUrl}/kyc/aadhaar/okyc/otp`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': token,          // ⚠️ NO Bearer - Sandbox expects raw token
                'x-api-key': this.apiKey,
                'x-api-version': this.apiVersion,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
                aadhaar_number: aadhaarNumber,
                consent: 'Y',
                reason: 'HRMS Employee KYC Verification',
            }),
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new BadRequestException(data?.message || 'Failed to send Aadhaar OTP');
        }

        return {
            success: true,
            message: 'OTP sent to Aadhaar-registered mobile number.',
            reference_id: data?.data?.reference_id ?? data?.reference_id,
        };
    }

    // ── AADHAAR: Verify OTP ──
    async aadhaarVerifyOtp(referenceId: string, otp: string, employeeName?: string): Promise<any> {
        const token = await this.generateAccessToken();
        const url = `${this.baseUrl}/kyc/aadhaar/okyc/otp/verify`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': token,          // ⚠️ NO Bearer
                'x-api-key': this.apiKey,
                'x-api-version': this.apiVersion,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
                reference_id: String(referenceId),
                otp: String(otp),
            }),
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new BadRequestException(data?.message || 'Aadhaar OTP verification failed');
        }

        const aadhaarResult = data?.data ?? data;
        const aadhaarName = String(
            aadhaarResult?.name ||
            aadhaarResult?.full_name ||
            aadhaarResult?.user_name ||
            aadhaarResult?.data?.name ||
            data?.name ||
            data?.full_name ||
            ''
        ).trim();

        const resolvedName = aadhaarName || employeeName?.trim() || '';

        // Validate name matching if employeeName is provided
        if (employeeName?.trim() && aadhaarName) {
            const cleanAadhaarWords = aadhaarName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
            const cleanEmpWords = employeeName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

            const hasCommonWord = cleanAadhaarWords.some((w: string) => cleanEmpWords.includes(w));
            if (!hasCommonWord) {
                throw new BadRequestException(
                    `Aadhaar card belongs to "${aadhaarName}", which does not match employee "${employeeName}". Verification failed.`
                );
            }
        }

        return {
            success: true,
            message: 'Aadhaar verified successfully.',
            data: aadhaarResult,
            verified_name: resolvedName,
        };
    }

    // ── PAN: Verify ──
    async panVerify(pan: string, nameAsPerPan: string, dateOfBirth: string): Promise<any> {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(pan.toUpperCase().trim())) {
            throw new BadRequestException('Invalid PAN format. Expected format: ABCDE1234F');
        }

        const token = await this.generateAccessToken();
        // ✅ Correct endpoint as per working project
        const url = `${this.baseUrl}/kyc/pan/verify`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': token,          // ⚠️ NO Bearer
                'x-api-key': this.apiKey,
                'x-api-version': this.apiVersion,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                '@entity': 'in.co.sandbox.kyc.pan_verification.request',  // ✅ correct entity
                pan: pan.toUpperCase().trim(),
                name_as_per_pan: nameAsPerPan,
                date_of_birth: dateOfBirth,
                consent: 'Y',
                reason: 'HRMS Employee KYC Verification',
            }),
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new BadRequestException(data?.message || 'PAN verification failed');
        }

        const panResult = data?.data ?? data;

        // Strict verification checks
        if (panResult?.status && String(panResult.status).toUpperCase() !== 'VALID') {
            throw new BadRequestException(`PAN card status is ${panResult.status}. It is not valid.`);
        }
        if (panResult?.name_as_per_pan_match === false) {
            throw new BadRequestException('Name does not match as per PAN records.');
        }
        if (panResult?.date_of_birth_match === false) {
            throw new BadRequestException('Date of birth does not match as per PAN records.');
        }

        return {
            success: true,
            message: 'PAN verified successfully.',
            data: panResult,
        };
    }

    // ── BANK: Verify Account (Penny Drop - GET with path params) ──
    async bankVerify(accountNumber: string, ifsc: string, accountHolderName: string): Promise<any> {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(ifsc.toUpperCase().trim())) {
            throw new BadRequestException('Invalid IFSC format. Expected: HDFC0001234');
        }

        const token = await this.generateAccessToken();
        // ✅ Correct endpoint: GET /bank/{ifsc}/accounts/{account}/verify
        const url = `${this.baseUrl}/bank/${ifsc.toUpperCase().trim()}/accounts/${accountNumber}/verify`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': token,          // ⚠️ NO Bearer
                'x-api-key': this.apiKey,
                'x-api-version': this.apiVersion,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new BadRequestException(data?.message || 'Bank account verification failed');
        }

        return {
            success: true,
            message: 'Bank account verified successfully.',
            data: data?.data ?? data,
        };
    }
}
