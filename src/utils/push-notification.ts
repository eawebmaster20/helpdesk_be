import webPush from 'web-push';
import { redisClient } from '../db';
import { Request, Response } from "express";

export function setupPushNotifications() {
    webPush.setVapidDetails(
      'mailto:' + (process.env.VAPID_ADMIN_EMAIL || ''),
      process.env.VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    );
}

export async function sendPushNotification(req:Request, res: Response) {
    try {
        const subs = await redisClient.smembers("L2_USER");
        subs.forEach(async (sub) => {
            console.log('Sending Push Notification to subscription:', sub);
            const parsedSub: webPush.PushSubscription = JSON.parse(sub);
            await webPush.sendNotification(parsedSub, payload);
        });
        console.log('request to subscribe has been received:', req.body);
        const payload = JSON.stringify({ title: 'New Ticket Update', body: req.body.message });
        await webPush.sendNotification(req.body, payload);
    } catch (error) {
        console.error('Error sending Push Notification:', error);
    }
}

export async function subscribeToPushNotifications(payload:{userId:string, subscription:webPush.PushSubscription}): Promise<boolean> {
    try {
        const subscription = payload.subscription;
        const userId = payload.userId;
        if (!subscription || !userId) {
            throw new Error('Invalid subscription or userId: error on push-notifications.ts line 34');
        }
        const subscriptionKey = await getSubscriptionKey(subscription.endpoint, userId);
        await redisClient.set(subscriptionKey, JSON.stringify(subscription));
        await redisClient.sadd("L2_USER", subscriptionKey);
        return true;
        // res.status(201).json({ message: 'Subscribed to Push Notifications successfully' });
    } catch (error) {
        console.error('Error subscribing to Push Notifications:', error);
        return false;
        // res.status(500).json({ message: 'Failed to subscribe to Push Notifications' });
    }
}

async function getSubscriptionKey(endpoint: string, userId: string) {
    const hash = Buffer.from(endpoint).toString('base64').replace(/[/+=]/g, '');
    return `SUBSCRIPTION:${hash}:${userId}`;
}