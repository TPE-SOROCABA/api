import { DesignationStatus, Groups, Prisma } from "@prisma/client";
import { prisma } from "../infra/prismaClient";
import { Exception, BadRequestException } from "../shared/Exception";
import { WeekdayNumber } from "enums/Weekday";

export class CreateDesignationUseCase {
  constructor(readonly prismaClient = prisma) {}
  async execute(groupId: string) {
    console.log(`Criando designação para o grupo ${groupId}`);
    const group = await this.prismaClient.groups.findFirst({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      throw new Exception(404, "Grupo não encontrado");
    }

    console.log(`Grupo ${group.name} encontrado`);
    await this.prismaClient.$transaction(
      async (transaction) => {
        console.log(`Buscando pontos de publicação do grupo ${group.name}`);
        const pointPublicationCart = await transaction.pointPublicationCart.findMany({
          where: {
            groupId,
          },
        });
        console.log(`Encontrados ${pointPublicationCart.length} pontos de publicação`);
        const pointsIds = pointPublicationCart
          .map((point) => point.pointId)
          .reduce((acc, cur) => {
            if (!acc.includes(cur)) {
              acc.push(cur);
            }
            return acc;
          }, [] as string[]);

        console.log(`Criando designação para o grupo ${group.name}`);
        const designation = await transaction.designations.create({
          data: {
            name: `Designação ${group.name}`,
            groupId,
            status: DesignationStatus.OPEN,
            designationDate: this.getNextDate(new Date(), group),
          },
        });
        console.log(`Designação ${designation.name} criada com sucesso`);

        for (const point of pointsIds) {
          console.log(`Criando atribuição para o ponto ${point}`);
          const assignments = await transaction.assignments.create({
            data: {
              designationsId: designation.id,
              pointId: point,
              config_max: pointPublicationCart.find((pointPublicationCart) => pointPublicationCart.pointId === point)?.maxParticipants!,
              config_min: pointPublicationCart.find((pointPublicationCart) => pointPublicationCart.pointId === point)?.minParticipants!,
              config_status: pointPublicationCart.find((pointPublicationCart) => pointPublicationCart.pointId === point)?.status!,
            },
          });

          const pointAssignments = pointPublicationCart.filter((pointPublicationCart) => pointPublicationCart.pointId === point);
          for (const pointAssignment of pointAssignments) {
            console.log(`Criando atribuição para os carrinhos de publicação do ponto ${point}`);
            await transaction.assignmentsPublicationCart.create({
              data: {
                assignmentId: assignments.id,
                publicationCartId: pointAssignment.publicationCartId,
              },
            });
          }
        }
      },
      {
        maxWait: 10000, // default: 2000
        timeout: 15000, // default: 5000
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // optional, default defined by database configuration
      }
    );
  }

  private getNextDate(today = new Date(), group: Groups): Date {
    const weekday = WeekdayNumber[group.config_weekday];
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + ((+weekday + 7 - today.getDay()) % 7));
    nextDate.setHours(+group.config_start_hour.split(":")[0]);
    nextDate.setMinutes(+group.config_start_hour.split(":")[1]);

    if (nextDate < today) {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    return nextDate;
  }
}
