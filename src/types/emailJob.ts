import { FormattedTicket } from "../models/ticket.model";

export interface EmailJob {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
    ticket?: FormattedTicket;
}