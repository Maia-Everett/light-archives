import { CharacterContentDto } from '@app/shared/dto/characters/character-content.dto';
import { CharacterProfileDto } from '@app/shared/dto/characters/character-profile.dto';
import { CharacterRefreshResultDto } from '@app/shared/dto/characters/character-refresh-result.dto';
import { IdWrapper } from '@app/shared/dto/common/id-wrapper.dto';
import { NewProfileDto } from '@app/shared/dto/main-page/new-profile.dto';
import { Role } from '@app/shared/enums/role.enum';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put, UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { UserInfo } from '../auth/user-info';
import { ImagesService } from '../images/images.service';
import { StoriesService } from '../stories/stories.service';
import { CharactersService } from './characters.service';

@Controller('characters')
export class CharactersController {
  constructor(
    private charactersService: CharactersService,
    private storiesService: StoriesService,
    private imagesService: ImagesService,
  ) {}

  @Get('profile/:server/:name')
  @UseGuards(OptionalJwtAuthGuard)
  async getCharacterProfile(
    @Param('name') name: string,
    @Param('server') server: string,
    @CurrentUser() user?: UserInfo,
  ): Promise<CharacterProfileDto> {
    return this.charactersService.getCharacterProfile(name, server, user);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async saveCharacter(
    @Body() profile: CharacterProfileDto,
    @CurrentUser() user: UserInfo,
  ): Promise<void> {
    // TODO: Refactor
    if (user.role === Role.UNVERIFIED) {
      throw new ForbiddenException();
    }

    await this.charactersService.saveCharacter(profile, user);
  }

  @Get()
  async getCharacterList(): Promise<NewProfileDto[]> {
    return this.charactersService.getCharacterList();
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshCharacter(
    @Body() characterId: IdWrapper,
    @CurrentUser() user: UserInfo,
  ): Promise<CharacterRefreshResultDto> {
    return this.charactersService.refreshCharacter(characterId, user);
  }

  @Get('content/:id')
  async getCharacterContent(
    @Param('id', ParseIntPipe) characterId: number,
  ): Promise<CharacterContentDto> {
    const [ stories, images ] = await Promise.all([
      this.storiesService.getStoryList({ characterId }),
      this.imagesService.getImages({ characterId })
    ]);

    return { stories, images };
  }
}
