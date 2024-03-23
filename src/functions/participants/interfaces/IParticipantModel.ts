export interface IParticipantModel {
    _id:              string;
    cpf:              string;
    name:             string;
    sex:              string;
    phone:            string;
    profile_photo:    string;
    profile:          string;
    computed:         string;
    __v:              number;
    incident_history: IncidentHistory;
}

export interface IncidentHistory {
    _id:         string;
    participant: string;
    reporter:    string;
    designation: string;
    reason:      string;
    status:      string;
    createdAt:   Date;
    updatedAt:   Date;
    __v:         number;
}
