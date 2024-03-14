import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";
import { BaseValidate } from "../shared/BaseValidate";
import { IncidentStatus } from "../enums/IncidentStatus";

type InputParticipantIncidentsProps = {
  reason: string;
  status?: IncidentStatus;
};

export class InputParticipantIncidents extends BaseValidate {
  @Length(3, 255, { message: "A propriedade 'reason' deve ter entre 3 e 255 caracteres" })
  @IsString({ message: "A propriedade 'reason' deve ser uma string" })
  reason: string;

  @IsString({ message: "A propriedade 'status' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'status' não pode ser vazia" })
  status: IncidentStatus;

  private constructor(reason: string, status: IncidentStatus = IncidentStatus.OPEN) {
    super();
    this.reason = reason
    this.status = status
  }

  static async create(params: InputParticipantIncidentsProps): Promise<InputParticipantIncidents> {
    const createParticipantIncidents = new InputParticipantIncidents(params.reason, params?.status);
    await InputParticipantIncidents.validate(createParticipantIncidents);
    return createParticipantIncidents;
  }
  
}

export class InputParticipantIncidentsUpdate extends BaseValidate {
  @IsString({ message: "A propriedade 'status' deve ser uma string" })
  @IsNotEmpty({ message: "A propriedade 'status' não pode ser vazia" })
  status: IncidentStatus;

  private constructor(status: IncidentStatus = IncidentStatus.OPEN) {
    super();
    this.status = status
  }
  
  static async create(status: IncidentStatus): Promise<InputParticipantIncidentsUpdate> {
    const createParticipantIncidents = new InputParticipantIncidentsUpdate(status);
    await InputParticipantIncidentsUpdate.validate(createParticipantIncidents);
    return createParticipantIncidents;
  }
}