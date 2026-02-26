const test = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/webhooks/meta", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                object: "page",
                entry: [
                    {
                        id: "1234567890",
                        time: 123123123,
                        messaging: [
                            {
                                sender: { id: "9876543210" },
                                recipient: { id: "1234567890" },
                                message: {
                                    mid: "m_abc123",
                                    text: "Hello, this is a test message from a fake user!"
                                }
                            }
                        ]
                    }
                ]
            })
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
test();
