export interface SLAPolicy {
  id: string;
  name: string;
  response_time_hours: number;
  resolution_time_hours: number;
}

export interface TicketWithSLA {
  ticket_id: string;
  ticket_number: string;
  created_at: Date;
  responded_at: Date | null;
  resolved_at: Date | null;
  response_met: boolean;
  resolution_met: boolean;
  sla_policy: {
    id: string;
    name: string;
    response_time_hours: number;
    resolution_time_hours: number;
  };
}
