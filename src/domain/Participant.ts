import { ParticipantProfile } from "../enums/ParticipantProfile";
import { IParticipant } from "../repositories/models/ParticipantModel";

export class Participant {
    cpf: string;
    name: string;
    sex: string;
    phone: string;
    profile_photo?: string;
    profile: ParticipantProfile;
    computed: string;
  
    private constructor(cpf: string, name: string, sex: string, phone: string, profile_photo: string = "", profile: ParticipantProfile = ParticipantProfile.PARTICIPANT) {
      this.cpf = cpf;
      this.name = name;
      this.sex = sex;
      this.phone = phone;
      this.profile_photo = profile_photo;
      this.profile = profile;
      this.computed = this.calculateComputedField();
    }
  
    private calculateComputedField(): string {
      return `${this.cpf} ${this.name} ${this.phone}`;
    }
  
    static create(participant: Omit<IParticipant, 'computed'>): Participant {
      return new Participant(participant.cpf, participant.name, participant.sex, participant.phone, participant.profile_photo, participant.profile);
    }
  }