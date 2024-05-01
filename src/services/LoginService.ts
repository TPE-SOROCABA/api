import { FakeImage } from "shared/FakeImage";
import { Designation } from "../domain/Designation";
import { prisma } from "../infra/prismaClient";
import { DesignationRepository } from "../repositories/DesignationRepository";

export interface IParticipant {
  name: string;
  cpf: string;
  profile: string;
  participantId: string;
  profile_photo: string;
}

export class LoginService {
  constructor(private designationRepository: DesignationRepository) {}
  async execute({ participantId, name, cpf, profile, profile_photo }: IParticipant) {
    const group = await prisma.participantsGroups.findFirst({
      where: {
        participantId: participantId,
      },
    });

    let designation: Designation | null = null;

    if (group) {
      designation = await this.designationRepository.findOne(group.groupId).catch((error) => {
        console.error(`Error: ${error}`);
        return null;
      });
    }

    const payload = {
      name: name,
      cpf: cpf,
      profile: profile,
      profile_photo: FakeImage({ name, profile_photo }).profile_photo || "",
      groupId: group?.groupId,
      id: participantId,
      designation: designation
        ? {
            id: designation.id,
            expiration: designation.getNextDate(),
            name: designation.group.name,
          }
        : null,
    };

    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    return payload;
  }
}
