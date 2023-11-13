import { Race } from "@app/shared/enums/race.enum";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { PagingDto } from "../common/paging.dto";

export class CharacterProfileFilterDto extends PagingDto {
	@IsString()
	@IsOptional()
	searchQuery?: string;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	server?: number;

	@IsEnum(Race)
	@IsOptional()
	race?: Race;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	freeCompanyId?: number;

	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	communityId?: number;
}
