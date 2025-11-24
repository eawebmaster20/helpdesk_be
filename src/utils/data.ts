import { FormattedTicket } from "../models/ticket.model";

export const getTicketCreatedHtmlContent = (ticket: FormattedTicket) => `
<div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 0;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #ec2127; padding: 40px 30px; text-align: center;">
                            <h2 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: -0.5px;"> Star Assurance IT Support</h2>
                            <p style="color: #dbeafe; font-size: 14px; margin: 8px 0 0 0;">Technical Support Services</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <span style="display: inline-block; background-color: #f43228; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px;">Ticket Created</span>

                            <h1 style="color: #1a1a1a; font-size: 22px; margin: 20px 0 16px 0; font-weight: 600;">Your Support Ticket Has Been Created Successfully</h1>

                            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Hello ${ticket.created_by?.name ? ticket.created_by.name : 'Brightest Star'}! Our IT Support team has received your ticket. We're committed to resolving your technical issue as quickly as possible.
                            </p>

                            <table role="presentation" style="width: 100%; background-color: #eff6ff; border-radius: 4px; margin: 25px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.5; font-weight: 600;">Ticket Information:</p>
                                        <p style="margin: 10px 0 0 0; color: #2d3748; font-size: 14px; line-height: 1.8;">
                                            • <strong>Ticket ID:</strong> #${ticket.ticket_number}<br>
                                            • <strong>Category:</strong> ${ticket.category?.name}<br>
                                            • <strong>Priority:</strong> ${ticket.priority?.name}<br>
                                            • <strong>Status:</strong> ${ticket.status}<br>
                                            • <strong>Last Updated:</strong> ${ticket.updated_at.toLocaleString()}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- <table role="presentation" style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; margin: 25px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.5; font-weight: 600;">Technician Notes:</p>
                                        <p style="margin: 10px 0 0 0; color: #4a5568; font-size: 14px; line-height: 1.6; font-style: italic;">
                                            "We've identified the issue and are working on implementing a solution. The software installation requires administrative privileges which we're currently processing. Expected resolution time is within 2-4 hours."
                                        </p>
                                    </td>
                                </tr>
                            </table> -->

                            <!-- <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Click the button below to view your ticket details, add comments, or check the status in our support portal.
                            </p>

                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="text-align: center; padding: 10px 0;">
                                        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Ticket Details</a>
                                    </td>
                                </tr>
                            </table> -->

                            <div style="height: 1px; background-color: #e2e8f0; margin: 25px 0;"></div>

                            <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 25px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                            <strong>Need Urgent Assistance?</strong><br>
                                            For critical issues, please call our help desk at <strong>5003 | 5005 | 5006</strong> or use the live chat feature on our support portal.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                If you have any questions or need additional assistance, please reply to this email or contact our IT Support team directly.
                            </p> -->
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                                <strong style="color: #1a1a1a;">IT Department</strong><br>
                                Email: itsupport@starassurance.com<br>
                                Phone extension: 5003 | 5005 | 5006<br>
                                <!-- Hours: Monday - Friday, 8:00 AM - 5:00 PM GMT -->
                            </p>

                            <div style="margin: 20px 0;">
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Support Portal</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Knowledge Base</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">FAQs</a>
                            </div>

                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0;">
                                This is an automated notification from our ticketing system.<br>
                                <!-- <a href="#" style="color: #3b82f6; text-decoration: none;">Manage Notifications</a>
                                <span style="color: #718096;">|</span>
                                <a href="#" style="color: #3b82f6; text-decoration: none;">Contact IT Admin</a> -->
                            </p>

                            <!-- <p style="color: #718096; font-size: 11px; line-height: 1.6; margin: 20px 0 0 0;">
                                © 2025 IT Support Department. All rights reserved.<br>
                                This email contains confidential information intended only for the recipient.
                            </p> -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>`;

