import db from "../sql";

export const logFailedLoginAttempt = async (username: string, ipAddress: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        db.run(
            "INSERT INTO failed_login_attempts (username, ip_address) VALUES (?, ?)",
            [username, ipAddress],
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
