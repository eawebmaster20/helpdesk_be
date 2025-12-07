import { response } from "express";
import { db } from "../db";
import { getTicketsComplianceModel } from "../models/sla.model";

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
    // const result = await db.query<TicketWithSLA>(`
    //     SELECT
    //     sc.ticket_id,
    //     t.ticket_number,
    //     t.created_at,
    //     sc.responded_at,
    //     sc.resolved_at,
    //     sc.response_met,
    //     sc.resolution_met,
    //     jsonb_build_object(
    //       'id', sp.id,
    //       'name', sp.name,
    //       'response_time_hours', sp.response_time_hours,
    //       'resolution_time_hours', sp.resolution_time_hours
    //     ) as sla_policy
    //     FROM sla_compliance sc
    //     INNER JOIN tickets t ON sc.ticket_id = t.id
    //     INNER JOIN sla_policies sp ON sc.sla_policy_id = sp.id
    //     INNER JOIN ticket_statuses s ON t.status_id = s.id
    //     WHERE LOWER(s.name) NOT IN ('closed', 'resolved')
    // `);

    const tickets = result;
    console.log(`Found ${tickets.length} tickets to check`);

    for (const ticket of tickets) {
      const now = Date.now();
      const createdAt = new Date(ticket.created_at).getTime();
      const timeSinceCreated = now - createdAt;

      // Check response time breach
      //   const responseTimeMs = ticket.sla?.response_time_hours * 60 * 60 * 1000;
      //   const responseMet = timeSinceCreated <= responseTimeMs;

      // Check resolution time breach
      const resolutionTimeMs =
        ticket.sla_policy?.resolution_time_hours * 60 * 60 * 1000;
      const responseMet = ticket.responded_at
        ? new Date(ticket.responded_at).getTime() - createdAt <=
          ticket.sla_policy?.response_time_hours * 60 * 60 * 1000
        : false;
      const resolutionMet = ticket.resolved_at
        ? new Date(ticket.resolved_at).getTime() - createdAt <= resolutionTimeMs
        : false;
      //   const resolutionMet = timeSinceCreated <= resolutionTimeMs;
      console.log({
        ...ticket,
        resolutionTimeMs,
        timeSinceCreated,
        responseMet,
        resolutionMet,
      });

      // Update or insert SLA compliance record
      //   await db.query(
      //     `
      //     INSERT INTO sla_compliance (ticket_id, sla_policy_id, responded_at, resolved_at, response_met, resolution_met, created_at, updated_at)
      //     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      //     ON CONFLICT (ticket_id)
      //     DO UPDATE SET
      //       response_met = $5,
      //       resolution_met = $6,
      //       updated_at = NOW()
      //   `,
      //     [
      //       ticket.id,
      //       ticket.sla_policy_id,
      //       ticket.responded_at,
      //       ticket.resolved_at,
      //       responseMet,
      //       resolutionMet,
      //     ]
      //   );

      //   if (!responseMet || !resolutionMet) {
      //     console.log(
      //       //   JSON.stringify(
      //       {
      //         level: "warn",
      //         service: "sla-monitor",
      //         event_type: "sla_breach",
      //         ticket_number: ticket.ticket_number,
      //         ticket_id: ticket.id,
      //         response_breached: !responseMet,
      //         resolution_breached: !resolutionMet,
      //         timestamp: new Date().toISOString(),
      //       }
      //       //)
      //     );
      //   }
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
