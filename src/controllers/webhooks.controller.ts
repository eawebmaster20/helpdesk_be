const eventLog: any[] = [];

export async function outboundWebhook(req: Request, res: Response) {
  const { event, data } = req.body;
  if (!event || !data) {
    return res.status(400).json({ message: "event and data are required" });
  }
  eventLog.push({ event, data, receivedAt: new Date().toISOString() });
  res.status(200).json({ message: "Event received" });
}

export async function getOutboundLog(req: Request, res: Response) {
  res.json(eventLog);
}
import { Request, Response } from "express";

// Example webhook controller (expand as needed)
export async function handleWebhook(req: Request, res: Response) {
  // Implement webhook logic here
  res.status(501).json({ message: "Not implemented" });
}
