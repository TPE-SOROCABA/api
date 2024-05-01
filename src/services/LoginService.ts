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
    const groups = await prisma.participantsGroups.findMany({
      where: {
        participantId: participantId,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      }
    });


    const payload = {
      name: name,
      cpf: cpf,
      profile: profile,
      profile_photo: FakeImage({ name, profile_photo }).profile_photo || "",
      groups: groups.map((gp) => ({
        id: gp.group.id,
        name: gp.group.name,
      })),
      id: participantId,
    };

    console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

    return payload;
  }
}
