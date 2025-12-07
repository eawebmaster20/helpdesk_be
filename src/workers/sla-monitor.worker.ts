import { response } from "express";
import { db } from "../db";
import {
  getTicketsComplianceModel,
  updateSLACompliance,
} from "../models/sla.model";

const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

async function checkSLACompliance(): Promise<void> {
  if (
    !process.env.ACTIVATE_SLA ||
    process.env.ACTIVATE_SLA.toLowerCase() !== "true"
  ) {
    console.log("SLA monitoring is disabled");
    return;
  }

  try {
    console.log(
      `[${new Date().toISOString()}] Starting SLA compliance check...`
    );
    const result = await getTicketsComplianceModel();

    const tickets = result;
    console.log(`Found ${tickets.length} tickets to check`);

    for (const ticket of tickets) {
      const createdAt = new Date(ticket.created_at).getTime();
      // Check resolution time breach
      const resolutionTimeMs =
        ticket.sla_policy?.resolution_time_hours * 60 * 60 * 1000;
      const responseMet = ticket.responded_at
        ? new Date(ticket.responded_at).getTime() - createdAt >=
          ticket.sla_policy?.response_time_hours * 60 * 60 * 1000
        : false;
      const resolutionMet = ticket.resolved_at
        ? new Date(ticket.resolved_at).getTime() - createdAt <= resolutionTimeMs
        : false;

      // Update or insert SLA compliance record
      await updateSLACompliance(ticket.ticket_id, "response_met", responseMet);
      await updateSLACompliance(
        ticket.ticket_id,
        "resolution_met",
        resolutionMet
      );
      console.log({
        // ...ticket,
        responded_at:  ticket.responded_at
        ? new Date(ticket.responded_at).getTime()
        : null,
        resolved_at: ticket.resolved_at
        ? new Date(ticket.resolved_at).getTime()
        : null,
        createdAt,
        responseTimeMs:ticket.sla_policy?.response_time_hours * 60 * 60 * 1000,
        responseMet,
        resolutionMet,
      })
    }

    console.log(`[${new Date().toISOString()}] SLA compliance check completed`);
  } catch (error) {
    console.error("Error checking SLA compliance:", error);
  }
}

// Start the worker
export function startSLAMonitor(): void {
  console.log("Starting SLA monitoring worker...");
  console.log(`Check interval: ${CHECK_INTERVAL / 1000} seconds`);

  // Run immediately on startup
  checkSLACompliance();

  // Then run on interval
  setInterval(checkSLACompliance, CHECK_INTERVAL);
}

// For graceful shutdown
export function stopSLAMonitor(): void {
  console.log("Stopping SLA monitoring worker...");
  // Interval cleanup would go here if we stored the interval ID
}
