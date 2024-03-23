import "reflect-metadata";
import { IsString, IsNotEmpty, ValidateNested, IsArray, ArrayNotEmpty, ArrayMinSize, Min, Max, IsEnum, Length, IsOptional, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { BaseValidate } from "../shared/BaseValidate";
import { ParticipantSex } from "../enums/ParticipantSex";
import { ParticipantProfile } from "../enums/ParticipantProfile";
import { Assignments, Designation } from "../domain/Designation";

export class InputDesignationUpdate extends BaseValidate {
  @IsString({ message: "O ID deve ser uma string" })
  @IsNotEmpty({ message: "O ID não pode ser vazio" })
  id: string;

  @ValidateNested()
  group: InputGroup;

  @IsString({ message: "O status deve ser uma string" })
  @IsNotEmpty({ message: "O status não pode ser vazio" })
  status: string;

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => InputAssignment)
  assignments: InputAssignment[];

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => InputParticipant)
  participants: InputParticipant[];

  @IsNotEmpty({ message: "A data de criação não pode estar vazia" })
  createdAt: Date;

  @IsNotEmpty({ message: "A data de atualização não pode estar vazia" })
  updatedAt: Date;

  constructor(id: string, group: InputGroup, status: string, assignments: InputAssignment[], participants: InputParticipant[], createdAt: Date, updatedAt: Date) {
    super();
    this.id = id;
    this.group = group;
    this.status = status;
    this.assignments = assignments;
    this.participants = participants;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static async create(params: Designation): Promise<InputDesignationUpdate> {
    const group = await InputGroup.create(params);
    const assignments = await Promise.all(params.assignments.map(async (assignment) => await InputAssignment.create(assignment)));
    const participants = await Promise.all(params.participants.map(async (participant) => await InputParticipant.create(participant)));

    const createDesignation = new InputDesignationUpdate(params.id, group, params.status, assignments, participants, params.createdAt, params.updatedAt);
    await InputDesignationUpdate.validate(createDesignation);
    return createDesignation;
  }
}

class InputAssignment extends BaseValidate {
  @ValidateNested()
  point: InputPoint;

  @ValidateNested({ each: true })
  @IsArray()
  @ArrayNotEmpty({ message: "O carrinho de publicação não pode estar vazio" })
  @ArrayMinSize(1, { message: "Deve haver pelo menos um item no carrinho de publicação" })
  @Type(() => InputPublicationCart)
  publication_carts: InputPublicationCart[];

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => InputParticipant)
  participants: InputParticipant[];

  @ValidateNested()
  config: InputAssignmentConfig;

  constructor(point: InputPoint, publication_carts: InputPublicationCart[], participants: InputParticipant[], config: InputAssignmentConfig) {
    super();
    this.point = point;
    this.publication_carts = publication_carts;
    this.participants = participants;
    this.config = config;
  }

  static async create(params: Assignments): Promise<InputAssignment> {
    const point = await InputPoint.create(params.point);
    const publicationCart = await Promise.all(params.publication_carts.map(async (cart) => await InputPublicationCart.create(cart)));
    const participants = await Promise.all(params.participants.map(async (participant) => await InputParticipant.create(participant)));
    const config = await InputAssignmentConfig.create(params.config);
    const createAssignment = new InputAssignment(point, publicationCart, participants, config);
    await InputAssignment.validate(createAssignment);
    return createAssignment;
  }
}

class InputParticipant extends BaseValidate {
  @IsString({ message: "O ID deve ser uma string" })
  @IsNotEmpty({ message: "O ID não pode ser vazio" })
  id: string;

  @IsString({ message: "O nome deve ser uma string" })
  @IsNotEmpty({ message: "O nome não pode ser vazio" })
  name: string;

  @IsString({ message: "O telefone deve ser uma string" })
  @IsNotEmpty({ message: "O telefone não pode ser vazio" })
  phone: string;

  @IsEnum(ParticipantProfile, { message: "O perfil deve ser uma das opções válidas: CAPTAIN, COORDINATOR, PARTICIPANT" })
  profile: ParticipantProfile;

  @IsEnum(ParticipantSex, { message: "O sexo deve ser uma das opções válidas: FEMALE, MALE" })
  sex: ParticipantSex;

  private constructor(id: string, name: string, phone: string, profile: ParticipantProfile, sex: ParticipantSex) {
    super();
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.profile = profile;
    this.sex = sex;
  }

  static async create(params: InputParticipant): Promise<InputParticipant> {
    const createParticipant = new InputParticipant(params.id, params.name, params.phone, params.profile, params.sex);
    await InputParticipant.validate(createParticipant);
    return createParticipant;
  }
}

