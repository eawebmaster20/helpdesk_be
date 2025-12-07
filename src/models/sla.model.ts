import { db } from "../db";
import { TicketWithSLA } from "../types/sla";
import { convertSlaTimeToWorkingHours } from "../utils/sla";
import { FormattedTicket } from "./ticket.model";

export async function createSLAModel(
  name: string,
  responseTimeHours: number,
  resolutionTimeHours: number
) {
  const result = await db.query(
    `INSERT INTO sla_policies (name, response_time_hours, resolution_time_hours) VALUES ($1, $2, $3) RETURNING *`,
    [name, responseTimeHours, resolutionTimeHours]
  );
  return result.rows[0];
}

export async function createBulkSLAModel(
  policies: {
    name: string;
    responseTimeHours: number;
    resolutionTimeHours: number;
  }[]
) {
  if (!Array.isArray(policies) || policies.length === 0) {
    throw new Error("policies array is required");
  }

  try {
    await db.query("BEGIN");

    const createdPolicies = [];
    for (const policy of policies) {
      const { name, resolutionTimeHours, responseTimeHours } = policy;
      if (!name) {
        await db.query("ROLLBACK");
        throw new Error("name is required for all policies");
      }

      const result = await db.query(
        `INSERT INTO sla_policies (name, response_time_hours, resolution_time_hours) VALUES ($1, $2, $3) RETURNING *`,
        [name, responseTimeHours, resolutionTimeHours]
      );
      createdPolicies.push(result.rows[0]);
    }

    await db.query("COMMIT");
    return createdPolicies;
  } catch (err) {
    await db.query("ROLLBACK");
    throw new Error("Database error");
  }
}

export async function applySLAPolicyToTicket(
  ticketId: string,
  slaPolicyId: string
): Promise<void> {
  await db.query(`UPDATE tickets SET sla_policy_id = $1 WHERE id = $2`, [
    slaPolicyId,
    ticketId,
  ]);
}

export async function updateSLAModel(
  slaPolicyId: string,
  name: string,
  description: string,
  responseTimeHours: number,
  resolutionTimeHours: number
) {
  const result = await db.query(
    `UPDATE sla_policies SET name = $1, description = $2, response_time_hours = $3, resolution_time_hours = $4 WHERE id = $5 RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours, slaPolicyId]
  );
  return result.rows[0];
}

export async function getAllSLAPoliciesModel() {
  const result = await db.query(`SELECT * FROM sla_policies`);
  return result.rows;
}

export async function getSLAPolicyByIdModel(slaPolicyId: string) {
  const result = await db.query(`SELECT * FROM sla_policies WHERE id = $1`, [
    slaPolicyId,
  ]);
  return result.rows[0];
}

export async function deleteSLAPolicyByIdModel(
  slaPolicyId: string
): Promise<void> {
  await db.query(`DELETE FROM sla_policies WHERE id = $1`, [slaPolicyId]);
}

export async function createSLAWithMinutes(
  name: string,
  description: string,
  responseTimeMinutes: number,
  resolutionTimeMinutes: number
) {
  const responseTimeHours = responseTimeMinutes / 60;
  const resolutionTimeHours = resolutionTimeMinutes / 60;

  const result = await db.query(
    `INSERT INTO sla_policies (name, description, response_time_hours, resolution_time_hours) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, description, responseTimeHours, resolutionTimeHours]
  );
  return result.rows[0];
}

export async function getTicketsComplianceModel() {
  const result = await db.query<TicketWithSLA>(`
          SELECT
          sc.ticket_id,
          t.ticket_number,
          t.created_at,
          sc.responded_at,
          sc.resolved_at,
          sc.response_met,
          sc.resolution_met,
          jsonb_build_object(
            'id', sp.id,
            'name', sp.name,
            'response_time_hours', sp.response_time_hours,
            'resolution_time_hours', sp.resolution_time_hours
          ) as sla_policy
          FROM sla_compliance sc
          INNER JOIN tickets t ON sc.ticket_id = t.id
          INNER JOIN sla_policies sp ON sc.sla_policy_id = sp.id
          INNER JOIN ticket_statuses s ON t.status_id = s.id
          WHERE LOWER(s.name) NOT IN ('closed', 'resolved')
      `);

  return result.rows;
}

export async function addSLACompliance(ticket: FormattedTicket): Promise<void> {
  // Only create SLA compliance record if ticket has SLA policy
  if (!process.env.ACTIVATE_SLA) {
    return;
  }

  try {
    const responseMet = false; //await is_response_met(ticket);
    const resolutionMet = false; //await is_resolution_met(ticket);
    const resolutionExpireAt = await convertSlaTimeToWorkingHours(
      ticket.sla!.resolution_time_hours
    );
    const responseExpireAt = await convertSlaTimeToWorkingHours(
      ticket.sla!.response_time_hours
    );
    console.log({
      responseMet,
      resolutionMet,
      responseExpireAt: responseExpireAt.breachDateISO,
      resolutionExpireAt: resolutionExpireAt.breachDateISO,
    });
    await db.query(
      `
    INSERT INTO sla_compliance (ticket_id, sla_policy_id, responded_at, resolved_at, response_expire_at, resolution_expire_at, response_met, resolution_met, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  `,
      [
        ticket.id,
        ticket.sla!.id,
        null,
        null,
        responseExpireAt.breachDateISO,
        resolutionExpireAt.breachDateISO,
        responseMet,
        resolutionMet,
      ]
    );
  } catch (error) {
    console.error("Error adding SLA compliance record:", error);
    throw error;
  }
  return;
}

export async function updateSLACompliance(
  ticketId: string,
  field: "response" | "resolution"
): Promise<void> {
  const column = field === "response" ? "responded_at" : "resolved_at";
  // const timestampColumn = field === "response" ? "responded_at" : "resolved_at";
  const value = await db.query(
    `
    UPDATE sla_compliance
    SET ${column} = NOW()
    WHERE ticket_id = $1
  `,
    [ticketId]
  );
}

// async function is_response_met(ticket: FormattedTicket): Promise<boolean> {
//   if (
//     ticket?.status?.name.toLocaleLowerCase() === "closed" ||
//     ticket?.status?.name.toLocaleLowerCase() === "resolved"
//   ) {
//     return true;
//   }
//   const responseTimeInMinutes = ticket.sla!.response_time_hours * 60;
//   const timeSinceCreated = Date.now() - new Date(ticket.created_at).getTime();
//   console.log({
//     responseTimeInMinutes: responseTimeInMinutes * 60 * 1000,
//     timeSinceCreated,
//   });
//   return timeSinceCreated <= responseTimeInMinutes * 60 * 1000;
// }

async function is_resolution_met(ticket: FormattedTicket): Promise<boolean> {
  if (
    ticket?.status?.name.toLocaleLowerCase() === "closed" ||
    ticket?.status?.name.toLocaleLowerCase() === "resolved"
  ) {
    return true;
  }
  const resolutionTimeInMinutes = ticket.sla!.resolution_time_hours * 60;
  const timeSinceCreated = Date.now() - new Date(ticket.created_at).getTime();
  return timeSinceCreated <= resolutionTimeInMinutes * 60 * 1000;
}
