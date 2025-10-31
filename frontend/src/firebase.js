const axios = require("axios"); // ✅ No need to change anything

const FCM_SERVER_KEY = "BEegbIonwIEDBdssYt2y7hCnNpB8s_XxxHCA4DO7SIe-vIrKXKXENeCXml-sFhu9r5SnO9dtYEd2ZST_h6hyEfQ"; // Replace with your actual key

async function sendNotification(token, title, body) {
    try {
        const response = await axios.post(
            "https://fcm.googleapis.com/fcm/send",
            {
                to: token,
                notification: { title, body }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `key=${FCM_SERVER_KEY}`
                }
            }
        );

        console.log("✅ Notification Sent Successfully:", response.data);
    } catch (error) {
        console.error("❌ Error Sending Notification:", error.response?.data || error.message);
    }
}

// **Send a test notification**
sendNotification("DEVICE_FCM_TOKEN", "Hello!", "This is a test notification.");
