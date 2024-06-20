import { Designation } from "../domain/Designation";
import { IDesignationModel } from "../functions/designations/interfaces/IDesignationModel";
import { DesignationMapper } from "../mappers/DesignationMapper";
import { Exception } from "../shared/Exception";

import { prisma } from "../infra/prismaClient";
import { DesignationStatus } from "@prisma/client";

export class DesignationRepository {
  async findOne(groupId: string) {
    const designationModel = await prisma.designations.findFirst({
      where: {
        groupId: groupId,
        status: {
          not: DesignationStatus.ARCHIVED,
        },
      },
      include: {
        group: {
          include: {
            EventDayGroup: {
              include: {
                eventDay: true,
              },
            },
            ParticipantsGroup: {
              include: {
                participant: {
                  include: {
                    IncidentParticipant: {
                      orderBy: {
                        createdAt: "desc",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            point: true,
            AssignmentsParticipants: {
              include: {
                participant: {
                  include: {
                    IncidentParticipant: {
                      orderBy: {
                        createdAt: "desc",
                      },
                    },
                  },
                },
              },
            },
            AssignmentsPublicationCart: {
              include: {
                publicationCart: true,
              },
            },
          },
        },
      },
    });

    if (!designationModel) {
      throw new Exception(404, "Designação não encontrada");
    }

    return DesignationMapper.toDomain(designationModel as unknown as IDesignationModel);
  }

  async update(designation: Designation) {
    try {
      console.log(`Salvando designação ${designation.id}`);

      console.log("Deletando participantes");
      console.log("Criando associacoes de participantes com as designações");
      await prisma.$transaction([
        prisma.assignmentsParticipants.deleteMany({
          where: {
            assignmentId: {
              in: designation.assignments.map((assignment) => assignment.id),
            },
          },
        }),
        prisma.assignmentsParticipants.createMany({
          data: designation.assignments
            .map((assignment) => {
              return assignment.participants
                .map((participant) => {
                  return {
                    assignmentId: assignment.id,
                    participantId: participant.id,
                  };
                })
                .flat();
            })
            .flat(),
        }),
        prisma.designations.update({
          where: {
            id: designation.id,
          },
          data: {
            status: designation.status,
            cancellationJustification: designation.cancellationJustification,
            mandatoryPresence: designation.mandatoryPresence,
          },
        }),
      ]);
      console.log("Designação salva com sucesso");

      console.log("Atualizando designação que teve alteração de ponto");
      await prisma.$transaction(async (tsx) => {
        const assignmentsOld = await tsx.assignments.findMany({ where: { designationsId: designation.id } });
        const assignmentsNew = designation.assignments;

        for (const old of assignmentsOld) {
          const newAssignment = assignmentsNew.find((a: any) => a.id === old.id);
          if (!newAssignment) continue;

          let isEquals = old.config_status === newAssignment.point.status;
          if (isEquals) continue;

          console.log("Atualizando ponto", newAssignment.point.name);
          await tsx.assignments.update({
            where: {
              id: old.id,
            },
            data: {
              pointId: newAssignment.point.id,
              config_max: newAssignment.config.max,
              config_min: newAssignment.config.min,
              config_status: newAssignment.point.status,
            },
          });
          console.log("Ponto atualizado com sucesso");
        }
      });
      console.log("Designação atualizada com sucesso");
    } catch (error) {
      console.log("Erro ao atualizar designação", error);
      throw new Exception(500, "Erro ao atualizar designação");
    }
  }

  async findByDesignationId(designationId: string): Promise<Designation> {
    const designationModel = await prisma.designations.findFirst({
      where: {
        id: designationId,
      },
      include: {
        group: {
          include: {
            EventDayGroup: {
              include: {
                eventDay: true,
              },
            },
            ParticipantsGroup: {
              include: {
                participant: {
                  include: {
                    IncidentParticipant: true,
                  },
                },
              },
            },
          },
        },
        assignments: {
          include: {
            point: true,
            AssignmentsParticipants: {
              include: {
                participant: {
                  include: {
                    IncidentParticipant: true,
                  },
                },
              },
            },
            AssignmentsPublicationCart: {
              include: {
                publicationCart: true,
              },
            },
          },
        },
      },
    });

    if (!designationModel) {
      throw new Exception(404, "Designação não encontrada");
    }

    return DesignationMapper.toDomain(designationModel as unknown as IDesignationModel);
  }

  async findByParticipantId(participantId: string): Promise<Designation[]> {
    const participantsGroups = await prisma.participantsGroups.findMany({
      where: {
        participantId: participantId,
      },
      include: {
        group: true,
      },
    });

    if (!participantsGroups) {
      throw new Exception(404, "Participante não encontrado");
    }

    return Promise.all(participantsGroups.map(async (pg) => this.findOne(pg.groupId)));
  }
}
