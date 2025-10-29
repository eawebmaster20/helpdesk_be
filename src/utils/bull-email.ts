import bull from "bull";
import nodemailer from "nodemailer";
import { EmailJob } from "../types/emailJob";

const emailQueue = new bull('emailQueue');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

emailQueue.process(async (job:any) => {
    try {
        let info = await transporter.sendMail(job);
        console.log(`Email sent: ${info}`);
    } catch (error) {
        console.error(`failed to send email:`, error);
    }
});

export const addEmailToQueue = async (emailJob: EmailJob) => {
    await emailQueue.add(emailJob,{
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        }
    });
}