class InputPoint extends BaseValidate {
  @IsString({ message: "O ID deve ser uma string" })
  @IsNotEmpty({ message: "O ID não pode ser vazio" })
  id: string;

  @IsString({ message: "O nome deve ser uma string" })
  @IsNotEmpty({ message: "O nome não pode ser vazio" })
  name: string;

  @IsBoolean({ message: "O status deve ser um booleano" })
  @IsNotEmpty({ message: "O status não pode ser vazio" })
  status: boolean;

  private constructor(id: string, name: string, status: boolean) {
    super();
    this.id = id;
    this.name = name;
    this.status = status;
  }

  static async create(params: InputPoint): Promise<InputPoint> {
    const createPoint = new InputPoint(params.id, params.name, params.status);
    await InputPoint.validate(createPoint);
    return createPoint;
  }
}

class InputPublicationCart extends BaseValidate {
  @IsString({ message: "O ID deve ser uma string" })
  @IsNotEmpty({ message: "O ID não pode ser vazio" })
  id: string;

  @IsString({ message: "O nome deve ser uma string" })
  @IsNotEmpty({ message: "O nome não pode ser vazio" })
  name: string;

  private constructor(id: string, name: string) {
    super();
    this.id = id;
    this.name = name;
  }

  static async create(params: InputPublicationCart): Promise<InputPublicationCart> {
    const createPublicationCart = new InputPublicationCart(params.id, params.name);
    await InputPublicationCart.validate(createPublicationCart);
    return createPublicationCart;
  }
}

class InputGroup extends BaseValidate {
  @IsString({ message: "O ID deve ser uma string" })
  @IsNotEmpty({ message: "O ID não pode ser vazio" })
  id: string;

  @IsString({ message: "O nome deve ser uma string" })
  @IsNotEmpty({ message: "O nome não pode ser vazio" })
  name: string;

  @ValidateNested()
  config: InputGroupConfig;

  private constructor(id: string, name: string, config: InputGroupConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  static async create(params: Designation): Promise<InputGroup> {
    const config = await InputGroupConfig.create(params.group.config);
    const createGroup = new InputGroup(params.group.id, params.group.name, config);
    await InputGroup.validate(createGroup);
    return createGroup;
  }
}

class InputGroupConfig extends BaseValidate {
  @IsString({ message: "A hora de início deve ser uma string" })
  @IsNotEmpty({ message: "A hora de início não pode ser vazia" })
  startHour: string;

  @IsString({ message: "A hora de término deve ser uma string" })
  @IsNotEmpty({ message: "A hora de término não pode ser vazia" })
  endHour: string;

  @IsString({ message: "O dia da semana deve ser uma string" })
  @IsNotEmpty({ message: "O dia da semana não pode ser vazio" })
  weekday: string;

  @IsNotEmpty({ message: "O número mínimo de participantes não pode ser vazio" })
  @Min(1, { message: "O número mínimo de participantes deve ser no mínimo 1" })
  minParticipants: number;

  @IsNotEmpty({ message: "O número máximo de participantes não pode ser vazio" })
  @Max(100, { message: "O número máximo de participantes deve ser no máximo 100" })
  maxParticipants: number;

  private constructor(startHour: string, endHour: string, weekday: string, minParticipants: number, maxParticipants: number) {
    super();
    this.startHour = startHour;
    this.endHour = endHour;
    this.weekday = weekday;
    this.minParticipants = minParticipants;
    this.maxParticipants = maxParticipants;
  }

  static async create(params: InputGroupConfig): Promise<InputGroupConfig> {
    const createGroupConfig = new InputGroupConfig(params.startHour, params.endHour, params.weekday, params.minParticipants, params.maxParticipants);
    await InputGroupConfig.validate(createGroupConfig);
    return createGroupConfig;
  }
}

class InputAssignmentConfig extends BaseValidate {
  @IsNotEmpty({ message: "O valor máximo não pode ser vazio" })
  @Min(1, { message: "O valor máximo deve ser no mínimo 1" })
  max: number;

  @IsNotEmpty({ message: "O valor mínimo não pode ser vazio" })
  @Min(1, { message: "O valor mínimo deve ser no mínimo 1" })
  min: number;

  private constructor(max: number, min: number) {
    super();
    this.max = max;
    this.min = min;
  }

  static async create(params: InputAssignmentConfig): Promise<InputAssignmentConfig> {
    const createAssignmentConfig = new InputAssignmentConfig(params.max, params.min);
    await InputAssignmentConfig.validate(createAssignmentConfig);
    return createAssignmentConfig;
  }
}
