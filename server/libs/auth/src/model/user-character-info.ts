import { NewsRole } from "@app/shared/enums/news-role.enum";
import { Race } from "@app/shared/enums/race.enum";

export class UserCharacterInfo {
  readonly id: number;

  readonly lodestoneId: number;

  readonly name: string;

  readonly server: string;

  readonly avatar: string;
  
  readonly race: Race;

  readonly newsRole: NewsRole;

  readonly verified: boolean;

  constructor(properties: Readonly<UserCharacterInfo>) {
    if (properties) {
      Object.assign(this, properties);
    }
  }
}
