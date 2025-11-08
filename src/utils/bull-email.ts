import bull from "bull";
import nodemailer from "nodemailer";
import { EmailJob } from "../types/emailJob";
import { getAttachmentAddedHtmlContent, getCommentAddedHtmlContent, getTicketAssignedHtmlContent, getTicketCreatedHtmlContent, getTicketUpdatedHtmlContent } from "./data";
import { FormattedTicket } from "../models/ticket.model";
import { get } from "http";
import { getFormattedUsersByIdModel } from "../models/users.model";

// Configure Redis connection for Bull
const emailQueue = new bull('emailQueue', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
    },
});

// // Add queue event listeners for debugging
// emailQueue.on('ready', () => {
//     console.log('Email queue is ready and connected to Redis');
// });

// emailQueue.on('error', (error) => {
//     console.error('Email queue error:', error);
// });

// emailQueue.on('failed', (job, err) => {
//     console.error(`Job ${job.id} failed:`, err);
// });

// emailQueue.on('completed', (job, result) => {
//     console.log(`Job ${job.id} completed successfully`);
// });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: parseInt(process.env.EMAIL_PORT || "587") === 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

emailQueue.process(async (job: any) => {
    try {
        if (!transporter) {
            console.error("Email transporter not initialized. Email not sent.");
            throw new Error("Email transporter not configured");
        }
        const emailData = job.data;
        
        // Validate required fields
        if (!emailData.to || !emailData.subject) {
            throw new Error("Missing required email fields: to, subject");
        }
        
        const info = await transporter.sendMail(emailData);
        console.log(`Email sent successfully:`, info.messageId);
        
        return info; // Bull expects a return value for successful jobs
    } catch (error) {
        console.error(`Failed to send email for job ${job.id}:`, error);
        throw error; // Re-throw to let Bull handle retries
    }
});

export const addEmailToQueue = async (emailJob: EmailJob): Promise<boolean> => {
    if (process.env.ACTIVATE_EMAIL !== 'true') {
        console.log('Email sending is deactivated. Email not added to queue.');
        return true;
    }
    try {
        await emailQueue.add(emailJob, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: 10, // Keep only 10 completed jobs
            removeOnFail: 5, // Keep only 5 failed jobs
        });
        return true;
    } catch (error) {
        console.error('Failed to add email to queue:', error);
        return false;
    }
}

export const testQueueConnection = async (): Promise<boolean> => {
    try {
        await emailQueue.add('test', { test: true }, { delay: 1000 });
        console.log('✅ Queue connection test job added successfully');
        return true;
    } catch (error) {
        console.error('❌ Queue connection test failed:', error);
        return false;
    }
};


export const sendEmail = async (type: string, to: string[], subject: string, ticket: FormattedTicket, comment?: string, attachmentName?: string) => {
    let htmlContent = '';
    switch (type) {
        case 'ticket_created':
            htmlContent = getTicketCreatedHtmlContent(ticket);
            break;
        case 'ticket_assigned':
            htmlContent = getTicketAssignedHtmlContent(ticket);
            break;
        // Add more cases as needed
        case 'status_update':
            htmlContent = getTicketUpdatedHtmlContent(ticket);
            break;
        case 'comment_added':
            if (comment) {
                htmlContent = getCommentAddedHtmlContent(ticket, comment);
            }
            else {
                console.warn('Comment content is missing for comment_added email type.');
                return;
            }
            break;
        case 'attachment_added':
            if (attachmentName) {
                htmlContent = getAttachmentAddedHtmlContent(ticket, attachmentName);
            }
            else {
                console.warn('Attachment name is missing for attachment_added email type.');
                return;
            }
            break;
        default:
            console.warn(`Unknown email type: ${type}`);
    }
    try {
        const userEmails = await getFormattedUsersByIdModel(to);
        if (!userEmails) {
            console.warn('No valid user emails found for the provided IDs.');
            return;
        }
        for (const recipient of userEmails) {
            await addEmailToQueue({
                from: process.env.EMAIL_USER || '',
                to: recipient,
                subject,
                html: htmlContent
            });
        }
    } catch (error) {
        console.error('Failed to add email to queue:', error);
    }
};