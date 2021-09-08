import { serverConfiguration } from '@app/configuration';
import { Character, Server, User } from '@app/entity';
import { UserSignUpResponseDto } from '@app/shared/dto/user/user-sign-up-response.dto';
import { UserSignUpDto } from '@app/shared/dto/user/user-sign-up.dto';
import { getRaceById } from '@app/shared/enums/race.enum';
import { Role } from '@app/shared/enums/role.enum';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import XIVAPI, { CharacterInfo } from '@xivapi/js';
import bcrypt from 'bcrypt';
import { Connection, Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { generateVerificationCode } from '../util/verification-code';

@Injectable()
export class UserService /* extends TransactionFor<UserService> */ {
  constructor(
    private connection: Connection,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(User) private characterRepo: Repository<Character>,
    @InjectRepository(User) private serverRepo: Repository<Server>,
    private mailService: MailService,
  ) {}

  async signUp(signupData: UserSignUpDto): Promise<UserSignUpResponseDto> {
    const { userEntity, characterEntity } = await this.connection.transaction(
      async (em) => {
        const user = await em.getRepository(User).save({
          email: signupData.email,
          passwordHash: await bcrypt.hash(signupData.password, 10),
          role: Role.USER,
          verificationCode: generateVerificationCode(),
        });

        const server = await em.getRepository(Server).findOne({
          name: signupData.server,
        });

        if (!server) {
          throw new HttpException('Invalid server', HttpStatus.BAD_REQUEST);
        }

        const characterInfo = await this.getLodestoneCharacter(
          signupData.characterName,
          server.name,
        );

        if (!characterInfo) {
          throw new HttpException('Invalid character', HttpStatus.BAD_REQUEST);
        }

        const race = getRaceById(characterInfo.Character.Race);

        if (!race) {
          throw new HttpException('Invalid race', HttpStatus.BAD_REQUEST);
        }

        const character = await em.getRepository(Character).save({
          lodestoneId: characterInfo.Character.ID,
          name: characterInfo.Character.Name,
          race,
          server,
          user,
          verificationCode: generateVerificationCode(),
        });

        return { userEntity: user, characterEntity: character };
      },
    );

    this.sendVerificationMail(userEntity, characterEntity.name); // no await
    return {
      characterVerificationCode: characterEntity.verificationCode,
    };
  }

  private async getLodestoneCharacter(
    name: string,
    server: string,
  ): Promise<CharacterInfo | null> {
    const xivapi = new XIVAPI();
    const searchResults = await xivapi.character.search(name, { server });
    const character = searchResults.Results.find(
      (result) => result.Name.toLowerCase() === name.toLowerCase(),
    );

    if (!character) {
      return null;
    }

    return xivapi.character.get(character.ID);
  }

  private async sendVerificationMail(user: User, name: string): Promise<void> {
    const link = `${serverConfiguration.frontendRoot}/confirm-email/${user.verificationCode}`;
    await this.mailService.sendUserVerificationMail(user.email, name, link);
  }

  async confirmEmail(verificationCode: string): Promise<void> {
    const user = await this.userRepo.findOne({
      verificationCode,
    });

    if (!user) {
      throw new HttpException(
        'Invalid verification code',
        HttpStatus.NOT_FOUND,
      );
    }

    user.verificationCode = null;
    user.verifiedAt = new Date();
    await this.userRepo.save(user);
  }
}