export const getTicketUpdatedHtmlContent = (ticket: FormattedTicket) => `
<div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 0;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #ec2127; padding: 40px 30px; text-align: center;">
                            <h2 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: -0.5px;"> Star Assurance IT Support</h2>
                            <p style="color: #dbeafe; font-size: 14px; margin: 8px 0 0 0;">Helpdesk Services</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
                                <h2 style="color: #1a1a1a;">Ticket Updated: #${ticket.ticket_number}</h2>
                                <p>Hello ${ticket.created_by?.name ? ticket.created_by.name : 'Brightest Star'},</p>
                                <p>We're reaching out to inform you that your ticket has been updated. Here are the details:</p>
                                <ul>
                                    <li><strong>Title:</strong> ${ticket.title}</li>
                                    <li><strong>Description:</strong> ${ticket.description}</li>
                                    <li><strong>Status:</strong> ${ticket.status}</li>
                                    <li><strong>Priority:</strong> ${ticket.priority}</li>
                                    <li><strong>Assignee:</strong> ${ticket.assignee?.name}</li>
                                </ul>
                                <p>Thank you for your patience as we work to resolve your issue.</p>
                                <p>Best regards,<br>The IT Department</p>
                            </div>

                            <div style="height: 1px; background-color: #e2e8f0; margin: 25px 0;"></div>

                            <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 25px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                            <strong>Need Urgent Assistance?</strong><br>
                                            For critical issues, please call our help desk at <strong>5003 | 5005 | 5006</strong> or use the live chat feature on our support portal.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                If you have any questions or need additional assistance, please reply to this email or contact our IT Support team directly.
                            </p> -->
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                                <strong style="color: #1a1a1a;">IT Support Department</strong><br>
                                Email: itsupport@starassurance.com<br>
                                Phone extension: 5003 | 5005 | 5006<br>
                                <!-- Hours: Monday - Friday, 8:00 AM - 6:00 PM EST -->
                            </p>

                            <div style="margin: 20px 0;">
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Support Portal</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Knowledge Base</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">FAQs</a>
                            </div>

                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0;">
                                This is an automated notification from our ticketing system.<br>
                                <!-- <a href="#" style="color: #3b82f6; text-decoration: none;">Manage Notifications</a>
                                <span style="color: #718096;">|</span>
                                <a href="#" style="color: #3b82f6; text-decoration: none;">Contact IT Admin</a> -->
                            </p>

                            <!-- <p style="color: #718096; font-size: 11px; line-height: 1.6; margin: 20px 0 0 0;">
                                © 2025 IT Support Department. All rights reserved.<br>
                                This email contains confidential information intended only for the recipient.
                            </p> -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>
`;

export const getCommentAddedHtmlContent = (ticket: FormattedTicket, comment: string) => `
<div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 0;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #ec2127; padding: 40px 30px; text-align: center;">
                            <h2 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: -0.5px;"> Star Assurance IT Support</h2>
                            <p style="color: #dbeafe; font-size: 14px; margin: 8px 0 0 0;">Helpdesk Services</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                <h2 style="color: #1a1a1a;">New Comment on Ticket: #${ticket.ticket_number}</h2>
                                <p>Hello ${ticket.created_by?.name ? ticket.created_by.name : 'Brightest Star'},</p>
                                <p>A new comment has been added to your ticket:</p>
                                <blockquote style="border-left: 4px solid #3b82f6; padding-left: 12px; color: #4a5568;">
                                    ${comment}
                                </blockquote>
                                <p>Thank you for your patience as we work to resolve your issue.</p>
                                <p>Best regards,<br>The IT Department</p>
                            </div>

                            <div style="height: 1px; background-color: #e2e8f0; margin: 25px 0;"></div>

                            <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 25px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                            <strong>Need Urgent Assistance?</strong><br>
                                            For critical issues, please call our help desk at <strong>5003 | 5005 | 5006</strong> or use the live chat feature on our support portal.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                If you have any questions or need additional assistance, please reply to this email or contact our IT Support team directly.
                            </p> -->
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                                <strong style="color: #1a1a1a;">IT Support Department</strong><br>
                                Email: itsupport@starassurance.com<br>
                                Phone: 5003 | 5005 | 5006<br>
                                <!-- Hours: Monday - Friday, 8:00 AM - 6:00 PM EST -->
                            </p>

                            <div style="margin: 20px 0;">
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Support Portal</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Knowledge Base</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">FAQs</a>
                            </div>

                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0;">
                                This is an automated notification from our ticketing system.<br>
                                <!-- <a href="#" style="color: #3b82f6; text-decoration: none;">Manage Notifications</a>
                                <span style="color: #718096;">|</span>
                                <a href="#" style="color: #3b82f6; text-decoration: none;">Contact IT Admin</a> -->
                            </p>

                            <!-- <p style="color: #718096; font-size: 11px; line-height: 1.6; margin: 20px 0 0 0;">
                                © 2025 IT Support Department. All rights reserved.<br>
                                This email contains confidential information intended only for the recipient.
                            </p> -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>
`;
export const getAttachmentAddedHtmlContent = (ticket: FormattedTicket, attachmentName: string) => `
<div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <h2 style="color: #1a1a1a;">New Attachment on Ticket: #${ticket.ticket_number}</h2>
    <p>Hello ${ticket.created_by?.name ? ticket.created_by.name : 'Brightest Star'},</p>
    <p>A new attachment has been added to your ticket:</p>
    <blockquote style="border-left: 4px solid #3b82f6; padding-left: 12px; color: #4a5568;">
        ${attachmentName}
    </blockquote>
    <p>Thank you for your patience as we work to resolve your issue.</p>
    <p>Best regards,<br>The IT Department</p>
</div>
`;

