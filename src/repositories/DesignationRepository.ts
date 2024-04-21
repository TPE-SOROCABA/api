import { Designation } from "../domain/Designation";
import { IDesignationModel } from "../functions/designations/interfaces/IDesignationModel";
import { DesignationMapper } from "../mappers/DesignationMapper";
import { Exception } from "../shared/Exception";

import { prisma } from "../infra/prismaClient";

export class DesignationRepository {
  async findOne(groupId: string) {
    const designationModel = await prisma.designations.findFirst({
      where: {
        groupId: groupId,
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
        },
      }),
    ]);
    await prisma.$transaction(
      designation.assignments.map((assignment) => {
        return prisma.assignments.update({
          where: {
            id: assignment.id,
          },
          data: {
            pointId: assignment.point.id,
            config_max: assignment.config.max,
            config_min: assignment.config.min,
            config_status: assignment.point.status,
          },
        });
      })
    );
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
