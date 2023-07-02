import { FreeCompanySummaryDto } from '@app/shared/dto/fcs/free-company-summary.dto';
import { FreeCompanyDto } from '@app/shared/dto/fcs/free-company.dto';
import { MyFreeCompanySummaryDto } from '@app/shared/dto/fcs/my-free-company-summary.dto';
import APITransport from './api-transport';

export default class FreeCompaniesAPI {
  private readonly transport: APITransport;

  constructor(transport: APITransport) {
    this.transport = transport.atPath('free-companies');
  }

	async getMyFreeCompany(characterId: number): Promise<MyFreeCompanySummaryDto|null> {
		return this.transport.authGet('my-free-company', { characterId });
	}

	async setFCFromLodestone(characterId: number): Promise<MyFreeCompanySummaryDto|null> {
		return this.transport.authPost('my-free-company', { characterId });
	}

	async unsetFC(characterId: number): Promise<void> {
		return this.transport.authPost('my-free-company/unset', { characterId });
	}

	async getFreeCompanies(): Promise<FreeCompanySummaryDto[]> {
		return this.transport.get<FreeCompanySummaryDto[]>('');
	}

	async getFreeCompanyById(id: number): Promise<FreeCompanyDto> {
		return this.transport.tokenGet<FreeCompanyDto>(`${id}`);
	}

	async getFreeCompany(name: string, server: string): Promise<FreeCompanyDto> {
		return this.transport.tokenGet<FreeCompanyDto>(`profile/${server}/${name}`);
	}

	async saveFreeCompany(fc: FreeCompanyDto): Promise<void> {
		await this.transport.authPut<void>(`/${fc.id}`, fc);
	}
}