export const getTicketAssignedHtmlContent = (ticket: FormattedTicket) => `
<div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 0;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-collapse: collapse;">
                    <!-- Header -->
                    <tr>
                        <td style="background: #ec2127; padding: 40px 30px; text-align: center;">
                            <h2 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: -0.5px;"> Star Assurance IT Support</h2>
                            <p style="color: #dbeafe; font-size: 14px; margin: 8px 0 0 0;">Helpdesk Services</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 25px 0;">
                            <div style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                <h2 style="color: #1a1a1a;">Ticket Assigned: #${ticket.ticket_number}</h2>
                                <p>Hello ${ticket.assignee?.name ? ticket.assignee.name : 'Brightest Star'}, Ticket No #${ticket.ticket_number} has been assigned to you, </p>
                                <p>Kindly review it on your dashboard at your earliest convenience.</p>
                                <p>Best regards,<br>The IT Department</p>
                            </div>

                            <div style="height: 1px; background-color: #e2e8f0; margin: 25px 0;"></div>

                            <table role="presentation" style="width: 100%; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 25px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                            <strong>Need Urgent Assistance?</strong><br>
                                            For critical issues, please call our help desk at <strong>5003 | 5005 | 5006</strong> or use the live chat feature on our support portal.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0;">
                                If you have any questions or need additional assistance, please reply to this email or contact our IT Support team directly.
                            </p> -->
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                                <strong style="color: #1a1a1a;">IT Support Department</strong><br>
                                Email: itsupport@starassurance.com<br>
                                Phone: 5003 | 5005 | 5006<br>
                                <!-- Hours: Monday - Friday, 8:00 AM - 6:00 PM EST -->
                            </p>

                            <div style="margin: 20px 0;">
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Support Portal</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">Knowledge Base</a>
                                <span style="color: #718096;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 8px; color: #3b82f6; text-decoration: none; font-size: 14px;">FAQs</a>
                            </div>

                            <p style="color: #718096; font-size: 13px; line-height: 1.6; margin: 0;">
                                This is an automated notification from our ticketing system.<br>
                                <!-- <a href="#" style="color: #3b82f6; text-decoration: none;">Manage Notifications</a>
                                <span style="color: #718096;">|</span>
                                <a href="#" style="color: #3b82f6; text-decoration: none;">Contact IT Admin</a> -->
                            </p>

                            <!-- <p style="color: #718096; font-size: 11px; line-height: 1.6; margin: 20px 0 0 0;">
                                © 2025 IT Support Department. All rights reserved.<br>
                                This email contains confidential information intended only for the recipient.
                            </p> -->
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</div>
`;


// error codes
export const ERROR_CODES:{[key: string]: {code: string, message: string}} = {
    AUTH_INVALID_CREDENTIALS: {code: "ERR-1001", message: "Invalid credentials provided."},
    AUTH_UNAUTHORIZED: {code: "ERR-1002", message: "Unauthorized access."},
    USER_NOT_FOUND: {code: "ERR-2001", message: "User not found."},

    // tickets errors
    TICKET_NOT_FOUND: {code: "ERR-3001", message: "Ticket not found."},
    TICKET_CREATION_FAILED: {code: "ERR-3002", message: "Failed to create ticket."},
    TICKET_UPDATE_FAILED: {code: "ERR-3003", message: "Failed to update ticket."},
    TICKET_DELETE_FAILED: {code: "ERR-3004", message: "Failed to delete ticket."},
    TICKET_ATTACHMENT_FAILED: {code: "ERR-3005", message: "Failed to add attachment to ticket."},

    // email errors
    EMAIL_SENDING_FAILED: {code: "ERR-4001", message: "Failed to send email."},
    EMAIL_QUEUE_FAILED: {code: "ERR-4002", message: "Failed to add email to queue."},

    // database errors
    DB_CONNECTION_FAILED: {code: "ERR-5001", message: "Database connection failed."},
    DB_QUERY_FAILED: {code: "ERR-5002", message: "Database query failed."},
    DB_TRANSACTION_FAILED: {code: "ERR-5003", message: "Database transaction failed."},
    DB_RECORD_NOT_FOUND: {code: "ERR-5004", message: "Database record not found."},
    DB_DUPLICATE_ENTRY: {code: "ERR-5005", message: "Duplicate entry in database."},
    DATABASE_ERROR: {code: "ERR-5006", message: "A database error occurred."},

    // validation errors
    VALIDATION_FAILED: {code: "ERR-6001", message: "Data validation failed."},
    INVALID_INPUT: {code: "ERR-6002", message: "Invalid input provided."},

    SYSTEM_UNKNOWN_ERROR: {code: "ERR-9001", message: "An unknown error occurred."},
};