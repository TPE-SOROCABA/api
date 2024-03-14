import { IIncidentHistory } from "../repositories/models/IncidentHistoryModel";

export class IncidentHistory {
    participantId: string;
    reporterId: string;
    reason: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  
    private constructor(participantId: string, reporterId: string, reason: string, status: string, createdAt: Date, updatedAt: Date) {
      this.participantId = participantId;
      this.reporterId = reporterId;
      this.reason = reason;
      this.status = status;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }
  
    static create(incidentHistory: Omit<IIncidentHistory, 'createdAt' | 'updatedAt'>): IncidentHistory {
      return new IncidentHistory(incidentHistory.participantId, incidentHistory.reporterId, incidentHistory.reason, incidentHistory.status, new Date(), new Date());
    }

    static fromEntity(incidentHistory: IIncidentHistory): IncidentHistory {
      return new IncidentHistory(incidentHistory.participantId, incidentHistory.reporterId, incidentHistory.reason, incidentHistory.status, incidentHistory.createdAt, new Date());
    }

    changeStatus(status: string): void {
      this.status = status;
      this.updatedAt = new Date();
    }
}