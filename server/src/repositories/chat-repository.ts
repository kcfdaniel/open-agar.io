import db from "../sql";

export const logChatMessage = async (username: string, message: string, ipAddress: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        const timestamp = Date.now();
        db.run(
            "INSERT INTO chat_messages (username, message, ip_address, timestamp) VALUES (?, ?, ?, ?)",
            [username, message, ipAddress, timestamp],
            (err: Error | null) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
};
